import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export interface CourtData {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  num_courts: number;
  lighted: boolean;
  surface: string;
  public: boolean;
  distance_km?: number;
}

export function useCourts(lat?: number, lng?: number, radius?: number) {
  return useQuery<CourtData[]>({
    queryKey: ['courts', lat, lng, radius],
    queryFn: () => {
      const params = new URLSearchParams();
      if (lat !== undefined) params.set('lat', String(lat));
      if (lng !== undefined) params.set('lng', String(lng));
      if (radius !== undefined) params.set('radius', String(radius));
      const qs = params.toString();
      return api.get(`/courts${qs ? '?' + qs : ''}`).then(r => r.data.courts);
    },
  });
}

export function useCourt(id: string | undefined) {
  return useQuery<CourtData>({
    queryKey: ['court', id],
    queryFn: () => api.get(`/courts/${id}`).then(r => r.data.court),
    enabled: !!id,
  });
}
