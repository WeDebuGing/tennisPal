import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';

interface OnboardingData {
  ntrp?: number | null;
  name?: string;
  phone?: string;
  email?: string;
  preferred_courts?: string[];
}

export function useCompleteOnboarding() {
  return useMutation<User, Error, OnboardingData>({
    mutationFn: (data) =>
      api.put('/onboarding', data).then(r => r.data.user),
  });
}
