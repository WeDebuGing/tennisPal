import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

interface Settings {
  notify_sms: boolean;
  notify_email: boolean;
}

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.settings),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) =>
      api.put('/settings', settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
