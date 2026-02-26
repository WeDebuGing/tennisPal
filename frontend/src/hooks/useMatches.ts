import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Match, MatchInvite } from '../types';

interface MatchesData {
  matches: Match[];
  pending_invites: MatchInvite[];
  sent_invites: MatchInvite[];
}

export function useMatches() {
  return useQuery<MatchesData>({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches').then(r => r.data),
  });
}

export interface UpcomingMatch extends Match {
  opponent: { id: number; name: string; ntrp: number | null } | null;
}

export function useUpcomingMatches() {
  return useQuery<UpcomingMatch[]>({
    queryKey: ['matches', 'upcoming'],
    queryFn: () => api.get('/matches/upcoming').then(r => r.data.matches),
  });
}

export function useRecentResults(limit = 30) {
  return useQuery<Match[]>({
    queryKey: ['recentResults', limit],
    queryFn: () => api.get(`/matches/recent?limit=${limit}`).then(r => r.data.results),
  });
}

export function useMatch(id: string | undefined) {
  return useQuery<Match>({
    queryKey: ['match', id],
    queryFn: () => api.get(`/matches/${id}`).then(r => r.data.match),
    enabled: !!id,
  });
}

export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' }) =>
      api.post(`/invites/${id}/${action}`),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['matches'] });
      const previous = qc.getQueryData<MatchesData>(['matches']);
      qc.setQueryData<MatchesData>(['matches'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pending_invites: old.pending_invites.filter(inv => inv.id !== id),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['matches'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useSubmitScore(matchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sets: any[]; match_format: string }) =>
      api.post(`/matches/${matchId}/score`, data).then(r => r.data.match),
    onSuccess: (match) => {
      qc.setQueryData(['match', matchId], match);
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useConfirmScore(matchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: string) =>
      api.post(`/matches/${matchId}/confirm`, { action }).then(r => r.data.match),
    onSuccess: (match) => {
      qc.setQueryData(['match', matchId], match);
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useCancelMatch(matchId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/matches/${matchId}/cancel`).then(r => r.data.match),
    onSuccess: (match) => {
      qc.setQueryData(['match', matchId], match);
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/invites', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}
