// Typed helpers for database views that don't live in the auto-generated types file.
// Views: public_profiles (profiles without phone), open_jobs_feed (jobs with coords masked)
import { supabase } from "./client";

export interface PublicProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenJobFeedRow {
  id: string;
  client_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  job_type: string | null;
  urgency: string | null;
  urgency_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type AnyClient = { from: (t: string) => any };

export const publicProfiles = () =>
  (supabase as unknown as AnyClient).from("public_profiles") as {
    select: (cols?: string) => any;
  };

export const openJobsFeed = () =>
  (supabase as unknown as AnyClient).from("open_jobs_feed") as {
    select: (cols?: string) => any;
  };
