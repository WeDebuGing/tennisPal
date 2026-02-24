import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Availability } from '../types';

export function useAvailability() {
  return useQuery<Availability[]>({
    queryKey: ['availability'],
    queryFn: () => api.get('/availability').then(r => r.data.slots),
  });
}

export function useAddAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: { day_of_week: string; start_time: string; end_time: string }) =>
      api.post('/availability', form),
    onSettled: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  });
}

export function useRemoveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/availability/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['availability'] });
      const previous = qc.getQueryData<Availability[]>(['availability']);
      qc.setQueryData<Availability[]>(['availability'], (old) => old?.filter(s => s.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(['availability'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  });
}
