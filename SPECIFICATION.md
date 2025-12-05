# Yubnub MCP v2 Specification

**Version**: 2.0.0  
**Last Updated**: December 5, 2025  
**Status**: Implementation Ready

---

## Executive Summary

This specification defines the architecture and implementation of Yubnub MCP v2, a modern Model Context Protocol server that provides interactive UI components for managing job feeds in the Yubnub platform.

**Key Design Decisions:**
1. **Component-Based Architecture**: Use `@mcp-ui/components` for native UI rendering
2. **Single Process**: No separate workers, simplified deployment
3. **Direct API Access**: No token intermediaries, just environment config
4. **Type Safety**: Full TypeScript implementation
5. **User Isolation**: Every API call scoped to configured user_id

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────┐
│  Claude Desktop                         │
│  - Loads MCP server via stdio          │
│  - Renders native UI components        │
│  - Handles tool calls                   │
└──────────────┬──────────────────────────┘
               │
               │ stdio (stdin/stdout)
               │
┌──────────────▼──────────────────────────┐
│  Yubnub MCP Server (Node.js)            │
│  - Registers tools                      │
│  - Creates UI components                │
│  - Calls Yubnub Admin API               │
└──────────────┬──────────────────────────┘
               │
               │ REST API (X-User-ID header)
               │
┌──────────────▼──────────────────────────┐
│  Yubnub Admin API                       │
│  - Returns feed/job data                │
│  - Enforces user isolation              │
│  - No changes needed                    │
└─────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── index.ts
│   └── Main server setup
│       ├── Read env config
│       ├── Create API client
│       ├── Initialize MCP server
│       └── Register tools
│
├── api-client.ts
│   └── YubnubApiClient
│       ├── listFeeds()
│       ├── getFeedDetails()
│       ├── triggerFeedRun()
│       ├── listJobs()
│       └── getJob()
│
├── tools/feeds.ts
│   └── Tool handlers
│       ├── show_feed_dashboard
│       ├── list_feeds
│       ├── list_jobs
│       └── trigger_feed_run
│
└── components/
    ├── FeedCard.tsx       # Individual feed dashboard
    ├── FeedList.tsx       # All feeds grid
    └── JobList.tsx        # Job listings
```

---

## Design Principles

### 1. Simplicity Over Flexibility

Instead of the v1 dual-worker architecture (MCP-UI Server + Dashboard Worker + JWT tokens), v2 uses a single Node.js process with direct API calls.

**Rationale**: Simpler to deploy, debug, and maintain. No need for Cloudflare Workers infrastructure.

### 2. Type Safety First

Full TypeScript implementation with strict mode enabled. All API responses are typed, reducing runtime errors.

**Rationale**: Better developer experience, catch errors at compile time, easier refactoring.

### 3. Component-Based UI

Use declarative UI components from `@mcp-ui/components` instead of hand-coded HTML in iframes.

**Rationale**: Cleaner code, consistent styling, native rendering in Claude, better performance.

### 4. Configuration via Environment

All config through environment variables in Claude config file, no runtime config files needed.

**Rationale**: Follows 12-factor app principles, easier to manage multiple environments.

### 5. Direct Authentication

User ID configured once in environment, passed to every API call via header.

**Rationale**: No token generation/validation overhead, simpler security model, works with existing Admin API.

---

## Component Specifications

### API Client (api-client.ts)

**Purpose**: Abstraction layer for Yubnub Admin API calls

**Methods**:
- `listFeeds()`: Get all feeds for user
- `getFeedDetails(feedId)`: Get feed with stats
- `triggerFeedRun(feedId)`: Start job discovery
- `listJobs(feedId, status?)`: Get jobs, optionally filtered
- `getJob(jobId)`: Get single job details

**Error Handling**: Throws descriptive errors for HTTP failures, includes response status and text.

**Authentication**: Automatically adds `X-User-ID` header to all requests from constructor parameter.

### UI Components

#### FeedCard Component

**Props**:
- `feed`: Feed object with all metadata
- `stats`: Job statistics (total, enriched, failed)
- `onTriggerRun`: Callback for trigger button

**Layout**:
- Card container with feed name as title
- Status badge (active/inactive)
- Feed ID and URLs
- Nested card with job statistics
- Last run timestamp if available
- Primary button to trigger run

**Interactions**:
- Click "Trigger Feed Run" button → calls `onTriggerRun` → triggers API call

#### FeedList Component

**Props**:
- `feeds`: Array of Feed objects

**Layout**:
- Card container with "Your Feeds" title
- Empty state message if no feeds
- Grid of secondary cards, one per feed
- Each card shows: name, ID, status badge, last run time

**Use Cases**:
- Overview of all user's feeds
- Quick status check
- Navigate to specific feed (future enhancement)

#### JobList Component

**Props**:
- `jobs`: Array of Job objects
- `feedName`: Name of parent feed for context

**Layout**:
- Card container with "Jobs for {feedName}" title
- Empty state with helpful message
- List of secondary cards, one per job
- Each card shows: title, company, location, status badge, source URL, discovery time

**Status Styling**:
- `discovered`: secondary (gray)
- `scraped`: warning (yellow)
- `enriched`: success (green)
- `failed`: danger (red)

---

## Tool Specifications

### show_feed_dashboard

**Description**: Display interactive dashboard for monitoring a job feed

**Input Schema**:
```typescript
{
  feedId: string  // e.g., "feed_92afb77d"
}
```

**Process**:
1. Call `apiClient.getFeedDetails(feedId)`
2. Create `FeedCard` component with feed data and stats
3. Define `onTriggerRun` handler that calls `apiClient.triggerFeedRun`
4. Render component to UI content
5. Return UI resource with unique URI

**Output**: UI resource containing rendered FeedCard

**Error Cases**:
- Feed not found → API returns 404, propagated as error
- Access denied → API returns 404 (same as not found for security)
- API unavailable → Network error propagated

### list_feeds

**Description**: Display all your job feeds

**Input Schema**: Empty object (no parameters)

**Process**:
1. Call `apiClient.listFeeds()`
2. Create `FeedList` component with feeds array
3. Render component to UI content
4. Return UI resource with URI `ui://yubnub/feeds`

**Output**: UI resource containing rendered FeedList

**Error Cases**:
- No feeds → Shows empty state (not an error)
- API unavailable → Network error propagated

### list_jobs

**Description**: Display jobs for a specific feed

**Input Schema**:
```typescript
{
  feedId: string        // Required
  status?: string       // Optional: 'discovered' | 'scraped' | 'enriched' | 'failed'
}
```

**Process**:
1. Call `apiClient.getFeedDetails(feedId)` to get feed name
2. Call `apiClient.listJobs(feedId, status)` to get jobs
3. Create `JobList` component with jobs and feed name
4. Render component to UI content
5. Return UI resource with URI `ui://yubnub/feed/{feedId}/jobs`

**Output**: UI resource containing rendered JobList

**Use Cases**:
- View all jobs: `list_jobs(feedId)`
- View only enriched: `list_jobs(feedId, 'enriched')`
- View failures: `list_jobs(feedId, 'failed')`

### trigger_feed_run

**Description**: Start job discovery for a specific feed

**Input Schema**:
```typescript
{
  feedId: string
}
```

**Process**:
1. Call `apiClient.triggerFeedRun(feedId)`
2. Return text confirmation message

**Output**: Text resource with success message

**Note**: This is an async operation. The actual job discovery happens in the background via Yubnub's worker pipeline.

---

## Security Model

### Authentication Flow

```
1. User configures Claude Desktop with user_id:
   {
     "env": {
       "YUBNUB_USER_ID": "1625"
     }
   }

2. MCP server starts → reads YUBNUB_USER_ID from env

3. API client constructor receives userId

4. Every API call includes X-User-ID header

5. Admin API enforces user isolation:
   - Only returns feeds owned by user_id
   - Only returns jobs for user's feeds
   - Rejects access to other users' data
```

### Multi-Tenant Isolation

**Database Level**: Admin API filters all queries by `user_id` column

**API Level**: All endpoints require `X-User-ID` header

**MCP Level**: User ID configured per MCP server instance (one server per user)

**No Token Validation**: Since MCP server runs as trusted local process, no need for JWT or session tokens

---

## Data Flow

### Typical User Journey

```
1. User: "Show me my feeds"
   ↓
2. Claude: Calls list_feeds tool
   ↓
3. MCP Server: Fetches feeds from API
   ↓
4. MCP Server: Renders FeedList component
   ↓
5. Claude: Displays native UI with feed grid
   ↓
6. User: "Show me feed_92afb77d dashboard"
   ↓
7. Claude: Calls show_feed_dashboard tool
   ↓
8. MCP Server: Fetches feed details and stats
   ↓
9. MCP Server: Renders FeedCard component
   ↓
10. Claude: Displays dashboard with trigger button
    ↓
11. User: Clicks "Trigger Feed Run" button
    ↓
12. Component: Calls onTriggerRun callback
    ↓
13. MCP Server: Calls triggerFeedRun API
    ↓
14. Admin API: Queues discovery job
    ↓
15. Success message shown to user
```

### API Call Pattern

Every API call follows this pattern:

```typescript
async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-User-ID': this.userId,  // Always included
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

---

## Error Handling

### API Errors

```typescript
try {
  const feedDetails = await apiClient.getFeedDetails(feedId);
} catch (error) {
  // Error message includes HTTP status and response text
  // Example: "API request failed: 404 Feed not found"
  throw error; // Propagated to Claude as tool error
}
```

### Tool Errors

When a tool throws an error:
1. MCP SDK catches the error
2. Error message returned to Claude
3. Claude displays error to user in natural language

### Network Errors

Fetch failures (timeout, DNS, connection refused) are caught and propagated as tool errors.

### Type Errors

TypeScript catches type mismatches at compile time, preventing runtime type errors.

---

## Configuration

### Environment Variables

```typescript
interface YubnubConfig {
  userId: string;         // Required: YUBNUB_USER_ID
  adminApiUrl: string;    // Optional: YUBNUB_ADMIN_API_URL
}
```

**Default adminApiUrl**: `https://yubnub-admin-api-staging.fluidjobs.workers.dev`

### Claude Desktop Config

```json
{
  "mcpServers": {
    "yubnub": {
      "command": "node",
      "args": ["C:\\mcp\\yubnub-v2\\build\\index.js"],
      "env": {
        "YUBNUB_USER_ID": "1625",
        "YUBNUB_ADMIN_API_URL": "https://yubnub-admin-api-staging.fluidjobs.workers.dev"
      }
    }
  }
}
```

**Path Requirements**:
- Must be absolute path
- Windows: Use double backslashes
- Unix: Use forward slashes

---

## Performance Considerations

### API Call Optimization

- **Batch Requests**: `show_feed_dashboard` makes single API call for feed+stats
- **Lazy Loading**: Only fetch data when tool is called, not on startup
- **No Caching**: Simple design, relies on Admin API performance

### Component Rendering

- **Server-Side**: Components rendered on MCP server before sending to Claude
- **No Re-renders**: Each tool call creates fresh component instance
- **Minimal Payload**: UI content is compact JSON structure

### Startup Time

- Fast startup: ~100ms to initialize server and register tools
- No database connections to establish
- No heavy dependencies to load

---

## Testing Strategy

### Unit Tests (Future)

- Test API client methods with mock fetch
- Test component rendering with different props
- Test tool handlers with mock API client

### Integration Tests (Future)

- Test full tool call flow with real API (staging)
- Test error handling with invalid inputs
- Test multi-user scenarios

### Manual Testing

Current approach:
1. Build server: `npm run build`
2. Configure Claude Desktop with test user ID
3. Restart Claude
4. Try each tool with various inputs
5. Verify UI renders correctly
6. Test error cases (invalid feed IDs, etc.)

---

## Deployment

### Build Process

```bash
npm install     # Install dependencies
npm run build   # Compile TypeScript to JavaScript
```

**Output**: `build/` directory with compiled JS and type declarations

### Installation

1. Copy built files to target machine
2. Ensure Node.js 20+ is installed
3. Configure Claude Desktop with paths and env vars
4. Restart Claude Desktop

### Updates

1. Pull latest code
2. Run `npm run build`
3. Restart Claude Desktop (no config changes needed)

### Rollback

1. Keep previous build directory
2. Update Claude config to point to old build
3. Restart Claude Desktop

---

## Comparison with v1

### What Changed

| Aspect | v1 | v2 |
|--------|----|----|
| Architecture | Dual workers (CF) | Single Node.js process |
| UI | HTML iframes | Native components |
| Authentication | JWT tokens | Direct env config |
| Deployment | Cloudflare Workers | Local build |
| Type Safety | Partial | Full TypeScript |
| Performance | Slower (iframe load) | Faster (native) |
| Debugging | Tail logs | Node debugging |

### What Stayed the Same

- Tool names and signatures (mostly)
- API endpoint structure
- User isolation model
- Multi-tenant security
- Yubnub Admin API (unchanged)

### Migration Path

1. Keep v1 running for reference
2. Build v2 in parallel
3. Update Claude config to point to v2
4. Test thoroughly
5. Deprecate v1 workers

---

## Future Enhancements

### Phase 2

- **Feed Creation UI**: Wizard-style component for creating new feeds
- **Job Details**: Expandable cards showing full job content
- **Search**: Filter jobs by keywords, company, location
- **Error Viewer**: Detailed error messages with retry actions

### Phase 3

- **Feed Editing**: Update careers URL, example URL
- **Bulk Actions**: Trigger multiple feeds at once
- **Analytics**: Charts showing job counts over time
- **Export**: Download jobs as CSV/JSON

### Phase 4

- **Webhooks**: Configure notifications for feed events
- **Scheduling**: Set up automatic feed runs
- **Templates**: Save feed configurations as templates
- **Collaboration**: Share feeds with team members

---

## Troubleshooting Guide

### Problem: Tools not showing in Claude

**Causes**:
- Invalid JSON in config file
- Wrong file path
- Build errors

**Solutions**:
1. Validate JSON: Use jsonlint or IDE
2. Verify path is absolute with proper escaping
3. Check build output for errors
4. Restart Claude Desktop completely

### Problem: "YUBNUB_USER_ID is required"

**Cause**: Environment variable not set in config

**Solution**: Add to Claude config:
```json
"env": {
  "YUBNUB_USER_ID": "1625"
}
```

### Problem: "API request failed: 404"

**Causes**:
- Feed doesn't exist
- Feed belongs to different user
- Wrong feed ID format

**Solutions**:
1. Verify feed ID format: `feed_XXXXXXXX`
2. Check user_id has access to feed
3. List all feeds first to confirm IDs

### Problem: UI not rendering

**Causes**:
- Component render error
- Invalid props
- Missing @mcp-ui/components dependency

**Solutions**:
1. Check build errors
2. Verify all dependencies installed
3. Review component code for syntax errors

---

## Maintenance

### Dependency Updates

```bash
npm outdated                    # Check for updates
npm update @mcp-ui/components   # Update specific package
npm run build                   # Rebuild
```

### Adding New Tools

1. Add tool registration to `tools/feeds.ts`
2. Create component if needed in `components/`
3. Add types to `types.ts`
4. Update documentation
5. Build and test

### API Changes

If Yubnub Admin API changes:
1. Update types in `types.ts`
2. Update API client methods in `api-client.ts`
3. Update components if response structure changes
4. Update tests
5. Document breaking changes

---

## Success Metrics

### User Experience

- Tool call latency < 1 second
- UI renders immediately (no loading spinners)
- Error messages are clear and actionable

### Developer Experience

- Build time < 5 seconds
- Type safety catches 90%+ of bugs at compile time
- New tools can be added in < 1 hour

### Reliability

- 99.9% uptime (depends on Admin API)
- Graceful error handling
- No silent failures

---

**Specification Version**: 2.0.0  
**Last Updated**: December 5, 2025  
**Status**: Ready for Implementation
