export interface YubhubConfig {
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
  // Scheduler fields
  auto_run_enabled?: number;
  run_interval_days?: number;
  next_run_at?: number | null;
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
  // Enrichment fields
  job_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  work_arrangement: string | null;
  skills: string | null; // JSON string: {required: string[], preferred: string[]}
  company_info: string | null;
  company_website: string | null;
  company_logo_url: string | null;
}

export interface FeedStats {
  total: number;
  enriched: number | null;
  failed: number | null;
}

export interface FeedDetails {
  feed: Feed;
  stats: FeedStats;
}

export interface FeedSchedule {
  feedId: string;
  name: string;
  autoRunEnabled: boolean;
  intervalDays: number;
  nextRunAt: string | null;
  lastRunAt: string | null;
}
