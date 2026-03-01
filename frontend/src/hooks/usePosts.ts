import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Post } from '../types';

export interface PostFilters {
  level_min?: number;
  level_max?: number;
  court?: string;
  date_from?: string;
  date_to?: string;
  sort?: 'newest' | 'closest_date' | 'skill_match';
  for_you?: boolean;
}

export function usePosts(filters?: PostFilters) {
  return useQuery<Post[]>({
    queryKey: ['posts', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.level_min != null) params.set('level_min', String(filters.level_min));
      if (filters?.level_max != null) params.set('level_max', String(filters.level_max));
      if (filters?.court) params.set('court', filters.court);
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);
      if (filters?.sort) params.set('sort', filters.sort);
      if (filters?.for_you) params.set('for_you', '1');
      const qs = params.toString();
      return api.get(`/posts${qs ? '?' + qs : ''}`).then(r => r.data.posts);
    },
  });
}

export function useClaimPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/posts/${id}/claim`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['posts'] });
      const previous = qc.getQueryData<Post[]>(['posts']);
      qc.setQueryData<Post[]>(['posts'], (old) => old?.filter(p => p.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(['posts'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export interface UpdatePostData {
  play_date?: string;
  start_time?: string;
  end_time?: string;
  court?: string;
  match_type?: string;
  level_min?: number | null;
  level_max?: number | null;
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePostData }) =>
      api.put(`/posts/${id}`, data).then(r => r.data.post as Post),
    onSuccess: (updated) => {
      qc.setQueryData<Post[]>(['posts'], (old) =>
        old?.map(p => (p.id === updated.id ? updated : p)) ?? []
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/posts/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['posts'] });
      const previous = qc.getQueryData<Post[]>(['posts']);
      qc.setQueryData<Post[]>(['posts'], (old) => old?.filter(p => p.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(['posts'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
