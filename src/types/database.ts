// Custom database types to supplement auto-generated types
// These match the actual database schema

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  release_year: number | null;
  rating: number | null;
  thumbnail: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  is_featured: boolean | null;
  is_premium_required: boolean | null;
  is_series: boolean | null;
  created_at: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  payment_method: string | null;
  status: string | null;
  duration_days: number | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface Episode {
  id: string;
  movie_id: string | null;
  title: string | null;
  episode_number: number;
  video_url: string;
  is_free: boolean | null;
  created_at: string | null;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number | null;
  receipt_url: string | null;
  status: string | null;
  created_at: string | null;
}
