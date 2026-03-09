#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';
import { YubhubApiClient } from './api-client.js';
import type { YubhubConfig, Feed, FeedStats, Job } from './types.js';
import { generateDashboardHTML } from './dashboard-generator.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getConfig(): YubhubConfig {
  const userId = process.env.YUBHUB_USER_ID || process.env.YUBNUB_USER_ID;
  const adminApiUrl = process.env.YUBHUB_ADMIN_API_URL || process.env.YUBNUB_ADMIN_API_URL ||
    'https://yubnub-admin-api-staging.fluidjobs.workers.dev';

  const apiKey = process.env.YUBHUB_API_KEY;

  if (!userId) {
    throw new Error('YUBHUB_USER_ID environment variable is required');
  }

  return { userId, adminApiUrl, apiKey };
}

function createFeedDashboardHTML(feed: Feed, stats: FeedStats): string {
  const status = feed.is_active ? 'Active' : 'Inactive';
  const statusClass = feed.is_active ? 'active' : 'inactive';
  const lastRun = feed.last_run_at
    ? new Date(feed.last_run_at).toLocaleString()
    : 'Never';
  const enriched = stats.enriched ?? 0;
  const failed = stats.failed ?? 0;
  const name = escapeHtml(feed.name);
  const careersUrl = escapeHtml(feed.careers_url);
  const feedId = escapeHtml(feed.id);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8f9fa;
    }
    .dashboard {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #1a1a1a;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
    }
    .status.active {
      background: #d4edda;
      color: #155724;
    }
    .status.inactive {
      background: #f8d7da;
      color: #721c24;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin: 16px 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    .button {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      margin-top: 16px;
    }
    .button:hover {
      background: #0056b3;
    }
    .button:active {
      background: #004085;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <h1>${name}</h1>
    <span class="status ${statusClass}">${status}</span>

    <div class="meta">
      <div><strong>Feed ID:</strong> ${feedId}</div>
      <div><strong>Careers URL:</strong> <a href="${careersUrl}" target="_blank">${careersUrl}</a></div>
      <div><strong>Last Run:</strong> ${lastRun}</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Jobs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${enriched}</div>
        <div class="stat-label">Enriched</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${failed}</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>

    <button class="button" onclick="triggerRun()">
      Trigger Feed Run
    </button>
  </div>

  <script>
    function triggerRun() {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'trigger_feed_run',
          params: { feedId: '${feedId}' }
        }
      }, '*');
    }
  </script>
</body>
</html>
  `;
}

function formatFeedsList(feeds: Feed[]): string {
  if (feeds.length === 0) {
    return '# Your Feeds\n\nNo feeds found. Create your first feed to get started.';
  }

  const feedsList = feeds.map(feed => {
    const status = feed.is_active ? '✅ Active' : '⚪ Inactive';
    const lastRun = feed.last_run_at
      ? new Date(feed.last_run_at).toLocaleString()
      : 'Never run';

    return `### ${feed.name}
- **ID**: \`${feed.id}\`
- **Status**: ${status}
- **Careers URL**: ${feed.careers_url}
- **Last Run**: ${lastRun}`;
  }).join('\n\n');

  return `# Your Feeds (${feeds.length} total)\n\n${feedsList}`;
}

function formatJobsList(jobs: Job[], feedName: string): string {
  if (jobs.length === 0) {
    return `# Jobs for ${feedName}\n\nNo jobs found. Trigger a feed run to discover jobs.`;
  }

  const jobsList = jobs.map(job => {
    const statusEmoji = {
      discovered: '🔍',
      scraped: '📄',
      enriched: '✅',
      failed: '❌'
    }[job.status];

    const title = job.title || 'Untitled Job';
    const company = job.company ? `**Company**: ${job.company}` : '';
    const location = job.location ? `**Location**: ${job.location}` : '';
    const discovered = new Date(job.discovered_at).toLocaleString();

    return `### ${statusEmoji} ${title}
${company}
${location}
**Status**: ${job.status}
**Source**: ${job.source_url}
**Discovered**: ${discovered}`;
  }).join('\n\n');

  return `# Jobs for ${feedName} (${jobs.length} total)\n\n${jobsList}`;
}

function formatJobDetail(job: Job): string {
  const statusEmoji = {
    discovered: '🔍 Discovered',
    scraped: '📄 Scraped',
    enriched: '✅ Enriched',
    failed: '❌ Failed'
  }[job.status];

  const title = job.title || 'Untitled Job';
  const company = job.company || 'Unknown Company';
  const location = job.location || 'Location not specified';
  const description = job.description || 'No description available';

  let enrichmentFields = '';
  if (job.status === 'enriched' && (job.job_type || job.experience_level || job.work_arrangement || job.salary_range || job.skills || job.company_website)) {
    enrichmentFields = '\n## Enrichment Data\n\n';

    if (job.job_type) enrichmentFields += `- **Job Type**: ${job.job_type}\n`;
    if (job.experience_level) enrichmentFields += `- **Experience Level**: ${job.experience_level}\n`;
    if (job.work_arrangement) enrichmentFields += `- **Work Arrangement**: ${job.work_arrangement}\n`;
    if (job.salary_range) enrichmentFields += `- **Salary Range**: ${job.salary_range}\n`;
    if (job.company_website) enrichmentFields += `- **Company Website**: ${job.company_website}\n`;
    if (job.company_logo_url) enrichmentFields += `- **Company Logo**: ${job.company_logo_url}\n`;

    if (job.skills) {
      try {
        const skillsData = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
        if (skillsData.required && skillsData.required.length > 0) {
          enrichmentFields += `- **Required Skills**: ${skillsData.required.join(', ')}\n`;
        }
        if (skillsData.preferred && skillsData.preferred.length > 0) {
          enrichmentFields += `- **Preferred Skills**: ${skillsData.preferred.join(', ')}\n`;
        }
      } catch (e) {
        enrichmentFields += `- **Skills**: ${job.skills}\n`;
      }
    }

    if (job.company_info) {
      enrichmentFields += `\n**Company Background**:\n${job.company_info}\n`;
    }
  }

  return `# ${title}

**Company**: ${company}
**Location**: ${location}
**Status**: ${statusEmoji}

## Description

${description}
${enrichmentFields}
## Details

- **Job ID**: \`${job.id}\`
- **Feed ID**: \`${job.feed_id}\`
- **Source URL**: ${job.source_url}
- **Discovered**: ${new Date(job.discovered_at).toLocaleString()}
${job.scraped_at ? `- **Scraped**: ${new Date(job.scraped_at).toLocaleString()}` : ''}
${job.enriched_at ? `- **Enriched**: ${new Date(job.enriched_at).toLocaleString()}` : ''}
- **Last Updated**: ${new Date(job.updated_at).toLocaleString()}
`;
}

class YubhubMCPServer {
  private server: Server;
  private apiClient: YubhubApiClient;

  constructor() {
    const config = getConfig();
    this.apiClient = new YubhubApiClient(config.adminApiUrl, config.userId, config.apiKey);

    this.server = new Server(
      {
        name: 'yubhub-mcp',
        version: '2.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[Yubhub MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_feeds',
          description: 'Get all your job feeds',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'create_feed',
          description: 'Create a new job feed for monitoring career pages',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Feed name (e.g., "Mercedes-AMG F1")',
                minLength: 1,
                maxLength: 100
              },
              careersUrl: {
                type: 'string',
                description: 'Careers page URL to monitor',
                format: 'uri'
              },
              exampleJobUrl: {
                type: 'string',
                description: 'Example job posting URL (optional)',
                format: 'uri'
              }
            },
            required: ['name', 'careersUrl'],
            additionalProperties: false
          }
        },
        {
          name: 'get_feed',
          description: 'Get detailed information about a specific feed including statistics',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to retrieve'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'show_feed_dashboard',
          description: 'Display an interactive dashboard for monitoring a job feed',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to display (e.g., feed_92afb77d)'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'show_all_feeds_dashboard',
          description: 'Display a comprehensive dashboard showing all feeds with stats, sortable columns, and XML feed links. Modern React UI with dark theme.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'trigger_feed_run',
          description: 'Start job discovery for a specific feed',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to run'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'update_feed',
          description: 'Update a feed\'s name, tag, or source URLs. Use tag to group feeds by site for filtering on the dashboard.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to update'
              },
              name: {
                type: 'string',
                description: 'New feed name (optional)'
              },
              tag: {
                type: 'string',
                description: 'Tag for grouping/filtering feeds (optional, set to empty string to clear)'
              },
              careersUrl: {
                type: 'string',
                description: 'New careers page URL (optional)'
              },
              exampleJobUrl: {
                type: 'string',
                description: 'New example job URL (optional, set to empty string to clear)'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'delete_feed',
          description: 'Delete a feed and all associated jobs. This action cannot be undone.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to delete'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'delete_jobs',
          description: 'Delete all jobs for a specific feed. This action cannot be undone.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID whose jobs should be deleted'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'get_feed_schedule',
          description: 'Get the automatic run schedule configuration for a feed. Shows if auto-run is enabled, the run interval, and when the next automatic run is scheduled.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to check schedule for'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'enable_feed_auto_run',
          description: 'Enable automatic weekly runs for a feed. The scheduler worker runs hourly and will automatically trigger this feed at the configured interval (default: 7 days for weekly runs). Great for keeping job feeds updated without manual intervention.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to enable auto-run for'
              },
              intervalDays: {
                type: 'integer',
                description: 'Run interval in days (default: 7 for weekly, max: 168 for ~monthly)',
                minimum: 1,
                maximum: 168,
                default: 7
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'disable_feed_auto_run',
          description: 'Disable automatic runs for a feed. The feed will require manual triggering after this. Use this when you want full control over when a feed runs.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to disable auto-run for'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'list_jobs',
          description: 'Get all jobs for a specific feed, optionally filtered by status',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to list jobs for'
              },
              status: {
                type: 'string',
                description: 'Filter by job status',
                enum: ['discovered', 'scraped', 'enriched', 'failed']
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'get_job',
          description: 'Get detailed information about a specific job',
          inputSchema: {
            type: 'object',
            properties: {
              jobId: {
                type: 'string',
                description: 'Job ID to retrieve'
              }
            },
            required: ['jobId'],
            additionalProperties: false
          }
        },
        {
          name: 'retry_failed_jobs',
          description: 'Retry failed jobs for a feed. Jobs that failed during scraping (no content) are re-queued for scraping. Jobs that failed during enrichment (have content) are re-queued for enrichment.',
          inputSchema: {
            type: 'object',
            properties: {
              feedId: {
                type: 'string',
                description: 'Feed ID to retry failed jobs for'
              }
            },
            required: ['feedId'],
            additionalProperties: false
          }
        },
        {
          name: 'delete_account',
          description: 'Permanently delete the user account and all associated data (feeds, jobs, usage logs). Cancels any active Stripe subscription. This action cannot be undone.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_stats_overview',
          description: 'Get high-level statistics: total enriched jobs, companies, and active feeds.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_top_companies',
          description: 'Get top companies by enriched job count, with recent activity (last 7d and 30d).',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_categories',
          description: 'Get job counts by category/sector with experience level breakdown (entry, mid, senior).',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_top_titles',
          description: 'Get the most common job titles by volume (top 30).',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_title_trends',
          description: 'Get titles gaining or losing demand — compares the last 2 weeks vs prior 2 weeks.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_work_arrangements',
          description: 'Get work arrangement distribution (remote, hybrid, onsite, etc.).',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'get_experience_levels',
          description: 'Get experience level distribution (entry, mid, senior, etc.).',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_feeds':
            return await this.listFeeds();

          case 'create_feed':
            return await this.createFeed(args as any);

          case 'get_feed':
            return await this.getFeed(args as any);

          case 'show_feed_dashboard':
            return await this.showFeedDashboard(args as any);

          case 'show_all_feeds_dashboard':
            return await this.showAllFeedsDashboard();

          case 'trigger_feed_run':
            return await this.triggerFeedRun(args as any);

          case 'update_feed':
            return await this.updateFeed(args as any);

          case 'delete_feed':
            return await this.deleteFeed(args as any);

          case 'delete_jobs':
            return await this.deleteJobs(args as any);

          case 'get_feed_schedule':
            return await this.getFeedSchedule(args as any);

          case 'enable_feed_auto_run':
            return await this.enableFeedAutoRun(args as any);

          case 'disable_feed_auto_run':
            return await this.disableFeedAutoRun(args as any);

          case 'list_jobs':
            return await this.listJobs(args as any);

          case 'get_job':
            return await this.getJob(args as any);

          case 'retry_failed_jobs':
            return await this.retryFailedJobs(args as any);

          case 'delete_account':
            return await this.deleteAccount();

          case 'get_stats_overview':
            return await this.getStatsOverview();

          case 'get_top_companies':
            return await this.getTopCompanies();

          case 'get_categories':
            return await this.getCategories();

          case 'get_top_titles':
            return await this.getTopTitles();

          case 'get_title_trends':
            return await this.getTitleTrends();

          case 'get_work_arrangements':
            return await this.getWorkArrangements();

          case 'get_experience_levels':
            return await this.getExperienceLevels();

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async listFeeds() {
    const { feeds } = await this.apiClient.listFeeds();

    return {
      content: [
        {
          type: 'text',
          text: formatFeedsList(feeds),
        },
      ],
    };
  }

  private async createFeed({ name, careersUrl, exampleJobUrl }: { name: string; careersUrl: string; exampleJobUrl?: string }) {
    const result = await this.apiClient.createFeed(name, careersUrl, exampleJobUrl);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Feed created successfully!

**Feed ID**: \`${result.id}\`
**Name**: ${name}
**Careers URL**: ${careersUrl}
${exampleJobUrl ? `**Example Job URL**: ${exampleJobUrl}` : ''}

You can now trigger a run with: "Trigger a run for ${result.id}"`,
        },
      ],
    };
  }

  private async getFeed({ feedId }: { feedId: string }) {
    const feedDetails = await this.apiClient.getFeedDetails(feedId);
    const enriched = feedDetails.stats.enriched ?? 0;
    const failed = feedDetails.stats.failed ?? 0;

    const markdown = `# ${feedDetails.feed.name}

**Status**: ${feedDetails.feed.is_active ? '✅ Active' : '⚪ Inactive'}
**Feed ID**: \`${feedDetails.feed.id}\`
**Careers URL**: ${feedDetails.feed.careers_url}
${feedDetails.feed.example_job_url ? `**Example Job URL**: ${feedDetails.feed.example_job_url}` : ''}

## Statistics
- **Total Jobs**: ${feedDetails.stats.total}
- **Enriched**: ${enriched} ✅
- **Failed**: ${failed} ❌

**Last Run**: ${feedDetails.feed.last_run_at ? new Date(feedDetails.feed.last_run_at).toLocaleString() : 'Never'}
**Created**: ${new Date(feedDetails.feed.created_at).toLocaleString()}
**Updated**: ${new Date(feedDetails.feed.updated_at).toLocaleString()}
`;

    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }

  private async showFeedDashboard({ feedId }: { feedId: string }) {
    const feedDetails = await this.apiClient.getFeedDetails(feedId);

    const htmlContent = createFeedDashboardHTML(feedDetails.feed, feedDetails.stats);

    const uiResource = await createUIResource({
      uri: `ui://yubhub/feed/${feedId}`,
      content: {
        type: 'rawHtml',
        htmlString: htmlContent,
      },
      encoding: 'text',
    });

    return {
      content: [uiResource],
    };
  }

  private async showAllFeedsDashboard() {
    const { feeds } = await this.apiClient.listFeeds();

    const feedsWithStats = await Promise.all(
      feeds.map(async (feed) => {
        try {
          const details = await this.apiClient.getFeedDetails(feed.id);
          return {
            ...feed,
            stats: details.stats,
          };
        } catch (error) {
          console.error(`Failed to fetch stats for feed ${feed.id}:`, error);
          return {
            ...feed,
            stats: { total: 0, enriched: 0, failed: 0 },
          };
        }
      })
    );

    const htmlContent = generateDashboardHTML({
      feeds: feedsWithStats,
      timestamp: Date.now(),
    });

    const uiResource = await createUIResource({
      uri: `ui://yubhub/dashboard/all`,
      content: {
        type: 'rawHtml',
        htmlString: htmlContent,
      },
      encoding: 'text',
    });

    return {
      content: [uiResource],
    };
  }

  private async triggerFeedRun({ feedId }: { feedId: string }) {
    await this.apiClient.triggerFeedRun(feedId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Feed run triggered successfully for ${feedId}\n\nJobs will be discovered and processed in the background.`,
        },
      ],
    };
  }

  private async updateFeed({ feedId, name, tag, careersUrl, exampleJobUrl }: { feedId: string; name?: string; tag?: string; careersUrl?: string; exampleJobUrl?: string }) {
    const data: { name?: string; tag?: string | null; careersUrl?: string; exampleJobUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (tag !== undefined) data.tag = tag === '' ? null : tag;
    if (careersUrl !== undefined) data.careersUrl = careersUrl;
    if (exampleJobUrl !== undefined) data.exampleJobUrl = exampleJobUrl === '' ? null : exampleJobUrl;

    const result = await this.apiClient.updateFeed(feedId, data);
    const feed = result.feed;

    const changes: string[] = [];
    if (name !== undefined) changes.push(`Name → "${feed.name}"`);
    if (tag !== undefined) changes.push(`Tag → ${feed.tag ? `"${feed.tag}"` : '(cleared)'}`);
    if (careersUrl !== undefined) changes.push(`Careers URL → ${feed.careers_url}`);
    if (exampleJobUrl !== undefined) changes.push(`Example Job URL → ${feed.example_job_url || '(cleared)'}`);

    return {
      content: [
        {
          type: 'text',
          text: `Feed updated successfully

**Feed ID**: \`${feedId}\`
**Changes**: ${changes.join(', ')}`,
        },
      ],
    };
  }

  private async deleteFeed({ feedId }: { feedId: string }) {
    await this.apiClient.getFeedDetails(feedId);
    await this.apiClient.deleteFeed(feedId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Feed deleted successfully

**Feed ID**: \`${feedId}\`

All associated jobs have been removed. This action cannot be undone.`,
        },
      ],
    };
  }

  private async deleteJobs({ feedId }: { feedId: string }) {
    const feedDetails = await this.apiClient.getFeedDetails(feedId);
    const jobsBefore = feedDetails.stats.total;

    await this.apiClient.deleteJobs(feedId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Jobs deleted successfully

**Feed**: ${feedDetails.feed.name}
**Feed ID**: \`${feedId}\`
**Jobs Deleted**: ${jobsBefore}

All jobs for this feed have been removed. This action cannot be undone.`,
        },
      ],
    };
  }

  private async getFeedSchedule({ feedId }: { feedId: string }) {
    const schedule = await this.apiClient.getFeedSchedule(feedId);

    const nextRun = schedule.nextRunAt
      ? new Date(schedule.nextRunAt).toLocaleString()
      : 'Not scheduled';

    const lastRun = schedule.lastRunAt
      ? new Date(schedule.lastRunAt).toLocaleString()
      : 'Never';

    const statusEmoji = schedule.autoRunEnabled ? '✅' : '⚪';

    return {
      content: [
        {
          type: 'text',
          text: `# Schedule for ${schedule.name}

**Status**: ${statusEmoji} ${schedule.autoRunEnabled ? 'Auto-run Enabled' : 'Auto-run Disabled'}
**Feed ID**: \`${schedule.feedId}\`
**Interval**: Every ${schedule.intervalDays} day${schedule.intervalDays !== 1 ? 's' : ''}

## Schedule Details
- **Next Run**: ${nextRun}
- **Last Run**: ${lastRun}

${schedule.autoRunEnabled
  ? `This feed will automatically trigger every ${schedule.intervalDays} days. The scheduler runs hourly and will pick up this feed when it's due.`
  : 'This feed requires manual triggering. Enable auto-run to schedule automatic runs.'}`,
        },
      ],
    };
  }

  private async enableFeedAutoRun({ feedId, intervalDays = 7 }: { feedId: string; intervalDays?: number }) {
    const result = await this.apiClient.updateFeedSchedule(feedId, true, intervalDays);

    const nextRun = result.nextRunAt
      ? new Date(result.nextRunAt).toLocaleString()
      : 'Not scheduled';

    return {
      content: [
        {
          type: 'text',
          text: `✅ Auto-run enabled successfully!

**Feed ID**: \`${feedId}\`
**Interval**: Every ${intervalDays} day${intervalDays !== 1 ? 's' : ''}
**Next Run**: ${nextRun}

This feed will now trigger automatically every ${intervalDays} days. The scheduler runs hourly and will pick up this feed when it's due.`,
        },
      ],
    };
  }

  private async disableFeedAutoRun({ feedId }: { feedId: string }) {
    await this.apiClient.updateFeedSchedule(feedId, false);

    return {
      content: [
        {
          type: 'text',
          text: `⚪ Auto-run disabled

**Feed ID**: \`${feedId}\`

This feed will no longer run automatically. Use "Trigger Feed Run" to run it manually.`,
        },
      ],
    };
  }

  private async listJobs({ feedId, status }: { feedId: string; status?: string }) {
    const feedDetails = await this.apiClient.getFeedDetails(feedId);
    const { jobs } = await this.apiClient.listJobs(feedId, status);

    return {
      content: [
        {
          type: 'text',
          text: formatJobsList(jobs, feedDetails.feed.name),
        },
      ],
    };
  }

  private async getJob({ jobId }: { jobId: string }) {
    const { job } = await this.apiClient.getJob(jobId);

    return {
      content: [
        {
          type: 'text',
          text: formatJobDetail(job),
        },
      ],
    };
  }

  private async retryFailedJobs({ feedId }: { feedId: string }) {
    const result = await this.apiClient.retryFailedJobs(feedId);

    return {
      content: [
        {
          type: 'text',
          text: `Failed jobs queued for retry

**Feed ID**: \`${feedId}\`
**Scraping retries**: ${result.scrapeQueued} (jobs without content — re-scraping)
**Enrichment retries**: ${result.enrichQueued} (jobs with content — re-enriching)

Jobs will be processed in the background. Check status with list_jobs.`,
        },
      ],
    };
  }

  private async deleteAccount() {
    await this.apiClient.deleteAccount();

    return {
      content: [
        {
          type: 'text',
          text: `Account deleted successfully. All feeds, jobs, and personal data have been permanently removed.`,
        },
      ],
    };
  }

  // --- Public stats tools (no auth required) ---

  private async getStatsOverview() {
    const { data } = await this.apiClient.getStatsOverview();
    return {
      content: [{
        type: 'text',
        text: `**Job Market Overview**

| Metric | Value |
|--------|-------|
| Total enriched jobs | ${data.totalJobs.toLocaleString()} |
| Companies | ${data.totalCompanies.toLocaleString()} |
| Active feeds | ${data.totalFeeds.toLocaleString()} |`,
      }],
    };
  }

  private async getTopCompanies() {
    const { data } = await this.apiClient.getTopCompanies();
    const rows = data.map(c =>
      `| ${c.company} | ${c.total_jobs} | ${c.jobs_last_7d} | ${c.jobs_last_30d} |`
    ).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Top Companies by Job Count**

| Company | Total | Last 7d | Last 30d |
|---------|-------|---------|----------|
${rows}`,
      }],
    };
  }

  private async getCategories() {
    const { data } = await this.apiClient.getCategories();
    const rows = data.map(c =>
      `| ${c.category} | ${c.count} | ${c.entry_count} | ${c.mid_count} | ${c.senior_count} |`
    ).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Job Categories with Experience Breakdown**

| Category | Total | Entry | Mid | Senior |
|----------|-------|-------|-----|--------|
${rows}`,
      }],
    };
  }

  private async getTopTitles() {
    const { data } = await this.apiClient.getTopTitles();
    const rows = data.map(t => `| ${t.title} | ${t.count} |`).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Most Common Job Titles**

| Title | Count |
|-------|-------|
${rows}`,
      }],
    };
  }

  private async getTitleTrends() {
    const { data } = await this.apiClient.getTitleTrends();
    const rows = data.map(t => {
      const arrow = t.change > 0 ? '↑' : t.change < 0 ? '↓' : '→';
      return `| ${t.title} | ${t.recent_count} | ${t.prior_count} | ${arrow} ${t.change > 0 ? '+' : ''}${t.change} |`;
    }).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Title Trends (last 14d vs prior 14d)**

| Title | Recent | Prior | Change |
|-------|--------|-------|--------|
${rows}`,
      }],
    };
  }

  private async getWorkArrangements() {
    const { data } = await this.apiClient.getWorkArrangements();
    const total = data.reduce((s, a) => s + a.count, 0);
    const rows = data.map(a => {
      const pct = total > 0 ? ((a.count / total) * 100).toFixed(1) : '0';
      return `| ${a.arrangement} | ${a.count} | ${pct}% |`;
    }).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Work Arrangement Distribution**

| Arrangement | Count | % |
|-------------|-------|---|
${rows}`,
      }],
    };
  }

  private async getExperienceLevels() {
    const { data } = await this.apiClient.getExperienceLevels();
    const total = data.reduce((s, e) => s + e.count, 0);
    const rows = data.map(e => {
      const pct = total > 0 ? ((e.count / total) * 100).toFixed(1) : '0';
      return `| ${e.level} | ${e.count} | ${pct}% |`;
    }).join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Experience Level Distribution**

| Level | Count | % |
|-------|-------|---|
${rows}`,
      }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

async function main() {
  const server = new YubhubMCPServer();
  await server.run();
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error.message}\n`);
  process.exit(1);
});
