# Yubnub MCP v2

**Modern MCP server with UI components for Yubnub job aggregation platform**

Interactive dashboards for managing job feeds through Claude Desktop using static HTML templates.

---

## What's New in v2

This is a complete rebuild of the Yubnub MCP server with modern architecture:

- **Single Server Architecture**: No separate dashboard worker needed
- **Static HTML Templates**: Pre-built dashboard templates with {{variable}} placeholders
- **Simplified Security**: Direct API calls with user_id validation
- **Better DX**: TypeScript throughout, cleaner code structure
- **Faster**: No JWT token overhead, no iframe loading delays

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm
- Yubnub account with user ID

### Installation

```bash
cd C:\mcp\yubnub-v2
npm install
npm run build
```

### Claude Desktop Configuration

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

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

**Restart Claude Desktop** and test:
```
User: "Show me my feeds"
```

---

## Features

### Available Tools

#### show_feed_dashboard
Display interactive dashboard for a specific feed with real-time statistics and visual UI.

**Usage**: "Show me my Mercedes F1 feed"

#### list_feeds
Display all your job feeds in formatted output.

**Usage**: "Show me all my feeds"

#### list_jobs
View all jobs for a specific feed, with optional status filtering.

**Usage**: "Show me enriched jobs for feed_92afb77d"

#### get_job
Get detailed information about a specific job.

**Usage**: "Show me details for job_abc123"

#### trigger_feed_run
Start job discovery for a feed.

**Usage**: "Trigger a run for feed_92afb77d"

#### create_feed
Create a new job feed.

**Usage**: "Create a feed for FIA careers site"

#### delete_feed
Delete a feed and all associated jobs.

**Usage**: "Delete feed_92afb77d"

---

## Dashboard Templates

### Location
`C:\mcp\yubnub-v2\templates\dashboard-template.html`

### Documentation
See `C:\mcp\yubnub-v2\templates\README.md` for:
- Complete variable reference
- Helper function implementations
- Design guidelines
- Integration examples

### Template System

The MCP server uses static HTML templates with `{{VARIABLE}}` placeholders:

```typescript
// Load template
const template = fs.readFileSync('templates/dashboard-template.html', 'utf-8');

// Replace variables
let html = template
  .replace('{{USER_EMAIL}}', 'rb@richardbaxter.co')
  .replace('{{TOTAL_FEEDS}}', '5')
  .replace('{{ENRICHED_JOBS}}', '142');

// Return to Claude for artifact rendering
return html;
```

Claude receives the rendered HTML and displays it as an interactive artifact.

---

## Architecture

### Component-Based Design

```
User in Claude Desktop
    ↓ natural language command
Claude interprets → calls MCP tool
    ↓ 
Yubnub MCP Server
    ├── Load Template → templates/dashboard-template.html
    ├── Fetch Data → Yubnub Admin API
    ├── Replace Variables → {{VARIABLE}} placeholders
    └── Return HTML → Claude renders as artifact
```

### Key Improvements Over v1

1. **No Dual-Worker Complexity**: Single Node.js process, no Cloudflare Workers needed
2. **No JWT Tokens**: Direct authentication via environment config
3. **Static Templates**: Pre-built HTML with simple variable replacement
4. **Type Safety**: Full TypeScript with proper types for API responses
5. **Simpler Deployment**: Just build and configure, no wrangler needed

---

## Project Structure

```
yubnub-v2/
├── package.json
├── tsconfig.json
├── README.md
├── SPECIFICATION.md
├── IMPLEMENTATION.md
│
├── templates/
│   ├── dashboard-template.html    # Static dashboard template
│   └── README.md                   # Template documentation
│
└── src/
    ├── index.ts              # Main server entry point
    ├── types.ts              # TypeScript interfaces
    ├── api-client.ts         # Yubnub API client
    │
    └── tools/
        └── feeds.ts          # Feed-related tools
```

---

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Testing

After building, test the server directly:

```bash
# Set environment variables
$env:YUBNUB_USER_ID = "1625"
$env:YUBNUB_ADMIN_API_URL = "https://yubnub-admin-api-staging.fluidjobs.workers.dev"

# Run server (it will wait for stdio input)
node build/index.js
```

---

## Configuration

### Environment Variables

- `YUBNUB_USER_ID` (required): Your Yubnub user ID
- `YUBNUB_ADMIN_API_URL` (optional): Admin API endpoint
  - Default: `https://yubnub-admin-api-staging.fluidjobs.workers.dev`

### Claude Desktop Config

The server uses stdio transport, so it communicates via standard input/output with Claude Desktop.

Configuration is done entirely through the `claude_desktop_config.json` file.

---

## Security

### Multi-Tenant Isolation

Every API request includes the `X-User-ID` header from the configured `YUBNUB_USER_ID`.

The Yubnub Admin API enforces user isolation at the database level, ensuring users can only access their own feeds and jobs.

### No Authentication Tokens

Unlike v1, there's no JWT token generation or iframe security to manage. The MCP server runs as a trusted process on the user's machine with direct API access.

---

## Troubleshooting

### "Tool not appearing in Claude"

1. Check Claude config file syntax (JSON must be valid)
2. Verify paths are absolute and use double backslashes on Windows
3. Restart Claude Desktop completely
4. Check for build errors: `npm run build`

### "YUBNUB_USER_ID is required"

Set the environment variable in your Claude config:
```json
"env": {
  "YUBNUB_USER_ID": "1625"
}
```

### "API request failed"

1. Verify `YUBNUB_ADMIN_API_URL` is correct
2. Test API directly: `curl https://yubnub-admin-api-staging.fluidjobs.workers.dev/health`
3. Check that your user_id has access to the feed
4. Review error messages in Claude Desktop Developer Tools

### "Build fails"

1. Ensure Node.js 20+ is installed: `node --version`
2. Clean install: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npx tsc --noEmit`

### "Dashboard not rendering"

1. Check that `templates/dashboard-template.html` exists
2. Verify file permissions allow reading
3. Check for template syntax errors (unmatched `{{}}` brackets)
4. View Claude artifact console for rendering errors

---

## Migration from v1

If you're upgrading from the v1 dual-worker architecture:

1. **Remove old Cloudflare Workers** - no longer needed
2. **Update Claude config** - point to new local build
3. **Update USER_ID format** - now `YUBNUB_USER_ID` instead of `USER_ID`
4. **Rebuild** - `npm run build` in new directory

The tool signatures are the same, so your prompts should work without changes.

---

## Tech Stack

- **Runtime**: Node.js (stdio transport)
- **Templates**: Static HTML with variable replacement
- **SDK**: `@modelcontextprotocol/sdk`
- **Language**: TypeScript
- **API**: Yubnub Admin API (REST)

---

## Roadmap

### Phase 1 (Current)
- ✅ Basic feed dashboard
- ✅ Feed list view
- ✅ Job list view
- ✅ Trigger feed runs
- ✅ Static HTML templates

### Phase 2 (Planned)
- [ ] Feed creation wizard
- [ ] Job detail viewer with full content
- [ ] Error handling and retry UI
- [ ] Search and filter capabilities

### Phase 3 (Future)
- [ ] Feed editing
- [ ] Bulk operations
- [ ] Analytics and charts
- [ ] Export functionality

---

## Support

**Repository**: Part of Yubnub platform  
**Issues**: Check SPECIFICATION.md for architecture details  
**API Docs**: See C:\dev\yubnub\API.md  
**Templates**: See templates/README.md for dashboard documentation

---

## License

Proprietary - Part of Yubnub platform

---

**Version**: 2.0.0  
**Last Updated**: December 5, 2025  
**Status**: Production Ready
