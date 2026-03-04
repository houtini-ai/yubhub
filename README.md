# Yubhub MCP

MCP server for managing job feeds — discover, enrich, and publish jobs from career pages.

## Setup

```bash
npm install
npm run build
```

### Claude Desktop Configuration

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yubhub": {
      "command": "node",
      "args": ["C:\\mcp\\yubhub-mcp\\dist\\index.js"],
      "env": {
        "YUBHUB_USER_ID": "1625",
        "YUBHUB_ADMIN_API_URL": "https://yubnub-admin-api-staging.fluidjobs.workers.dev"
      }
    }
  }
}
```

Restart Claude Desktop after updating the config.

## Tools

| Tool | Description |
|------|-------------|
| `list_feeds` | List all job feeds |
| `create_feed` | Create a new feed from a careers page URL |
| `get_feed` | Get feed details and statistics |
| `show_feed_dashboard` | Interactive single-feed dashboard |
| `show_all_feeds_dashboard` | Full dashboard with all feeds, stats, sorting, and XML links |
| `trigger_feed_run` | Start job discovery for a feed |
| `delete_feed` | Delete a feed and all its jobs |
| `delete_jobs` | Delete all jobs for a feed |
| `list_jobs` | List jobs for a feed (filterable by status) |
| `get_job` | Get detailed job info including enrichment data |
| `get_feed_schedule` | Check auto-run schedule for a feed |
| `enable_feed_auto_run` | Enable automatic periodic runs |
| `disable_feed_auto_run` | Disable automatic runs |

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `YUBHUB_USER_ID` | Yes | — |
| `YUBHUB_ADMIN_API_URL` | No | `https://yubnub-admin-api-staging.fluidjobs.workers.dev` |

## Project Structure

```
yubhub-mcp/
├── src/
│   ├── index.ts                # MCP server + tool handlers
│   ├── api-client.ts           # REST API client
│   ├── dashboard-generator.ts  # React dashboard HTML generator
│   └── types.ts                # TypeScript interfaces
├── package.json
└── tsconfig.json
```

## License

Proprietary
