# MCP-UI Investigation & Dashboard Enhancement

**Date**: December 5, 2025  
**Objective**: Investigate MCP-UI for interactive button functionality and enhance dashboard template

---

## Background

We've built a static HTML dashboard template for Yubnub MCP v2 that displays feed information. Currently, buttons are non-functional placeholders. We need to investigate if MCP-UI enables **clickable buttons that trigger MCP tool calls**.

### Current Setup

**Location**: `C:\mcp\yubnub-v2\templates\dashboard-template.html`

**What We Have**:
- Static HTML template with `{{VARIABLE}}` placeholders
- Visual dashboard with stats, feeds table, jobs list, pipeline status
- Non-functional buttons (Create Feed, Run Now, Delete, etc.)
- Template gets rendered and returned to Claude as HTML string
- Claude displays it as an artifact

**What We Want**:
- Buttons that actually DO something when clicked
- "Run Now" button → triggers `trigger_feed_run` tool
- "Create Feed" button → opens create feed form/wizard
- Trash icon → triggers `delete_feed` tool
- "Refresh Data" button → re-renders dashboard with fresh data

---

## Investigation Tasks

### 1. Research MCP-UI Components

**Primary Questions**:
- Does `@mcp-ui/components` or `@modelcontextprotocol/sdk` provide interactive UI components?
- Can buttons in artifacts send messages back to the MCP server to trigger tool calls?
- Is there a message-passing mechanism between Claude artifacts and MCP servers?

**Where to Look**:
- Check if we already have `@mcp-ui/components` installed: `C:\mcp\yubnub-v2\node_modules`
- Search npm for MCP UI packages: https://www.npmjs.com/search?q=mcp-ui
- Review MCP Inspector architecture for UI patterns
- Check MCP specification for client-server communication patterns

**Key Files to Check**:
```
C:\mcp\yubnub-v2\node_modules\@mcp-ui\
C:\mcp\yubnub-v2\package.json  (look for mcp-ui dependencies)
```

### 2. Test Current Button Behavior

**In the dashboard artifact, buttons currently have**:
```html
<button class="btn btn-secondary">Refresh Data</button>
<button class="btn btn-primary">+ Create Feed</button>
<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">
  Run Now
</button>
```

**Test**:
1. Render the dashboard in Claude
2. Click a button
3. What happens? (Expected: nothing, or maybe browser console error)

### 3. Investigate Message Passing

**Look for**:
- `window.postMessage` APIs in MCP-UI
- Event listeners that Claude might provide
- Special data attributes like `data-mcp-tool`, `data-mcp-action`
- JavaScript APIs like `window.claude.callTool()`

**Example Pattern We're Looking For**:
```html
<!-- Does something like this exist? -->
<button onclick="window.claude.callTool('trigger_feed_run', {feedId: 'feed_123'})">
  Run Now
</button>
```

### 4. Check Existing MCP Servers for UI Patterns

**Servers to Review**:
- MCP Inspector: `C:\mcp\` (if available)
- Gmail MCP: `C:\mcp\gmail-mcp-enhanced`
- JBoard MCP: `C:\mcp\jboard-mcp`
- Any server with UI components

**Look for**:
- How they return HTML/UI
- Any interactive elements
- Message passing mechanisms
- Use of `@mcp-ui` packages

---

## Alternative Approaches (If MCP-UI Doesn't Support This)

### Option A: Conversational Flow
Instead of clickable buttons, use natural language prompts:

```
Dashboard shows feed with ID visible
User: "Run feed_b2eb0723"
Claude: [calls trigger_feed_run tool]
```

**Pros**: Works with current architecture
**Cons**: Less intuitive UX, more typing for user

### Option B: Copy-Paste Tool Calls
Include clickable "copy" buttons that copy the correct prompt to clipboard:

```html
<button onclick="navigator.clipboard.writeText('Trigger run for feed_b2eb0723')">
  📋 Copy Run Command
</button>
```

**Pros**: Simple, works in artifacts
**Cons**: Extra step, not truly interactive

### Option C: External Web Dashboard
Build a separate React web app hosted on Cloudflare Pages:

```
User clicks → Web app → Yubnub Admin API → Database
MCP server just displays link to web dashboard
```

**Pros**: Full interactivity, modern UX
**Cons**: Separate deployment, authentication complexity

### Option D: React Component in Artifact
Use React artifact type instead of HTML:

```typescript
// React artifact with state management
const [feeds, setFeeds] = useState([]);

// But can it call MCP tools? That's the question.
```

---

## Dashboard Template Enhancements

**Regardless of button functionality**, improve the visual design:

### Visual Improvements Needed

1. **Better Color Palette**
   - Current: Basic blue/green/red
   - Enhance: Add depth with shadows, gradients
   - Consider: Dark mode support

2. **Typography Refinement**
   - Add font weights for hierarchy
   - Improve spacing and line heights
   - Consider monospace for IDs/codes

3. **Micro-Interactions**
   - Hover states with smooth transitions
   - Loading states for async operations
   - Success/error animations

4. **Data Visualization**
   - Replace progress bars with better charts?
   - Add sparklines for trends
   - Timeline view for pipeline stages

5. **Responsive Design**
   - Test on mobile/tablet viewports
   - Improve table scrolling on small screens
   - Consider card layout for mobile

6. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

### Specific UI Enhancements

**Stats Cards**:
```css
/* Add subtle animations */
.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**Feed Icons**:
- Replace single letter with actual logos using Logo.dev API
- Or use better icon set (Heroicons, Feather, Lucide)

**Pipeline Visualization**:
- Show actual flow diagram with arrows
- Color-code based on health status
- Show queue depths

**Feeds Table**:
- Add inline editing capability (if buttons work)
- Quick actions menu (three-dot icon)
- Bulk selection checkboxes

---

## Implementation Steps

### Phase 1: Investigation (1-2 hours)
1. Check for `@mcp-ui` packages in node_modules
2. Search npm registry for MCP UI libraries
3. Review MCP spec for client-server UI patterns
4. Test button clicks in current dashboard
5. Check other MCP servers for UI examples

### Phase 2: Decision (30 minutes)
Based on findings, choose:
- **Path A**: Implement with MCP-UI (if available)
- **Path B**: Enhanced static template with conversational triggers
- **Path C**: Hybrid approach (static + external web app)

### Phase 3: Enhancement (2-3 hours)
1. Improve visual design of template
2. Add better color system
3. Refine typography
4. Add micro-interactions
5. Improve accessibility
6. Update documentation

### Phase 4: Testing (1 hour)
1. Test in Claude Desktop
2. Verify all variables render correctly
3. Check responsive behavior
4. Test accessibility features

---

## Key Questions to Answer

1. **Does `@mcp-ui/components` exist and what does it provide?**
   - Check npm, check installed packages
   
2. **Can Claude artifacts communicate back to MCP servers?**
   - Is there a `window.claude` API?
   - Does `postMessage` work?
   - Are there MCP-specific data attributes?

3. **How do other MCP servers handle interactivity?**
   - Review existing servers in `C:\mcp\`
   - Look for interactive patterns

4. **What's the recommended pattern for MCP UI?**
   - Check official MCP documentation
   - Look at Inspector implementation
   - Review MCP SDK source code

5. **If buttons can't trigger tools directly, what's the best UX alternative?**
   - Conversational prompts?
   - Copy-paste helpers?
   - External web dashboard?

---

## Success Criteria

### Minimum Success
- Understand if interactive buttons are possible with MCP
- Document findings clearly
- Identify best approach for Yubnub dashboard

### Ideal Success
- Interactive buttons working and calling MCP tools
- Enhanced visual design deployed
- Full documentation updated
- Examples of each button interaction

---

## Files to Work With

**Primary**:
- `C:\mcp\yubnub-v2\templates\dashboard-template.html`
- `C:\mcp\yubnub-v2\templates\README.md`
- `C:\mcp\yubnub-v2\src\index.ts`
- `C:\mcp\yubnub-v2\package.json`

**Reference**:
- `C:\mcp\yubnub-v2\README.md`
- `C:\mcp\yubnub-v2\SPECIFICATION.md`
- Other MCP servers in `C:\mcp\`

---

## Expected Outcomes

### Documentation
- Clear answer on MCP-UI capabilities
- Recommended approach for interactive dashboards
- Updated template documentation with any new patterns

### Code
- Enhanced dashboard template (visual improvements)
- Interactive buttons (if possible)
- Helper functions for rendering

### Testing
- Verified button functionality (or documented limitations)
- Screenshots/examples of enhanced dashboard
- User flow documentation

---

## Resources

**NPM Packages to Check**:
- `@mcp-ui/components`
- `@modelcontextprotocol/sdk`
- Search: "mcp ui", "mcp components", "mcp interface"

**Documentation**:
- https://modelcontextprotocol.io/
- MCP specification on GitHub
- MCP Inspector source code

**Existing Code**:
- `C:\mcp\yubnub-v2\node_modules\@modelcontextprotocol\`
- Other MCP server implementations

---

## Next Session Prompt

```
Hey Claude! I need your help investigating MCP-UI capabilities and enhancing our Yubnub dashboard.

CONTEXT:
We built a static HTML dashboard template for a Yubnub MCP server. It displays feed information beautifully but the buttons don't work - they're just visual elements. We want to know if we can make buttons actually trigger MCP tool calls.

INVESTIGATION NEEDED:
1. Does @mcp-ui/components or similar exist for interactive UI?
2. Can buttons in Claude artifacts send messages back to MCP servers?
3. What's the recommended pattern for interactive MCP dashboards?
4. Check our existing MCP servers for UI patterns

FILES TO CHECK:
- C:\mcp\yubnub-v2\node_modules\ (look for @mcp-ui)
- C:\mcp\yubnub-v2\package.json
- C:\mcp\yubnub-v2\templates\dashboard-template.html
- Other MCP servers in C:\mcp\ for UI examples

ALSO:
Regardless of button functionality, enhance the dashboard visual design - better colors, typography, micro-interactions, accessibility.

START BY:
1. Checking if @mcp-ui packages exist in node_modules
2. Searching npm for "mcp ui" related packages
3. Reading this entire handover document
```

---

**Status**: Ready for next session  
**Priority**: High - this determines our UI strategy  
**Time Estimate**: 3-4 hours total
