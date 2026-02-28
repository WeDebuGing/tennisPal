import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { User, Match } from '../types';

export interface PlayerSearchParams {
  day?: string;
  search?: string;
  ntrp_min?: number;
  ntrp_max?: number;
  court?: string;
  sort?: 'name' | 'ntrp' | 'activity';
}

export type PlayerResult = User & { preferred_courts?: string };

export function usePlayers(params: PlayerSearchParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.day) queryParams.day = params.day;
  if (params.search) queryParams.search = params.search;
  if (params.ntrp_min !== undefined) queryParams.ntrp_min = String(params.ntrp_min);
  if (params.ntrp_max !== undefined) queryParams.ntrp_max = String(params.ntrp_max);
  if (params.court) queryParams.court = params.court;
  if (params.sort) queryParams.sort = params.sort;

  return useQuery<PlayerResult[]>({
    queryKey: ['players', queryParams],
    queryFn: () => api.get('/players', { params: queryParams }).then(r => r.data.players),
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
