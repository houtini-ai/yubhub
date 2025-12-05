export interface YubnubConfig {
  userId: string;
  adminApiUrl: string;
}

export interface Feed {
  id: string;
  name: string;
  user_id: number;
  careers_url: string;
  example_job_url: string | null;
  is_active: number;
  last_run_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Job {
  id: string;
  feed_id: string;
  source_url: string;
  status: 'discovered' | 'scraped' | 'enriched' | 'failed';
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  discovered_at: number;
  scraped_at: number | null;
  enriched_at: number | null;
  updated_at: number;
}

export interface FeedStats {
  total: number;
  enriched: number;
  failed: number;
}

export interface FeedDetails {
  feed: Feed;
  stats: FeedStats;
}
