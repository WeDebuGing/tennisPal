import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Notification } from '../types';

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.notifications),
  });
}
