/**
 * Dashboard Generator for Yubnub MCP
 * 
 * Generates a modern, self-contained React dashboard HTML
 * Uses CDN imports for React, Tailwind, and Lucide icons
 */

import type { Feed, FeedStats } from './types.js';

interface FeedWithStats extends Feed {
  stats: FeedStats;
}

interface DashboardData {
  feeds: FeedWithStats[];
  timestamp: number;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function calculateSuccessRate(enriched: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((enriched / total) * 100);
}

export function generateDashboardHTML(data: DashboardData): string {
  const totalStats = data.feeds.reduce(
    (acc, feed) => ({
      total: acc.total + feed.stats.total,
      enriched: acc.enriched + feed.stats.enriched,
      failed: acc.failed + feed.stats.failed,
    }),
    { total: 0, enriched: 0, failed: 0 }
  );

  const overallSuccessRate = calculateSuccessRate(totalStats.enriched, totalStats.total);

  // Generate feeds data as JSON for React
  const feedsData = data.feeds.map(feed => ({
    id: feed.id,
    name: feed.name,
    careersUrl: feed.careers_url,
    total: feed.stats.total,
    enriched: feed.stats.enriched,
    failed: feed.stats.failed,
    lastRun: feed.last_run_at || 0,
    lastRunFormatted: feed.last_run_at ? formatRelativeTime(feed.last_run_at) : 'Never',
    successRate: calculateSuccessRate(feed.stats.enriched, feed.stats.total),
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yubnub Dashboard</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    const { useState, useMemo } = React;

    // Lucide icons as inline SVG components
    const RefreshCw = ({ className }) => (
      <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    );

    const ExternalLink = ({ className }) => (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    );

    const CheckCircle = ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );

    const XCircle = ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );

    const Clock = ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );

    const TrendingUp = ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );

    const feedsData = ${JSON.stringify(feedsData)};
    const totalStats = ${JSON.stringify(totalStats)};
    const overallSuccessRate = ${overallSuccessRate};

    function Dashboard() {
      const [sortBy, setSortBy] = useState('name');
      const [sortAsc, setSortAsc] = useState(true);

      const sortedFeeds = useMemo(() => {
        return [...feedsData].sort((a, b) => {
          let aVal, bVal;
          switch (sortBy) {
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'total':
              aVal = a.total;
              bVal = b.total;
              break;
            case 'enriched':
              aVal = a.enriched;
              bVal = b.enriched;
              break;
            case 'failed':
              aVal = a.failed;
              bVal = b.failed;
              break;
            case 'lastRun':
              aVal = a.lastRun;
              bVal = b.lastRun;
              break;
            case 'successRate':
              aVal = a.successRate;
              bVal = b.successRate;
              break;
            default:
              return 0;
          }
          
          if (typeof aVal === 'string') {
            return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return sortAsc ? aVal - bVal : bVal - aVal;
        });
      }, [sortBy, sortAsc]);

      const handleSort = (column) => {
        if (sortBy === column) {
          setSortAsc(!sortAsc);
        } else {
          setSortBy(column);
          setSortAsc(true);
        }
      };

      const SortIndicator = ({ column }) => {
        if (sortBy !== column) return null;
        return <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>;
      };

      const getXmlFeedUrl = (feedId) => {
        return \`https://yubnub-xml-generator-staging.fluidjobs.workers.dev/feed/\${feedId}\`;
      };

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-100 mb-2">Yubnub Feed Dashboard</h1>
                  <p className="text-slate-400">Motorsport job aggregation pipeline</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Total Feeds</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{feedsData.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Total Jobs</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{totalStats.total}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Enriched</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{totalStats.enriched}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{totalStats.failed}</p>
                </div>
              </div>
            </div>

            {/* Feed Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      <th 
                        className="text-left p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('name')}
                      >
                        Feed Name <SortIndicator column="name" />
                      </th>
                      <th 
                        className="text-center p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('total')}
                      >
                        Total <SortIndicator column="total" />
                      </th>
                      <th 
                        className="text-center p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('enriched')}
                      >
                        Enriched <SortIndicator column="enriched" />
                      </th>
                      <th 
                        className="text-center p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('failed')}
                      >
                        Failed <SortIndicator column="failed" />
                      </th>
                      <th 
                        className="text-center p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('successRate')}
                      >
                        Success <SortIndicator column="successRate" />
                      </th>
                      <th 
                        className="text-left p-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-750"
                        onClick={() => handleSort('lastRun')}
                      >
                        Last Run <SortIndicator column="lastRun" />
                      </th>
                      <th className="text-center p-4 text-sm font-semibold text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFeeds.map((feed, index) => {
                      const hasJobs = feed.total > 0;
                      
                      return (
                        <tr 
                          key={feed.id}
                          className={\`border-b border-slate-800 hover:bg-slate-800/50 transition-colors \${
                            index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'
                          }\`}
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-slate-100">{feed.name}</p>
                              <p className="text-xs text-slate-500 mt-1 font-mono">{feed.id}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={\`font-semibold \${hasJobs ? 'text-slate-100' : 'text-slate-600'}\`}>
                              {feed.total}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-green-400">{feed.enriched}</span>
                              {hasJobs && (
                                <span className="text-xs text-slate-500">({feed.successRate}%)</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={\`font-semibold \${feed.failed > 0 ? 'text-red-400' : 'text-slate-600'}\`}>
                              {feed.failed}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={\`font-semibold \${
                              feed.successRate >= 90 ? 'text-green-400' : 
                              feed.successRate >= 70 ? 'text-yellow-400' : 
                              'text-red-400'
                            }\`}>
                              {feed.successRate}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-slate-400">{feed.lastRunFormatted}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={feed.careersUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                                title="View careers page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <a
                                href={getXmlFeedUrl(feed.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={\`px-3 py-1 text-xs font-medium rounded transition-colors \${
                                  hasJobs 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }\`}
                                title={hasJobs ? "View XML feed" : "No jobs yet"}
                                onClick={(e) => !hasJobs && e.preventDefault()}
                              >
                                XML
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-slate-500">
              <p>Yubnub v2 • Staging Environment</p>
              <p className="mt-1">Last updated: {new Date(${data.timestamp}).toLocaleString('en-GB')}</p>
            </div>
          </div>
        </div>
      );
    }

    ReactDOM.render(<Dashboard />, document.getElementById('root'));
  </script>
</body>
</html>`;
}
