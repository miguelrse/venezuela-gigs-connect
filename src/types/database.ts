// Application types derived from database schema

export type AppRole = 'client' | 'specialist' | 'admin';

export type JobStatus = 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed_pending_client' | 'completed' | 'canceled';

export type JobType = 'presencial' | 'remoto' | 'hibrido';

export type JobUrgency = 'asap' | 'flexible' | 'fecha_especifica';

export type BidStatus = 'submitted' | 'withdrawn' | 'accepted' | 'rejected';

export type ContractStatus = 'active' | 'in_progress' | 'completed_pending_client' | 'completed' | 'canceled';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid_held' | 'released' | 'refunded';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  active: boolean;
  created_at: string;
}

export interface SpecialistCategory {
  id: string;
  user_id: string;
  category_id: string;
  created_at: string;
  category?: Category;
}

export interface Job {
  id: string;
  client_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  budget_min: number | null;
  budget_max: number | null;
  job_type: JobType | null;
  urgency: JobUrgency | null;
  urgency_date: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  client?: Profile;
  bids?: Bid[];
  images?: JobImage[];
  bids_count?: number;
}

export interface JobImage {
  id: string;
  job_id: string;
  url: string;
  created_at: string;
}

export interface Bid {
  id: string;
  job_id: string;
  specialist_id: string;
  amount: number;
  message: string | null;
  eta: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
  specialist?: Profile;
}

export interface Contract {
  id: string;
  job_id: string;
  accepted_bid_id: string;
  client_id: string;
  specialist_id: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
  bid?: Bid;
  client?: Profile;
  specialist?: Profile;
  payment?: Payment;
}

export interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  platform_fee_pct: number;
  fee_amount: number | null;
  payout_amount: number | null;
  status: PaymentStatus;
  method: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ReviewerProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: ReviewerProfile;
  reviewee?: Profile;
  contract?: Contract;
}

// Form types
export interface JobFormData {
  title: string;
  description: string;
  category_id: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy_m?: number | null;
  budget_min: number | null;
  budget_max: number | null;
  job_type: JobType;
  urgency: JobUrgency;
  urgency_date: string;
}

export interface BidFormData {
  amount: number;
  message: string;
  eta: string;
}

export interface ProfileFormData {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
}

export interface PortfolioFormData {
  title: string;
  description: string;
  image_url: string;
  category_id: string;
}
