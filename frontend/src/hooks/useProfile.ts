import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';

export interface ProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  ntrp?: number | null;
  preferred_courts?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<User, Error, ProfileUpdate>({
    mutationFn: (data) =>
      api.put('/profile', data).then((r) => r.data.user),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
