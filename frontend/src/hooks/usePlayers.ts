import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { User, Match } from '../types';

export function usePlayers(day: string) {
  return useQuery<User[]>({
    queryKey: ['players', day],
    queryFn: () => api.get('/players', { params: day !== '' ? { day } : {} }).then(r => r.data.players),
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery<User & { match_history: Match[] }>({
    queryKey: ['player', id],
    queryFn: () => api.get(`/players/${id}`).then(r => r.data.player),
    enabled: !!id,
  });
}

export function useH2H(playerId: string | undefined, meId: number | undefined) {
  return useQuery<{ wins: number; losses: number; matches: Match[] }>({
    queryKey: ['h2h', playerId],
    queryFn: () => api.get(`/players/${playerId}/h2h`).then(r => r.data.h2h),
    enabled: !!playerId && !!meId,
  });
}
