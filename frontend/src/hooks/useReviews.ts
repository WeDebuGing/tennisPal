import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { ReviewTag, PlayerReview, TagCount } from '../types';

export function useReviewTags() {
  return useQuery<Record<string, ReviewTag[]>>({
    queryKey: ['reviewTags'],
    queryFn: () => api.get('/review-tags').then(r => r.data.tags),
  });
}

export function useReviewStatus(matchId: string | number | undefined) {
  return useQuery<{ reviewed: boolean; review: PlayerReview | null }>({
    queryKey: ['reviewStatus', matchId],
    queryFn: () => api.get(`/matches/${matchId}/review-status`).then(r => r.data),
    enabled: !!matchId,
  });
}

export function useSubmitReview(matchId: string | number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag_ids: number[]) =>
      api.post(`/matches/${matchId}/review`, { tag_ids }).then(r => r.data.review),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviewStatus', matchId] });
    },
  });
}

export function useUserTags(userId: number | string | undefined) {
  return useQuery<{ public_tags: TagCount[]; all_tags: TagCount[] }>({
    queryKey: ['userTags', userId],
    queryFn: () => api.get(`/users/${userId}/tags`).then(r => r.data),
    enabled: !!userId,
  });
}
