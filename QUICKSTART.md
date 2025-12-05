# Yubnub MCP v2 - Quick Start

**Get running in 5 minutes**

---

## Step 1: Install Dependencies

```powershell
cd C:\mcp\yubnub-v2
npm install
```

Expected output:
```
added 50 packages
```

---

## Step 2: Build

```powershell
npm run build
```

Expected output:
```
Successfully compiled TypeScript
build/index.js created
```

Verify:
```powershell
dir build\index.js
```

---

## Step 3: Configure Claude Desktop

Open: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

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

**Important**: 
- Replace `1625` with your actual Yubnub user ID
- Use double backslashes in Windows paths
- Save the file

---

## Step 4: Restart Claude Desktop

1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. Wait for tools to load

---

## Step 5: Test

Try these commands in Claude:

### List Your Feeds
```
Show me all my feeds
```

Expected: Grid of feed cards with names, IDs, status badges

### View Feed Dashboard
```
Show me my Mercedes F1 feed dashboard
```

Expected: Detailed feed card with statistics and trigger button

### List Jobs
```
Show me jobs for feed_92afb77d
```

Expected: List of job cards with titles, companies, locations

### Trigger Feed Run
```
Trigger a run for feed_92afb77d
```

Expected: Success message

---

## Troubleshooting

### Tools Don't Appear

1. Check config file syntax: 
   - Use https://jsonlint.com to validate
2. Verify path is correct:
   ```powershell
   Test-Path C:\mcp\yubnub-v2\build\index.js
   ```
3. Check Claude Desktop logs:
   - Help → Developer Tools → Console
4. Restart Claude Desktop again

### "YUBNUB_USER_ID is required"

Missing environment variable in config. Check the `env` section.

### "API request failed: 404"

Feed doesn't exist or you don't have access. List all feeds first.

### Build Errors

```powershell
# Clean install
Remove-Item node_modules -Recurse -Force
Remove-Item build -Recurse -Force
npm install
npm run build
```

---

## What's Next?

- Read [SPECIFICATION.md](./SPECIFICATION.md) for architecture details
- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) for code reference
- Check [README.md](./README.md) for full feature list

---

## Development Workflow

### Watch Mode

```powershell
npm run dev
```

Auto-rebuilds on file changes. Restart Claude Desktop to test.

### Manual Server Test

```powershell
$env:YUBNUB_USER_ID = "1625"
node build\index.js
```

Server will wait for stdio input. Press Ctrl+C to exit.

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages in Claude Desktop Developer Tools
3. Test Admin API directly:
   ```powershell
   curl "https://yubnub-admin-api-staging.fluidjobs.workers.dev/health"
   ```
4. Check build succeeded without errors

---

**Version**: 2.0.0  
**Last Updated**: December 5, 2025
