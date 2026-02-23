import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { LeaderboardEntry } from '../types';

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data.leaderboard),
  });
}
