import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export default function PlayerBadges({ userId }: { userId: number }) {
  const { data } = useQuery<Badge[]>({
    queryKey: ['badges', userId],
    queryFn: () => api.get(`/api/users/${userId}/badges`).then(r => r.data.badges),
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="font-semibold text-gray-700 mb-2">Badges</h2>
      <div className="flex flex-wrap gap-2">
        {data.map(b => (
          <span
            key={b.id}
            title={b.description}
            className="inline-flex items-center gap-1 text-sm bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200"
          >
            {b.emoji} {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}
