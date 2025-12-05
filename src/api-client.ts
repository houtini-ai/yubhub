import type { Feed, FeedDetails, Job } from './types.js';

export class YubnubApiClient {
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

  async getFeedDetails(feedId: string): Promise<FeedDetails> {
    return this.request(`/api/feeds/${feedId}`);
  }

  async triggerFeedRun(feedId: string): Promise<{ message: string; feedId: string }> {
    return this.request(`/api/feeds/${feedId}/run`, { method: 'POST' });
  }

  async listJobs(feedId: string, status?: string): Promise<{ jobs: Job[]; total: number }> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/feeds/${feedId}/jobs${query}`);
  }

  async getJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/api/jobs/${jobId}`);
  }
}
