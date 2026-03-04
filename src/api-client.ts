import type { Feed, FeedDetails, Job, FeedSchedule } from './types.js';

export class YubhubApiClient {
  constructor(
    private baseUrl: string,
    private userId: string
  ) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-User-ID': this.userId,
        'Content-Type': 'application/json',
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

  // Schedule management
  async getFeedSchedule(feedId: string): Promise<FeedSchedule> {
    return this.request(`/api/feeds/${feedId}/schedule`);
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
}
