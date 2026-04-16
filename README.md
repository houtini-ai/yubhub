<p align="center">
  <img src="logo.jpg" alt="YubHub" width="120" />
</p>

<h1 align="center">YubHub MCP Server</h1>

<p align="center">
  Turn any careers page into a structured job feed. Straight from Claude, Cursor or any MCP client.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@houtini/yubhub"><img src="https://img.shields.io/npm/v/@houtini/yubhub.svg" alt="npm version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-brightgreen.svg" alt="MCP Compatible" /></a>
  <a href="https://www.npmjs.com/package/@houtini/yubhub"><img src="https://img.shields.io/npm/dt/@houtini/yubhub" alt="npm downloads" /></a>
</p>

<p align="center">
  <a href="https://glama.ai/mcp/servers/houtini-ai/yub-hub-mcp-server">
    <img width="380" height="200" src="https://glama.ai/mcp/servers/houtini-ai/yub-hub-mcp-server/badge" alt="YubHub MCP server" />
  </a>
</p>

---

## Quick start

You'll need a [YubHub account](https://yubhub.co) first. Head to your [account page](https://yubhub.co/dashboard/account) to grab your **User ID** and **API key** (required).

### Claude Desktop

Open your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this block inside `"mcpServers"`:

```json
{
  "mcpServers": {
    "yubhub": {
      "command": "npx",
      "args": ["-y", "@houtini/yubhub"],
      "env": {
        "YUBHUB_USER_ID": "your-user-id",
        "YUBHUB_API_KEY": "yh_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. That's it. Ask Claude to "list my YubHub feeds" and you should see your data come back.

### Cursor / VS Code

Same idea. Drop the config into your MCP settings and point it at `npx -y @houtini/yubhub` with the same env vars.

## What it does

YubHub watches careers pages. Point it at a company's jobs URL, and it will discover every open role, scrape the listings, enrich them with AI (title normalisation, category tagging, salary extraction, company research) and publish them as an XML feed.

This MCP server gives you full control over that pipeline from inside your AI assistant. Create feeds, trigger runs, check on jobs, view dashboards, browse market stats. No browser tab required.

### The pipeline

```
Careers page URL
  → Discovery (ATS API / sitemap / crawl)
    → Scraping (page content extraction)
      → Enrichment (AI structuring + company research)
        → XML feed (ready for job boards, aggregators, your own site)
```

Supported ATS platforms include Greenhouse, Lever, Workable, Workday, Oracle HCM, SmartRecruiters, Ashby, Pinpoint, Phenom and more. For platforms with public APIs (Greenhouse, Lever, Workable, Pinpoint), discovery skips scraping entirely and goes straight to enrichment.

## Tools

21 tools across four areas.

### Feed management

| Tool | What it does |
|------|-------------|
| `list_feeds` | Get all your job feeds |
| `create_feed` | Create a feed from a careers page URL |
| `get_feed` | Feed details including run history and job counts |
| `show_feed_dashboard` | Interactive visual dashboard for a single feed |
| `show_all_feeds_dashboard` | Overview dashboard with all feeds, stats and XML links |
| `trigger_feed_run` | Start job discovery now |
| `update_feed` | Change feed name, tag or source URLs |
| `delete_feed` | Remove a feed and all its jobs |
| `delete_jobs` | Clear all jobs for a feed (keeps the feed) |

### Scheduling

| Tool | What it does |
|------|-------------|
| `get_feed_schedule` | Check auto-run schedule and next run time |
| `enable_feed_auto_run` | Turn on automatic runs (default: weekly) |
| `disable_feed_auto_run` | Turn off automatic runs |

### Jobs

| Tool | What it does |
|------|-------------|
| `list_jobs` | List jobs for a feed, optionally filtered by status |
| `get_job` | Full job details: title, company, location, salary, skills, description |
| `retry_failed_jobs` | Re-queue failed jobs for another attempt |

### Market statistics

| Tool | What it does |
|------|-------------|
| `get_stats_overview` | High-level numbers: total jobs, companies, active feeds |
| `get_top_companies` | Companies ranked by job count with recent activity |
| `get_categories` | Job counts by sector with experience level breakdown |
| `get_top_titles` | Most common job titles by volume |
| `get_title_trends` | Titles gaining or losing demand (2-week comparison) |
| `get_work_arrangements` | Remote vs hybrid vs onsite distribution |
| `get_experience_levels` | Entry, mid, senior level distribution |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YUBHUB_USER_ID` | Yes | Your YubHub user ID |
| `YUBHUB_API_KEY` | Yes | API key from your [account page](https://yubhub.co/dashboard/account) |
| `YUBHUB_ADMIN_API_URL` | No | API endpoint (defaults to `https://api.yubhub.co`) |

## Example conversation

> **You:** Create a feed for Mercedes F1 careers at https://www.mercedesamgf1.com/careers
>
> **Claude:** Done. Feed created with ID `feed_abc123`. Want me to trigger a run?
>
> **You:** Yes please.
>
> **Claude:** Discovery started. I'll check back in a couple of minutes.
>
> **You:** How did it go?
>
> **Claude:** Found 47 jobs. 42 enriched successfully, 5 still processing. Here's a breakdown by category...

**Tip:** For best results, provide an example job URL when creating a feed. This helps YubHub identify the URL pattern for job listings on that site, significantly improving discovery accuracy. You can pass it as the optional `exampleJobUrl` parameter in `create_feed`.

## Development

```bash
git clone https://github.com/houtini-ai/yubhub.git
cd yubhub
npm install
npm run build
```

The server compiles TypeScript to `dist/` and runs as a stdio MCP server. Source lives in `src/`:

```
src/
├── index.ts                # MCP server, tool definitions and handlers
├── api-client.ts           # REST client for the YubHub API
├── dashboard-generator.ts  # React-based interactive dashboard builder
└── types.ts                # TypeScript interfaces
```

### Running locally

```bash
YUBHUB_USER_ID=your-id YUBHUB_API_KEY=yh_your_key node dist/index.js
```

Or point your MCP client at the built output instead of using npx.

## Contributing

Issues and pull requests welcome. If you're adding a tool or changing behaviour, please test against a real YubHub account.

## Links

- [YubHub](https://yubhub.co) — the platform
- [Documentation](https://yubhub.co/docs) — full docs
- [MCP specification](https://modelcontextprotocol.io) — Model Context Protocol

## License

MIT — see [LICENSE](LICENSE) for details.
