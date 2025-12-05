# Yubnub MCP v2 Implementation Guide

**Complete code reference for Yubnub MCP v2**  
**Version**: 2.0.0  
**Last Updated**: December 5, 2025

This document provides the complete implementation details for building and deploying Yubnub MCP v2. See SPECIFICATION.md for architecture and design decisions.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Core Files](#core-files)
3. [Type Definitions](#type-definitions)
4. [API Client](#api-client)
5. [UI Components](#ui-components)
6. [Tool Handlers](#tool-handlers)
7. [Main Server](#main-server)
8. [Build & Deploy](#build--deploy)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Project Setup

### Directory Structure

```
C:\mcp\yubnub-v2\
├── package.json
├── tsconfig.json
├── README.md
├── SPECIFICATION.md
├── IMPLEMENTATION.md (this file)
│
├── src/
│   ├── index.ts              # Server entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── api-client.ts         # Yubnub API client
│   │
│   ├── tools/
│   │   └── feeds.ts          # Tool registration
│   │
│   └── components/
│       ├── FeedCard.tsx      # Feed dashboard
│       ├── FeedList.tsx      # Feeds grid
│       └── JobList.tsx       # Job listings
│
└── build/                    # Compiled output (gitignored)
    └── ...
```

### Prerequisites

```powershell
# Check Node.js version (requires 20+)
node --version

# If needed, install/upgrade Node.js
# Download from https://nodejs.org
```

### Initial Setup

```powershell
cd C:\mcp\yubnub-v2

# Install dependencies
npm install

# Build TypeScript
npm run build

# Output should be in build/ directory
dir build
```

---

## Core Files

### package.json

```json
{
  "name": "yubnub-mcp-v2",
  "version": "2.0.0",
  "description": "Yubnub MCP server with modern mcpui components",
  "type": "module",
  "bin": {
    "yubnub-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x build/index.js",
    "dev": "tsc --watch",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "@mcp-ui/components": "^0.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Key Points**:
- `"type": "module"` enables ES modules
- `bin` field allows `npx yubnub-mcp` usage
- `prepare` script runs build automatically on install

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Key Settings**:
- `module: "Node16"` for proper ESM support
- `strict: true` enables all type checking
- `declaration: true` generates .d.ts files
- `sourceMap: true` for debugging

---

## Type Definitions

### src/types.ts

```typescript
export interface YubnubConfig {
  userId: string;
  adminApiUrl: string;
}

export interface Feed {
  id: string;
  name: string;
  user_id: number;
  careers_url: string;
  example_job_url: string | null;
  is_active: number;
  last_run_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Job {
  id: string;
  feed_id: string;
  source_url: string;
  status: 'discovered' | 'scraped' | 'enriched' | 'failed';
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  discovered_at: number;
  scraped_at: number | null;
  enriched_at: number | null;
  updated_at: number;
}

export interface FeedStats {
  total: number;
  enriched: number;
  failed: number;
}

export interface FeedDetails {
  feed: Feed;
  stats: FeedStats;
}
```

**Design Notes**:
- Types match Yubnub Admin API response structure exactly
- Nullable fields use `| null` instead of optional `?`
- Timestamps are numbers (Unix milliseconds)
- `is_active` is number (0 or 1) matching D1 SQLite

---

## API Client

### src/api-client.ts

```typescript
import type { Feed, FeedDetails, Job } from './types.js';

export class YubnubApiClient {
  constructor(
    private baseUrl: string,
    private userId: string
  ) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-User-ID': this.userId,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async listFeeds(): Promise<{ feeds: Feed[]; total: number }> {
    return this.request('/api/feeds');
  }

  async getFeedDetails(feedId: string): Promise<FeedDetails> {
    return this.request(`/api/feeds/${feedId}`);
  }

  async triggerFeedRun(feedId: string): Promise<{ message: string; feedId: string }> {
    return this.request(`/api/feeds/${feedId}/run`, { method: 'POST' });
  }

  async listJobs(feedId: string, status?: string): Promise<{ jobs: Job[]; total: number }> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/feeds/${feedId}/jobs${query}`);
  }

  async getJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/api/jobs/${jobId}`);
  }
}
```

**Implementation Notes**:

1. **Constructor Pattern**: Takes base URL and user ID, stores as private fields
2. **Generic Request**: Single `request<T>` method handles all HTTP calls
3. **Auto Headers**: Every request includes `X-User-ID` and `Content-Type`
4. **Error Handling**: Throws on non-ok responses with status and body
5. **Type Safety**: Return types match API responses exactly

**Usage Example**:

```typescript
const client = new YubnubApiClient(
  'https://yubnub-admin-api-staging.fluidjobs.workers.dev',
  '1625'
);

// List all feeds
const { feeds } = await client.listFeeds();

// Get specific feed
const { feed, stats } = await client.getFeedDetails('feed_92afb77d');

// Trigger run
await client.triggerFeedRun('feed_92afb77d');
```

---

## UI Components

### src/components/FeedCard.tsx

```typescript
import { component, Card, Text, Button, Badge } from '@mcp-ui/components';
import type { Feed, FeedStats } from '../types.js';

interface FeedCardProps {
  feed: Feed;
  stats: FeedStats;
  onTriggerRun: () => void;
}

export const FeedCard = component<FeedCardProps>(
  ({ feed, stats, onTriggerRun }) => (
    <Card title={feed.name}>
      <Text>Status: {feed.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</Text>
      <Text>Feed ID: {feed.id}</Text>
      <Text>Careers URL: {feed.careers_url}</Text>
      
      <Card title="Job Statistics" variant="secondary">
        <Text>Total Jobs: {stats.total}</Text>
        <Text>Enriched: {stats.enriched}</Text>
        <Text>Failed: {stats.failed}</Text>
      </Card>

      {feed.last_run_at && (
        <Text>Last Run: {new Date(feed.last_run_at).toLocaleString()}</Text>
      )}

      <Button onClick={onTriggerRun} variant="primary">
        Trigger Feed Run
      </Button>
    </Card>
  )
);
```

**Component Structure**:
- Props interface defines required inputs
- `component` function wraps TSX for rendering
- Nested `Card` for statistics section
- Conditional rendering for `last_run_at`
- Button with callback for triggering runs

**Visual Hierarchy**:
```
Card (feed.name as title)
  ├── Status badge
  ├── Feed ID
  ├── Careers URL
  ├── Card (Job Statistics)
  │   ├── Total
  │   ├── Enriched
  │   └── Failed
  ├── Last Run (if available)
  └── Trigger Button
```

### src/components/FeedList.tsx

```typescript
import { component, Card, Text, Badge } from '@mcp-ui/components';
import type { Feed } from '../types.js';

interface FeedListProps {
  feeds: Feed[];
}

export const FeedList = component<FeedListProps>(({ feeds }) => (
  <Card title="Your Feeds">
    {feeds.length === 0 ? (
      <Text>No feeds found. Create your first feed to get started.</Text>
    ) : (
      feeds.map((feed) => (
        <Card key={feed.id} variant="secondary">
          <Text weight="bold">{feed.name}</Text>
          <Text size="sm">ID: {feed.id}</Text>
          <Text size="sm">
            Status: {feed.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
          </Text>
          {feed.last_run_at && (
            <Text size="sm">Last run: {new Date(feed.last_run_at).toLocaleString()}</Text>
          )}
        </Card>
      ))
    )}
  </Card>
));
```

**Component Features**:
- Empty state handling
- Grid of feed cards
- Compact size (`size="sm"`)
- Bold feed names for hierarchy
- Consistent badge styling

### src/components/JobList.tsx

```typescript
import { component, Card, Text, Badge } from '@mcp-ui/components';
import type { Job } from '../types.js';

interface JobListProps {
  jobs: Job[];
  feedName: string;
}

const statusColors = {
  discovered: 'secondary',
  scraped: 'warning',
  enriched: 'success',
  failed: 'danger',
} as const;

export const JobList = component<JobListProps>(({ jobs, feedName }) => (
  <Card title={`Jobs for ${feedName}`}>
    {jobs.length === 0 ? (
      <Text>No jobs found. Trigger a feed run to discover jobs.</Text>
    ) : (
      jobs.map((job) => (
        <Card key={job.id} variant="secondary">
          <Text weight="bold">{job.title || 'Untitled Job'}</Text>
          {job.company && <Text>Company: {job.company}</Text>}
          {job.location && <Text>Location: {job.location}</Text>}
          <Text size="sm">
            Status: <Badge variant={statusColors[job.status]}>{job.status}</Badge>
          </Text>
          <Text size="sm">Source: {job.source_url}</Text>
          <Text size="sm">Discovered: {new Date(job.discovered_at).toLocaleString()}</Text>
        </Card>
      ))
    )}
  </Card>
));
```

**Status Color Mapping**:
- `discovered`: Gray (secondary)
- `scraped`: Yellow (warning) - in progress
- `enriched`: Green (success) - complete
- `failed`: Red (danger) - error

**Conditional Rendering**:
- Title shows "Untitled Job" if null
- Company and location only show if present
- All jobs show status badge and source

---

## Tool Handlers

### src/tools/feeds.ts

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { render } from '@mcp-ui/components';
import type { YubnubApiClient } from '../api-client.js';
import { FeedCard } from '../components/FeedCard.js';
import { FeedList } from '../components/FeedList.js';
import { JobList } from '../components/JobList.js';

export function registerFeedTools(server: McpServer, apiClient: YubnubApiClient) {
  
  server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'show_feed_dashboard',
        description: 'Display an interactive dashboard for monitoring a job feed',
        inputSchema: {
          type: 'object',
          properties: {
            feedId: {
              type: 'string',
              description: 'Feed ID to display (e.g., feed_92afb77d)',
            },
          },
          required: ['feedId'],
        },
      },
      {
        name: 'list_feeds',
        description: 'Display all your job feeds',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_jobs',
        description: 'Display jobs for a specific feed',
        inputSchema: {
          type: 'object',
          properties: {
            feedId: {
              type: 'string',
              description: 'Feed ID to list jobs for',
            },
            status: {
              type: 'string',
              description: 'Filter by job status (discovered, scraped, enriched, failed)',
              enum: ['discovered', 'scraped', 'enriched', 'failed'],
            },
          },
          required: ['feedId'],
        },
      },
      {
        name: 'trigger_feed_run',
        description: 'Start job discovery for a specific feed',
        inputSchema: {
          type: 'object',
          properties: {
            feedId: {
              type: 'string',
              description: 'Feed ID to run',
            },
          },
          required: ['feedId'],
        },
      },
    ],
  }));

  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'show_feed_dashboard': {
        const { feedId } = args as { feedId: string };
        
        const feedDetails = await apiClient.getFeedDetails(feedId);
        
        const handleTriggerRun = async () => {
          await apiClient.triggerFeedRun(feedId);
        };

        const uiContent = render(
          <FeedCard 
            feed={feedDetails.feed} 
            stats={feedDetails.stats}
            onTriggerRun={handleTriggerRun}
          />
        );

        return {
          content: [
            {
              type: 'ui',
              uri: `ui://yubnub/feed/${feedId}`,
              content: uiContent,
            },
          ],
        };
      }

      case 'list_feeds': {
        const { feeds } = await apiClient.listFeeds();
        
        const uiContent = render(<FeedList feeds={feeds} />);

        return {
          content: [
            {
              type: 'ui',
              uri: 'ui://yubnub/feeds',
              content: uiContent,
            },
          ],
        };
      }

      case 'list_jobs': {
        const { feedId, status } = args as { feedId: string; status?: string };
        
        const feedDetails = await apiClient.getFeedDetails(feedId);
        const jobsData = await apiClient.listJobs(feedId, status);
        
        const uiContent = render(
          <JobList jobs={jobsData.jobs} feedName={feedDetails.feed.name} />
        );

        return {
          content: [
            {
              type: 'ui',
              uri: `ui://yubnub/feed/${feedId}/jobs`,
              content: uiContent,
            },
          ],
        };
      }

      case 'trigger_feed_run': {
        const { feedId } = args as { feedId: string };
        
        const result = await apiClient.triggerFeedRun(feedId);

        return {
          content: [
            {
              type: 'text',
              text: `Feed run triggered successfully for ${feedId}. Jobs will be discovered and processed in the background.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
```

**Implementation Pattern**:

1. **Tool Registration**: `tools/list` handler returns tool definitions
2. **Tool Execution**: `tools/call` handler dispatches to specific tool logic
3. **Type Casting**: Cast `args` to expected shape with `as`
4. **API Calls**: Fetch data from Yubnub API
5. **Component Rendering**: Create component with fetched data
6. **UI Response**: Return UI content with unique URI

**URI Pattern**:
- Feed dashboard: `ui://yubnub/feed/{feedId}`
- Feed list: `ui://yubnub/feeds`
- Job list: `ui://yubnub/feed/{feedId}/jobs`

**Error Handling**:
- API client throws on HTTP errors
- Errors propagate to MCP SDK
- SDK returns error to Claude
- Claude displays error naturally to user

---

## Main Server

### src/index.ts

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { YubnubApiClient } from './api-client.js';
import { registerFeedTools } from './tools/feeds.js';
import type { YubnubConfig } from './types.js';

function getConfig(): YubnubConfig {
  const userId = process.env.YUBNUB_USER_ID;
  const adminApiUrl = process.env.YUBNUB_ADMIN_API_URL || 
    'https://yubnub-admin-api-staging.fluidjobs.workers.dev';

  if (!userId) {
    throw new Error('YUBNUB_USER_ID environment variable is required');
  }

  return { userId, adminApiUrl };
}

async function main() {
  const config = getConfig();
  
  const apiClient = new YubnubApiClient(config.adminApiUrl, config.userId);

  const server = new Server(
    {
      name: 'yubnub-mcp-v2',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerFeedTools(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});
```

**Execution Flow**:

1. **Shebang**: `#!/usr/bin/env node` makes file executable
2. **Config**: Read environment variables, validate required ones
3. **API Client**: Create with config values
4. **MCP Server**: Initialize with name, version, capabilities
5. **Tool Registration**: Call `registerFeedTools` with server and client
6. **Transport**: Create stdio transport for Claude communication
7. **Connect**: Start listening for MCP requests
8. **Error Handling**: Exit with code 1 on startup errors

**Environment Variables**:
- `YUBNUB_USER_ID`: Required, fails fast if missing
- `YUBNUB_ADMIN_API_URL`: Optional, defaults to staging

---

## Build & Deploy

### Building

```powershell
# Clean build
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev
```

**Build Output**:
- `build/index.js` - Main entry point
- `build/**/*.js` - All compiled modules
- `build/**/*.d.ts` - Type declarations
- `build/**/*.js.map` - Source maps

### Claude Desktop Configuration

**Location**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "yubnub": {
      "command": "node",
      "args": [
        "C:\\mcp\\yubnub-v2\\build\\index.js"
      ],
      "env": {
        "YUBNUB_USER_ID": "1625",
        "YUBNUB_ADMIN_API_URL": "https://yubnub-admin-api-staging.fluidjobs.workers.dev"
      }
    }
  }
}
```

**Configuration Notes**:
- Use absolute paths
- Windows: Double backslashes `\\`
- Unix: Forward slashes `/`
- Restart Claude Desktop after config changes

### Deployment Checklist

1. ✅ Build succeeds without errors
2. ✅ `build/index.js` exists and has shebang
3. ✅ Claude config file is valid JSON
4. ✅ Paths are absolute and correct
5. ✅ Environment variables are set
6. ✅ Node.js version is 20+
7. ✅ Claude Desktop restarted
8. ✅ Tools appear in Claude interface

---

## Testing

### Manual Testing

```powershell
# Terminal 1: Start server manually to see output
$env:YUBNUB_USER_ID = "1625"
$env:YUBNUB_ADMIN_API_URL = "https://yubnub-admin-api-staging.fluidjobs.workers.dev"
node build/index.js

# Server will wait for stdio input
# Type Ctrl+C to exit
```

**Test Cases**:

1. **List Feeds**
   - Claude: "Show me all my feeds"
   - Expected: Grid of feed cards with status badges

2. **Feed Dashboard**
   - Claude: "Show me feed_92afb77d dashboard"
   - Expected: Detailed feed card with statistics and trigger button

3. **List Jobs**
   - Claude: "Show me jobs for feed_92afb77d"
   - Expected: List of job cards with titles, companies, status

4. **Filtered Jobs**
   - Claude: "Show me enriched jobs for feed_92afb77d"
   - Expected: Only jobs with status "enriched"

5. **Trigger Run**
   - Claude: "Trigger a run for feed_92afb77d"
   - Expected: Success message, jobs will appear after processing

6. **Error Cases**
   - Invalid feed ID → "Feed not found" error
   - Network error → API connection error
   - Missing USER_ID → Startup error

### API Testing

```powershell
# Test Admin API directly
curl "https://yubnub-admin-api-staging.fluidjobs.workers.dev/health"

# List feeds
curl "https://yubnub-admin-api-staging.fluidjobs.workers.dev/api/feeds" `
  -H "X-User-ID: 1625"

# Get feed details
curl "https://yubnub-admin-api-staging.fluidjobs.workers.dev/api/feeds/feed_92afb77d" `
  -H "X-User-ID: 1625"
```

### Component Testing

To test components in isolation (future enhancement):

```typescript
import { render } from '@mcp-ui/components';
import { FeedCard } from './components/FeedCard';

const mockFeed = {
  id: 'feed_test',
  name: 'Test Feed',
  // ... other fields
};

const mockStats = {
  total: 10,
  enriched: 8,
  failed: 1,
};

const uiContent = render(
  <FeedCard 
    feed={mockFeed} 
    stats={mockStats}
    onTriggerRun={() => {}}
  />
);

console.log(JSON.stringify(uiContent, null, 2));
```

---

## Troubleshooting

### Build Errors

**Problem**: `Cannot find module '@mcp-ui/components'`

**Solution**:
```powershell
npm install
npm run build
```

**Problem**: TypeScript compilation errors

**Solution**:
```powershell
# Check TypeScript version
npx tsc --version

# View detailed errors
npx tsc --noEmit

# Update TypeScript if needed
npm install typescript@latest --save-dev
```

### Runtime Errors

**Problem**: `YUBNUB_USER_ID is required`

**Solution**: Check Claude config has `env.YUBNUB_USER_ID` set

**Problem**: `API request failed: 404`

**Solution**:
1. Verify feed ID exists: "Show me all my feeds"
2. Check user ID has access to feed
3. Confirm Admin API is reachable

**Problem**: `fetch is not defined`

**Solution**: Update Node.js to version 20+ (includes native fetch)

### Claude Desktop Issues

**Problem**: Server not starting

**Solutions**:
1. Check Developer Tools console (Help → Developer Tools)
2. Look for syntax errors in config file
3. Verify paths are absolute
4. Try restarting Claude Desktop

**Problem**: Tools not appearing

**Solutions**:
1. Verify build succeeded
2. Check config file name is exactly `claude_desktop_config.json`
3. Restart Claude Desktop
4. Check config is in correct location: `%APPDATA%\Claude`

**Problem**: UI not rendering

**Solutions**:
1. Check for component errors in build output
2. Verify `@mcp-ui/components` version is compatible
3. Review component code for syntax errors

---

## Next Steps

After successful deployment:

1. **Create Sample Feeds**: Test with real Yubnub data
2. **Explore Prompts**: Try different ways to phrase commands
3. **Monitor Performance**: Check API response times
4. **Gather Feedback**: Note any UX improvements needed
5. **Plan Enhancements**: Review Phase 2 features in SPECIFICATION.md

---

**Implementation Version**: 2.0.0  
**Last Updated**: December 5, 2025  
**Status**: Production Ready
