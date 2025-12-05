# Yubnub MCP v2 - Deployment Checklist

**Complete checklist for deployment and testing**  
**Version**: 2.0.0

---

## Pre-Deployment Checklist

### Environment Setup
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm or pnpm available (`npm --version`)
- [ ] Claude Desktop installed
- [ ] Access to Yubnub Admin API
- [ ] Valid Yubnub user ID

### Project Setup
- [ ] Project directory created at `C:\mcp\yubnub-v2`
- [ ] All source files present in `src/`
- [ ] Configuration files present (package.json, tsconfig.json)
- [ ] .gitignore configured

---

## Build Checklist

### Install Dependencies
- [ ] Run `npm install`
- [ ] No installation errors
- [ ] @modelcontextprotocol/sdk installed
- [ ] @mcp-ui/components installed
- [ ] TypeScript installed
- [ ] node_modules/ directory created

### Build Project
- [ ] Run `npm run build`
- [ ] No TypeScript compilation errors
- [ ] build/ directory created
- [ ] build/index.js exists
- [ ] build/index.js has shebang line
- [ ] All .d.ts files generated
- [ ] No warnings in output

### Verify Build
- [ ] `dir build` shows all compiled files
- [ ] File count matches src/ structure
- [ ] index.js is executable

---

## Configuration Checklist

### Claude Desktop Config
- [ ] Config file location: `%APPDATA%\Claude\claude_desktop_config.json`
- [ ] File exists (create if needed)
- [ ] Valid JSON syntax (test with jsonlint.com)
- [ ] "mcpServers" section present
- [ ] "yubnub" server configured

### Server Configuration
- [ ] "command" is "node"
- [ ] "args" contains absolute path to build/index.js
- [ ] Path uses double backslashes on Windows
- [ ] "env" section present
- [ ] "YUBNUB_USER_ID" set to your user ID
- [ ] "YUBNUB_ADMIN_API_URL" set (or using default)

### Example Config (Verify Yours Matches)
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

---

## Deployment Checklist

### Claude Desktop Restart
- [ ] Close Claude Desktop completely
- [ ] Wait 5 seconds
- [ ] Reopen Claude Desktop
- [ ] Wait for initialization

### Verify Tools Loaded
- [ ] Open Claude Desktop Developer Tools (Help → Developer Tools)
- [ ] Check Console tab for errors
- [ ] Look for "yubnub" in logs
- [ ] No red error messages

### Initial Test
- [ ] Type "Show me all my feeds" in Claude
- [ ] Tools should be called automatically
- [ ] UI should render in response
- [ ] No error messages

---

## Functional Testing Checklist

### Test 1: List Feeds
- [ ] Command: "Show me all my feeds"
- [ ] Response: Grid of feed cards
- [ ] Each card shows: name, ID, status
- [ ] Active feeds have green badge
- [ ] Inactive feeds have gray badge

### Test 2: Feed Dashboard
- [ ] Command: "Show me feed_XXXXX dashboard" (use real feed ID)
- [ ] Response: Detailed feed card
- [ ] Shows: name, status, careers URL, statistics
- [ ] Statistics show: total, enriched, failed counts
- [ ] "Trigger Feed Run" button present
- [ ] Last run date shown (if available)

### Test 3: List Jobs
- [ ] Command: "Show me jobs for feed_XXXXX" (use real feed ID)
- [ ] Response: List of job cards
- [ ] Each job shows: title, company, location
- [ ] Status badges colored correctly:
  - Discovered = gray
  - Scraped = yellow
  - Enriched = green
  - Failed = red
- [ ] Source URLs displayed
- [ ] Discovery timestamps shown

### Test 4: Filtered Jobs
- [ ] Command: "Show me enriched jobs for feed_XXXXX"
- [ ] Response: Only jobs with status "enriched"
- [ ] All jobs have green status badge
- [ ] No non-enriched jobs shown

### Test 5: Trigger Run
- [ ] Command: "Trigger a run for feed_XXXXX"
- [ ] Response: Success message
- [ ] Message mentions feed ID
- [ ] No error messages

### Test 6: Error Handling
- [ ] Command with invalid feed ID: "Show me feed_invalid"
- [ ] Response: Clear error message
- [ ] Error mentions "not found" or "access denied"
- [ ] No crashes or hangs

---

## API Testing Checklist

### Health Check
- [ ] Run: `curl https://yubnub-admin-api-staging.fluidjobs.workers.dev/health`
- [ ] Response: 200 OK
- [ ] JSON contains "status": "healthy"

### List Feeds API
- [ ] Run: `curl https://yubnub-admin-api-staging.fluidjobs.workers.dev/api/feeds -H "X-User-ID: 1625"`
- [ ] Response: 200 OK
- [ ] JSON contains "feeds" array
- [ ] At least one feed present (or empty array if none)

### Get Feed Details API
- [ ] Run: `curl https://yubnub-admin-api-staging.fluidjobs.workers.dev/api/feeds/feed_XXXXX -H "X-User-ID: 1625"`
- [ ] Response: 200 OK
- [ ] JSON contains "feed" and "stats"
- [ ] Feed data matches expected structure

---

## Performance Testing Checklist

### Response Times
- [ ] Tool calls complete in < 2 seconds
- [ ] UI renders immediately (no loading spinners)
- [ ] No lag when clicking buttons
- [ ] API calls complete in < 1 second

### Resource Usage
- [ ] Node process starts quickly (< 100ms)
- [ ] Memory usage stable (< 100MB)
- [ ] No memory leaks after multiple tool calls
- [ ] CPU usage minimal when idle

---

## Security Testing Checklist

### User Isolation
- [ ] Cannot access other users' feeds
- [ ] API returns 404 for unauthorized feeds
- [ ] X-User-ID header present in all API calls
- [ ] User ID comes from environment config

### Error Messages
- [ ] No sensitive data in error messages
- [ ] No stack traces shown to user
- [ ] Errors are user-friendly
- [ ] No SQL queries exposed

---

## Documentation Review Checklist

### User Documentation
- [ ] README.md is complete
- [ ] QUICKSTART.md is accurate
- [ ] Examples work as documented
- [ ] Troubleshooting covers common issues

### Technical Documentation
- [ ] SPECIFICATION.md matches implementation
- [ ] IMPLEMENTATION.md has all code
- [ ] Type definitions are up to date
- [ ] Architecture diagrams are correct

### Code Documentation
- [ ] Type annotations present
- [ ] Interfaces documented
- [ ] Function purposes clear
- [ ] Error handling documented

---

## Troubleshooting Checklist

### If Tools Don't Appear
- [ ] Check Claude Desktop Developer Tools for errors
- [ ] Verify config file syntax with jsonlint
- [ ] Confirm paths are absolute
- [ ] Restart Claude Desktop completely
- [ ] Check build succeeded without errors

### If API Calls Fail
- [ ] Test Admin API health endpoint
- [ ] Verify user ID is correct
- [ ] Check network connectivity
- [ ] Review API URL in config
- [ ] Check for typos in feed IDs

### If UI Doesn't Render
- [ ] Check for component errors in build
- [ ] Verify @mcp-ui/components version
- [ ] Review component code for syntax errors
- [ ] Check console for rendering errors

### If Build Fails
- [ ] Update Node.js to 20+
- [ ] Clear node_modules and reinstall
- [ ] Check TypeScript version
- [ ] Review compilation errors
- [ ] Verify tsconfig.json is correct

---

## Post-Deployment Checklist

### Monitoring Setup
- [ ] Document any recurring issues
- [ ] Note performance metrics
- [ ] Track error patterns
- [ ] Monitor API response times

### User Training
- [ ] Document example commands
- [ ] Create user guide
- [ ] Share troubleshooting tips
- [ ] Collect user feedback

### Maintenance Plan
- [ ] Schedule dependency updates
- [ ] Plan for SDK version updates
- [ ] Set up backup/restore process
- [ ] Document rollback procedure

---

## Rollback Checklist

### If Issues Occur
- [ ] Keep previous build directory
- [ ] Update Claude config to point to old build
- [ ] Restart Claude Desktop
- [ ] Verify old version works
- [ ] Document issues found

### Rollback Steps
1. [ ] Stop using current version
2. [ ] Change Claude config path to previous build
3. [ ] Restart Claude Desktop
4. [ ] Test with known-good commands
5. [ ] Fix issues in separate branch
6. [ ] Test fixes thoroughly
7. [ ] Deploy new version

---

## Success Criteria

### Must Pass
- [x] All tools appear in Claude
- [x] Feed dashboard renders correctly
- [x] Jobs list shows proper data
- [x] Trigger run works
- [x] Error handling is graceful
- [x] Performance is acceptable

### Nice to Have
- [ ] Sub-second response times
- [ ] Zero build warnings
- [ ] Complete test coverage
- [ ] User documentation reviewed
- [ ] Code comments added

---

## Sign-off

### Development
- [ ] Code review completed
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Build successful

### Deployment
- [ ] Deployed to target environment
- [ ] Configuration verified
- [ ] Basic tests passed
- [ ] No critical errors

### Operations
- [ ] Monitoring in place
- [ ] Support documentation ready
- [ ] Rollback plan documented
- [ ] Team trained

---

**Checklist Version**: 2.0.0  
**Last Updated**: December 5, 2025  
**Status**: Ready for Use

---

## Notes

Use this checklist for:
- Initial deployment
- Updates and upgrades
- Troubleshooting issues
- Training new team members

Mark items as you complete them. If any item fails, document the issue and resolution.
