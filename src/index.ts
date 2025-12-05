#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createUIResource } from '@mcp-ui/server';
import { z } from 'zod';
import { YubnubApiClient } from './api-client.js';
import type { YubnubConfig, Feed, FeedStats, Job } from './types.js';

function getConfig(): YubnubConfig {
  const userId = process.env.YUBNUB_USER_ID;
  const adminApiUrl = process.env.YUBNUB_ADMIN_API_URL || 
    'https://yubnub-admin-api-staging.fluidjobs.workers.dev';

  if (!userId) {
    throw new Error('YUBNUB_USER_ID environment variable is required');
  }

  return { userId, adminApiUrl };
}

function createFeedDashboardHTML(feed: Feed, stats: FeedStats): string {
  const status = feed.is_active ? 'Active' : 'Inactive';
  const statusClass = feed.is_active ? 'active' : 'inactive';
  const lastRun = feed.last_run_at 
    ? new Date(feed.last_run_at).toLocaleString() 
    : 'Never';

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
    <h1>${feed.name}</h1>
    <span class="status ${statusClass}">${status}</span>
    
    <div class="meta">
      <div><strong>Feed ID:</strong> ${feed.id}</div>
      <div><strong>Careers URL:</strong> <a href="${feed.careers_url}" target="_blank">${feed.careers_url}</a></div>
      <div><strong>Last Run:</strong> ${lastRun}</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Jobs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.enriched}</div>
        <div class="stat-label">Enriched</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.failed}</div>
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
          params: { feedId: '${feed.id}' }
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

  return `# ${title}

**Company**: ${company}
**Location**: ${location}
**Status**: ${statusEmoji}

## Description

${description}

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

async function main() {
  const config = getConfig();
  const apiClient = new YubnubApiClient(config.adminApiUrl, config.userId);

  const server = new McpServer({
    name: 'yubnub-mcp-v2',
    version: '2.0.0',
  });

  // ============================================
  // FEED TOOLS
  // ============================================

  // List all feeds
  server.registerTool(
    'list_feeds',
    {
      title: 'List Feeds',
      description: 'Get all your job feeds',
      inputSchema: z.object({}),
    },
    async () => {
      const { feeds } = await apiClient.listFeeds();
      
      return {
        content: [
          {
            type: 'text',
            text: formatFeedsList(feeds),
          },
        ],
      };
    }
  );

  // Create feed
  server.registerTool(
    'create_feed',
    {
      title: 'Create Feed',
      description: 'Create a new job feed for monitoring career pages',
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe('Feed name (e.g., "Mercedes-AMG F1")'),
        careersUrl: z.string().url().describe('Careers page URL to monitor'),
        exampleJobUrl: z.string().url().optional().describe('Example job posting URL (optional)'),
      }),
    },
    async ({ name, careersUrl, exampleJobUrl }: { name: string; careersUrl: string; exampleJobUrl?: string }) => {
      // Call API (we need to add this method to the API client)
      const response = await fetch(`${apiClient['baseUrl']}/api/feeds`, {
        method: 'POST',
        headers: {
          'X-User-ID': apiClient['userId'],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          careersUrl,
          exampleJobUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create feed: ${response.status} ${error}`);
      }

      const result = await response.json() as { id: string; message: string };

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
  );

  // Get feed details
  server.registerTool(
    'get_feed',
    {
      title: 'Get Feed Details',
      description: 'Get detailed information about a specific feed including statistics',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID to retrieve'),
      }),
    },
    async ({ feedId }: { feedId: string }) => {
      const feedDetails = await apiClient.getFeedDetails(feedId);
      
      const markdown = `# ${feedDetails.feed.name}

**Status**: ${feedDetails.feed.is_active ? '✅ Active' : '⚪ Inactive'}
**Feed ID**: \`${feedDetails.feed.id}\`
**Careers URL**: ${feedDetails.feed.careers_url}
${feedDetails.feed.example_job_url ? `**Example Job URL**: ${feedDetails.feed.example_job_url}` : ''}

## Statistics
- **Total Jobs**: ${feedDetails.stats.total}
- **Enriched**: ${feedDetails.stats.enriched} ✅
- **Failed**: ${feedDetails.stats.failed} ❌

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
  );

  // Show feed dashboard (with UI)
  server.registerTool(
    'show_feed_dashboard',
    {
      title: 'Show Feed Dashboard',
      description: 'Display an interactive dashboard for monitoring a job feed',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID to display (e.g., feed_92afb77d)'),
      }),
    },
    async ({ feedId }: { feedId: string }) => {
      const feedDetails = await apiClient.getFeedDetails(feedId);
      
      const htmlContent = createFeedDashboardHTML(feedDetails.feed, feedDetails.stats);
      
      const uiResource = await createUIResource({
        uri: `ui://yubnub/feed/${feedId}`,
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
  );

  // Trigger feed run
  server.registerTool(
    'trigger_feed_run',
    {
      title: 'Trigger Feed Run',
      description: 'Start job discovery for a specific feed',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID to run'),
      }),
    },
    async ({ feedId }: { feedId: string }) => {
      await apiClient.triggerFeedRun(feedId);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Feed run triggered successfully for ${feedId}\n\nJobs will be discovered and processed in the background.`,
          },
        ],
      };
    }
  );

  // Delete feed
  server.registerTool(
    'delete_feed',
    {
      title: 'Delete Feed',
      description: 'Delete a feed and all associated jobs. This action cannot be undone.',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID to delete'),
      }),
    },
    async ({ feedId }: { feedId: string }) => {
      // First verify the feed exists and belongs to the user
      await apiClient.getFeedDetails(feedId);
      
      // Delete the feed
      const response = await fetch(`${apiClient['baseUrl']}/api/feeds/${feedId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': apiClient['userId'],
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete feed: ${response.status} ${error}`);
      }

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
  );

  // Delete jobs for a feed
  server.registerTool(
    'delete_jobs',
    {
      title: 'Delete Jobs',
      description: 'Delete all jobs for a specific feed. This action cannot be undone.',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID whose jobs should be deleted'),
      }),
    },
    async ({ feedId }: { feedId: string }) => {
      // First verify the feed exists and belongs to the user (security check)
      const feedDetails = await apiClient.getFeedDetails(feedId);
      
      // Get current job count before deletion
      const jobsBefore = feedDetails.stats.total;
      
      // Delete jobs for this feed
      const response = await fetch(`${apiClient['baseUrl']}/api/feeds/${feedId}/jobs`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': apiClient['userId'],
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete jobs: ${response.status} ${error}`);
      }

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
  );

  // ============================================
  // JOB TOOLS
  // ============================================

  // List jobs for a feed
  server.registerTool(
    'list_jobs',
    {
      title: 'List Jobs',
      description: 'Get all jobs for a specific feed, optionally filtered by status',
      inputSchema: z.object({
        feedId: z.string().describe('Feed ID to list jobs for'),
        status: z.enum(['discovered', 'scraped', 'enriched', 'failed']).optional().describe('Filter by job status'),
      }),
    },
    async ({ feedId, status }: { feedId: string; status?: string }) => {
      const feedDetails = await apiClient.getFeedDetails(feedId);
      const { jobs } = await apiClient.listJobs(feedId, status);
      
      return {
        content: [
          {
            type: 'text',
            text: formatJobsList(jobs, feedDetails.feed.name),
          },
        ],
      };
    }
  );

  // Get job details
  server.registerTool(
    'get_job',
    {
      title: 'Get Job Details',
      description: 'Get detailed information about a specific job',
      inputSchema: z.object({
        jobId: z.string().describe('Job ID to retrieve'),
      }),
    },
    async ({ jobId }: { jobId: string }) => {
      const { job } = await apiClient.getJob(jobId);
      
      return {
        content: [
          {
            type: 'text',
            text: formatJobDetail(job),
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error.message}\n`);
  process.exit(1);
});
