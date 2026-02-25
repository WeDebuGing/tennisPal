import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { usePosts, useClaimPost } from '../hooks/usePosts';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const claimMutation = useClaimPost();
  const { toast } = useToast();

  const handleClaim = (id: number) => {
    claimMutation.mutate(id, {
      onSuccess: () => toast('You\'re in! Match created 🎾'),
      onError: () => toast('Failed to claim post', 'error'),
    });
  };

  const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${ap}`; };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">🎾 Looking to Play</h1>
        <Link to="/post" className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 shadow-md transition-colors">+ Post</Link>
      </div>
      {isLoading ? <Spinner text="Loading posts..." /> :
       error ? <ErrorBox message="Failed to load posts" onRetry={refetch} /> :
       !posts?.length ? <EmptyState icon="📝" title="No posts yet" subtitle="Be the first to post — tap + below!" /> : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 active:bg-green-50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <Link to={`/players/${p.user_id}`} className="font-semibold text-green-700 hover:underline truncate">{p.author_name}</Link>
                  {p.author_ntrp && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {p.author_ntrp}</span>}
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{p.match_type}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">📅 {fmt(p.play_date)} · ⏰ {fmtTime(p.start_time)}–{fmtTime(p.end_time)}</p>
              {p.court && <p className="text-sm text-gray-500">📍 {p.court}</p>}
              {(p.level_min || p.level_max) && <p className="text-xs text-gray-400 mt-1">Level: {p.level_min}–{p.level_max}</p>}
              {user && user.id !== p.user_id && (
                <button
                  onClick={() => handleClaim(p.id)}
                  disabled={claimMutation.isPending}
                  className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  {claimMutation.isPending ? 'Joining...' : "I'm In! 🎾"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
