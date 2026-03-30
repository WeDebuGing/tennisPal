import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { League, LeagueMembership, LeagueStanding, Match } from '../types';

export function useLeagues() {
  return useQuery<League[]>({
    queryKey: ['leagues'],
    queryFn: () => api.get('/leagues').then(r => r.data.leagues ?? r.data),
  });
}

export function useMyLeagues() {
  return useQuery<League[]>({
    queryKey: ['leagues', 'mine'],
    queryFn: () => api.get('/leagues?mine=1').then(r => r.data.leagues ?? r.data),
  });
}

export function useLeague(slug: string | undefined) {
  return useQuery<League>({
    queryKey: ['league', slug],
    queryFn: () => api.get(`/leagues/${slug}`).then(r => r.data.league ?? r.data),
    enabled: !!slug,
  });
}

export function useLeagueStandings(slug: string | undefined) {
  return useQuery<LeagueStanding[]>({
    queryKey: ['league', slug, 'standings'],
    queryFn: () => api.get(`/leagues/${slug}/standings`).then(r => r.data.standings ?? r.data),
    enabled: !!slug,
  });
}

export function useLeagueMembers(slug: string | undefined) {
  return useQuery<LeagueMembership[]>({
    queryKey: ['league', slug, 'members'],
    queryFn: () => api.get(`/leagues/${slug}/members`).then(r => r.data.members ?? r.data),
    enabled: !!slug,
  });
}

export function useLeagueMatches(slug: string | undefined) {
  return useQuery<Match[]>({
    queryKey: ['league', slug, 'matches'],
    queryFn: () => api.get(`/leagues/${slug}/matches`).then(r => r.data.matches ?? r.data),
    enabled: !!slug,
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.post(`/leagues/${slug}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      qc.invalidateQueries({ queryKey: ['league'] });
    },
  });
}

export function useLeaveLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.post(`/leagues/${slug}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      qc.invalidateQueries({ queryKey: ['league'] });
    },
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; season?: string; start_date?: string; end_date?: string; max_members?: number; require_approval?: boolean }) =>
      api.post('/leagues', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

export function useChallengePlayer(slug: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: number) =>
      api.post(`/leagues/${slug}/challenge/${targetUserId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['league', slug, 'matches'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useApproveMember(slug: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.post(`/leagues/${slug}/members/${userId}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', slug] }),
  });
}

export function useRemoveMember(slug: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.post(`/leagues/${slug}/members/${userId}/remove`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', slug] }),
  });
}

export function usePromoteMember(slug: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.post(`/leagues/${slug}/members/${userId}/promote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['league', slug] }),
  });
}
