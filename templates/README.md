# Yubnub Dashboard Template

Static HTML dashboard template for Yubnub MCP server.

## Template Variables

Replace these placeholders when rendering:

### Header Variables
- `{{USER_EMAIL}}` - User email address (e.g., "rb@richardbaxter.co")
- `{{ENVIRONMENT}}` - Environment name (e.g., "Staging", "Production")
- `{{LAST_UPDATED}}` - Last update timestamp (e.g., "05/12/2025, 20:15:43")

### Stats Grid Variables
- `{{TOTAL_FEEDS}}` - Total number of feeds
- `{{ACTIVE_FEEDS}}` - Number of active feeds
- `{{SCHEDULED_FEEDS}}` - Number of scheduled feeds
- `{{TOTAL_JOBS}}` - Total jobs across all feeds
- `{{ENRICHED_JOBS}}` - Number of enriched jobs
- `{{SUCCESS_RATE}}` - Success rate percentage (e.g., "100")
- `{{FAILED_JOBS}}` - Number of failed jobs

### Feeds Table
- `{{FEEDS_TABLE_ROWS}}` - HTML table rows for each feed

#### Feed Row Template
```html
<tr>
  <td>
    <div class="feed-name">
      <div class="feed-icon">{{FEED_INITIAL}}</div>
      <div>
        <div style="font-weight: 600;">{{FEED_NAME}}</div>
        <div style="font-size: 12px; color: #a0aec0;">{{FEED_ID}}</div>
      </div>
    </div>
  </td>
  <td>
    <span class="badge {{FEED_STATUS_CLASS}}">{{FEED_STATUS_LABEL}}</span>
  </td>
  <td>
    <a href="{{FEED_CAREERS_URL}}" target="_blank" class="url-link">
      {{FEED_CAREERS_URL_SHORT}}
    </a>
  </td>
  <td>
    <div>
      <strong>{{FEED_TOTAL_JOBS}}</strong> jobs
      <div class="progress">
        <div class="progress-bar" style="width: {{FEED_PROGRESS_PERCENT}}%;"></div>
      </div>
      <div class="progress-text">{{FEED_ENRICHED}} enriched, {{FEED_FAILED}} failed</div>
    </div>
  </td>
  <td>
    <span style="font-weight: 600; color: {{SUCCESS_RATE_COLOR}};">{{FEED_SUCCESS_RATE}}%</span>
  </td>
  <td>
    <div class="time {{TIME_CLASS}}">{{FEED_LAST_RUN_RELATIVE}}</div>
    <div style="font-size: 12px; color: #a0aec0;">{{FEED_LAST_RUN_ABSOLUTE}}</div>
  </td>
  <td>
    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">
      Run Now
    </button>
  </td>
</tr>
```

**Status Classes:**
- `active` - Green badge (active feed)
- `inactive` - Red badge (inactive feed)
- `scheduled` - Blue badge (scheduled feed)

**Time Classes:**
- `recent` - Green text (< 5 minutes ago)
- Default - Gray text (older)

### Recent Jobs
- `{{RECENT_JOBS_LIST}}` - HTML list of recent job items

#### Job Item Template
```html
<div class="job-item {{JOB_STATUS_CLASS}}">
  <div class="job-title">{{JOB_TITLE}}</div>
  <div class="job-meta">
    <strong>{{JOB_COMPANY}}</strong> • {{JOB_LOCATION}} • 
    <span class="badge {{JOB_STATUS_BADGE_CLASS}}" style="font-size: 11px; padding: 2px 8px;">{{JOB_STATUS}}</span>
  </div>
  <div class="job-meta" style="margin-top: 4px;">
    Discovered {{JOB_DISCOVERED_RELATIVE}}
  </div>
</div>
```

**Job Status Classes:**
- No class - Green left border (enriched)
- `scraped` - Yellow left border (scraped)
- `discovered` - Blue left border (discovered)

**Job Status Badge Classes:**
- `active` - Green badge (enriched)
- `badge` with yellow styles (scraped)
- `badge` with blue styles (discovered)

### Pipeline Health
- `{{DISCOVERY_STATUS}}` - CSS class: `complete`, `running`, or `pending`
- `{{DISCOVERY_LABEL}}` - Label text (e.g., "Operational", "Running", "Idle")
- `{{DISCOVERY_LAST_RUN}}` - Last run time (e.g., "2 minutes ago")
- `{{SCRAPER_STATUS}}` - CSS class for scraper
- `{{SCRAPER_LABEL}}` - Scraper status label
- `{{SCRAPER_LAST_RUN}}` - Scraper last run time
- `{{ENRICHMENT_STATUS}}` - CSS class for enrichment
- `{{ENRICHMENT_LABEL}}` - Enrichment status label
- `{{ENRICHMENT_LAST_RUN}}` - Enrichment last run time
- `{{XML_STATUS}}` - CSS class for XML generator
- `{{XML_LABEL}}` - XML generator status label
- `{{XML_LAST_RUN}}` - XML generator last run time

**Pipeline Status Classes:**
- `complete` - Green dot (operational)
- `running` - Yellow pulsing dot (processing)
- `pending` - Gray dot (idle)

## Usage Example

```typescript
import fs from 'fs';

function renderDashboard(data: DashboardData): string {
  let template = fs.readFileSync('templates/dashboard-template.html', 'utf-8');
  
  // Replace header variables
  template = template.replace('{{USER_EMAIL}}', data.userEmail);
  template = template.replace('{{ENVIRONMENT}}', data.environment);
  template = template.replace('{{LAST_UPDATED}}', data.lastUpdated);
  
  // Replace stats
  template = template.replace('{{TOTAL_FEEDS}}', data.totalFeeds.toString());
  template = template.replace('{{ACTIVE_FEEDS}}', data.activeFeeds.toString());
  template = template.replace('{{SCHEDULED_FEEDS}}', data.scheduledFeeds.toString());
  template = template.replace('{{TOTAL_JOBS}}', data.totalJobs.toString());
  template = template.replace('{{ENRICHED_JOBS}}', data.enrichedJobs.toString());
  template = template.replace('{{SUCCESS_RATE}}', data.successRate.toString());
  template = template.replaceAll('{{FAILED_JOBS}}', data.failedJobs.toString());
  
  // Generate feed rows
  const feedRows = data.feeds.map(feed => generateFeedRow(feed)).join('');
  template = template.replace('{{FEEDS_TABLE_ROWS}}', feedRows);
  
  // Generate job items
  const jobItems = data.recentJobs.map(job => generateJobItem(job)).join('');
  template = template.replace('{{RECENT_JOBS_LIST}}', jobItems);
  
  // Replace pipeline variables
  template = template.replace('{{DISCOVERY_STATUS}}', data.pipeline.discovery.status);
  template = template.replace('{{DISCOVERY_LABEL}}', data.pipeline.discovery.label);
  template = template.replace('{{DISCOVERY_LAST_RUN}}', data.pipeline.discovery.lastRun);
  // ... (repeat for other workers)
  
  return template;
}
```

## Helper Functions

### Format Time
```typescript
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
```

### Shorten URL
```typescript
function shortenUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '') + urlObj.pathname.slice(0, 30);
  } catch {
    return url;
  }
}
```

### Get Feed Initial
```typescript
function getFeedInitial(feedName: string): string {
  return feedName.charAt(0).toUpperCase();
}
```

### Calculate Success Rate
```typescript
function calculateSuccessRate(enriched: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((enriched / total) * 100);
}
```

### Get Success Rate Color
```typescript
function getSuccessRateColor(rate: number): string {
  if (rate >= 90) return '#38a169'; // Green
  if (rate >= 70) return '#d69e2e'; // Yellow
  return '#e53e3e'; // Red
}
```

### Get Time Class
```typescript
function getTimeClass(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  return minutes < 5 ? 'recent' : '';
}
```

## Design Features

- **Responsive Grid Layout** - Adapts to screen sizes
- **Sortable Table** - Click headers to sort (UI only, needs JS implementation)
- **Status Badges** - Color-coded for quick scanning
- **Progress Bars** - Visual job completion indicators
- **Pipeline Health** - Real-time worker status with animated pulses
- **Hover Effects** - Interactive table rows and buttons
- **Professional Typography** - System font stack
- **Subtle Shadows** - Depth and hierarchy

## Color Palette

- **Success**: #38a169 (green)
- **Warning**: #d69e2e (yellow)
- **Danger**: #e53e3e (red)
- **Primary**: #3182ce (blue)
- **Background**: #f5f7fa (light gray)
- **Text**: #2d3748 (dark gray)
- **Borders**: #e2e8f0 (light gray)

## File Location

`C:\mcp\yubnub-v2\templates\dashboard-template.html`

## Integration

This template is designed to be used by the Yubnub MCP `show_feed_dashboard` tool. The MCP server should:

1. Load the template file from `C:\mcp\yubnub-v2\templates\dashboard-template.html`
2. Fetch data from Yubnub API
3. Replace all `{{VARIABLE}}` placeholders
4. Return complete HTML to Claude
5. Claude renders as artifact

## Future Enhancements

- Add JavaScript for client-side sorting
- Implement filter dropdowns
- Add search functionality
- Modal dialogs for job details
- Export to CSV functionality
- Dark mode toggle
