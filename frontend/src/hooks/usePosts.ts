import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Post } from '../types';

export function usePosts() {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts').then(r => r.data.posts),
  });
}

export function useRequestPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/posts/${id}/claim`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Keep backward compat alias
export const useClaimPost = useRequestPost;
