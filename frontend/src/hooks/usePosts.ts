import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Post } from '../types';

export function usePosts() {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts').then(r => r.data.posts),
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
