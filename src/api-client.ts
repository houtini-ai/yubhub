import type { Feed, FeedDetails, Job, FeedSchedule, StatsOverview, TopCompany, CategoryStat, TitleStat, TitleTrend, ArrangementStat, ExperienceStat } from './types.js';

export class YubhubApiClient {
  constructor(
    private baseUrl: string,
    private userId: string,
    private apiKey?: string
  ) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': this.userId,
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
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

  async createFeed(name: string, careersUrl: string, exampleJobUrl?: string): Promise<{ id: string; message: string }> {
    return this.request('/api/feeds', {
      method: 'POST',
      body: JSON.stringify({ name, careersUrl, exampleJobUrl }),
    });
  }

  async getFeedDetails(feedId: string): Promise<FeedDetails> {
    return this.request(`/api/feeds/${feedId}`);
  }

  async updateFeed(feedId: string, data: { name?: string; tag?: string | null; careersUrl?: string; exampleJobUrl?: string | null }): Promise<{ feed: Feed }> {
    return this.request(`/api/feeds/${feedId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFeed(feedId: string): Promise<{ message: string }> {
    return this.request(`/api/feeds/${feedId}`, { method: 'DELETE' });
  }

  async triggerFeedRun(feedId: string): Promise<{ message: string; feedId: string }> {
    return this.request(`/api/feeds/${feedId}/run`, { method: 'POST' });
  }

  async listJobs(feedId: string, status?: string): Promise<{ jobs: Job[]; total: number }> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/feeds/${feedId}/jobs${query}`);
  }

  async deleteJobs(feedId: string): Promise<{ message: string }> {
    return this.request(`/api/feeds/${feedId}/jobs`, { method: 'DELETE' });
  }

  async getJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/api/jobs/${jobId}`);
  }

  // Account management
  async deleteAccount(): Promise<{ ok: boolean }> {
    return this.request('/api/account', { method: 'DELETE' });
  }

  // Schedule management
  async getFeedSchedule(feedId: string): Promise<FeedSchedule> {
    return this.request(`/api/feeds/${feedId}/schedule`);
  }

  async retryFailedJobs(feedId: string): Promise<{ message: string; feedId: string; enrichQueued: number; scrapeQueued: number }> {
    return this.request(`/api/feeds/${feedId}/jobs/retry-failed`, { method: 'POST' });
  }

  async updateFeedSchedule(
    feedId: string,
    enabled: boolean,
    intervalDays: number = 7
  ): Promise<{ message: string; feedId: string; intervalDays: number; nextRunAt: string | null }> {
    return this.request(`/api/feeds/${feedId}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled, intervalDays }),
    });
  }

  // Public stats endpoints (no auth required, but request() adds headers anyway — harmless)
  async getStatsOverview(): Promise<{ data: StatsOverview }> {
    return this.request('/stats/overview');
  }

  async getTopCompanies(): Promise<{ data: TopCompany[] }> {
    return this.request('/stats/top-companies');
  }

  async getCategories(): Promise<{ data: CategoryStat[] }> {
    return this.request('/stats/categories');
  }

  async getTopTitles(): Promise<{ data: TitleStat[] }> {
    return this.request('/stats/top-titles');
  }

  async getTitleTrends(): Promise<{ data: TitleTrend[] }> {
    return this.request('/stats/title-trends');
  }

  async getWorkArrangements(): Promise<{ data: ArrangementStat[] }> {
    return this.request('/stats/work-arrangements');
  }

  async getExperienceLevels(): Promise<{ data: ExperienceStat[] }> {
    return this.request('/stats/experience-levels');
  }
}
