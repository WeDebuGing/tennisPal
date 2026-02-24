import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

interface Suggestion {
  id: number;
  name: string;
  ntrp: number | null;
  elo: number;
  match_score: number;
  reasons: string[];
  elo_diff: number;
  recent_matches: number;
  availability_overlap: number | null;
  reliability: number;
}

export function useMatchmaking() {
  return useQuery<Suggestion[]>({
    queryKey: ['matchmaking'],
    queryFn: () => api.get('/matchmaking/suggestions').then(r => r.data.suggestions),
  });
}
