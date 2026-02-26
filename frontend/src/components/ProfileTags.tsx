import { useUserTags } from '../hooks/useReviews';

const CATEGORY_COLORS: Record<string, string> = {
  play_style: 'bg-blue-50 text-blue-700',
  sportsmanship: 'bg-green-50 text-green-700',
  logistics: 'bg-yellow-50 text-yellow-700',
  vibe: 'bg-purple-50 text-purple-700',
};

export default function ProfileTags({ userId }: { userId: number | string }) {
  const { data } = useUserTags(userId);
  const tags = data?.public_tags;

  if (!tags || tags.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="font-semibold text-gray-700 mb-3">Player Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <span key={tag.id}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${CATEGORY_COLORS[tag.category] || 'bg-gray-100 text-gray-700'}`}>
            {tag.name} <span className="opacity-60">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
