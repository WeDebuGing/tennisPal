export interface User {
  id: number; name: string; email?: string; phone?: string;
  ntrp: number | null; elo: number; preferred_courts?: string;
  wins?: number; losses?: number; matches_played?: number;
  unique_opponents?: number; reliability?: number;
  availabilities?: Availability[]; created_at?: string;
}

export interface Availability {
  id: number; user_id: number; day_of_week: number;
  day_name: string; start_time: string; end_time: string;
}

export interface Post {
  id: number; user_id: number; author_name: string; author_ntrp: number | null;
  play_date: string; start_time: string; end_time: string;
  court: string; match_type: string;
  level_min: number | null; level_max: number | null;
  claimed_by_id: number | null; is_active: boolean; created_at: string;
}

export interface MatchInvite {
  id: number; from_user: { id: number; name: string }; to_user: { id: number; name: string };
  play_date: string; start_time: string; end_time: string;
  court: string; match_type: string; status: string; created_at: string;
}

export interface SetScore {
  p1: number; p2: number;
  tiebreak?: { p1: number; p2: number };
}

export interface Match {
  id: number;
  player1: { id: number; name: string }; player2: { id: number; name: string };
  play_date: string; match_type: string; match_format?: string; status: string;
  score: string | null; sets?: SetScore[] | null;
  score_submitted_by: number | null;
  score_confirmed: boolean; score_disputed: boolean;
  winner_id: number | null; winner_name: string | null; created_at: string;
}

export interface Notification {
  id: number; message: string; read: boolean; created_at: string; link: string | null;
}

export interface ReviewTag {
  id: number; name: string; category: string;
}

export interface PlayerReview {
  id: number; reviewer_id: number; reviewee_id: number; match_id: number;
  tags: ReviewTag[]; created_at: string;
}

export interface TagCount {
  tag: ReviewTag; count: number;
}

export interface LeaderboardEntry {
  id: number; name: string; ntrp: number | null; elo: number;
  wins: number; losses: number; matches_played: number;
}
