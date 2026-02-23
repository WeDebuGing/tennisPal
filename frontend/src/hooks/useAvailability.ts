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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  });
}

export function useRemoveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/availability/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  });
}
