import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { usePosts, useRequestPost } from '../hooks/usePosts';
import { useUpcomingMatches, useMatches } from '../hooks/useMatches';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const { data: upcoming } = useUpcomingMatches();
  const { data: matchData } = useMatches();
  const requestMutation = useRequestPost();
  const { toast } = useToast();
  const [requestedPosts, setRequestedPosts] = useState<Set<number>>(new Set());

  // Track posts the user has already sent requests for
  const sentRequestPostIds = new Set(
    matchData?.sent_invites?.filter(inv => inv.post_id).map(inv => inv.post_id) ?? []
  );

  const handleRequest = (id: number) => {
    requestMutation.mutate(id, {
      onSuccess: () => {
        toast('Request sent! ✉️ The poster will review it.');
        setRequestedPosts(prev => new Set(prev).add(id));
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || 'Failed to send request';
        toast(msg, 'error');
      },
    });
  };

  const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${ap}`; };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      {/* Upcoming Matches */}
      {user && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-indigo-700 mb-3">📅 Upcoming Matches</h2>
          {upcoming && upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map(m => (
                <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm p-3 border-l-4 border-indigo-500 active:bg-indigo-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <span className="font-semibold text-indigo-700">{m.opponent?.name ?? 'TBD'}</span>
                      {m.opponent?.ntrp && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">NTRP {m.opponent.ntrp}</span>}
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full shrink-0 capitalize">{m.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">📅 {fmt(m.play_date)} · {m.match_type}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-sm text-indigo-600">No upcoming matches — <Link to="/post" className="font-semibold underline">post when you're free!</Link></p>
            </div>
          )}
        </div>
      )}

      {/* Looking to Play */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">🎾 Looking to Play</h1>
        <Link to="/post" className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 shadow-md transition-colors">+ Post</Link>
      </div>
      {isLoading ? <Spinner text="Loading posts..." /> :
       error ? <ErrorBox message="Failed to load posts" onRetry={refetch} /> :
       !posts?.length ? <EmptyState icon="📝" title="No posts yet" subtitle="Be the first to post — tap + below!" /> : (
        <div className="space-y-3">
          {posts.map(p => {
            const alreadyRequested = requestedPosts.has(p.id) || sentRequestPostIds.has(p.id);
            return (
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
                  alreadyRequested ? (
                    <div className="mt-3 text-sm text-green-600 font-medium flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Request sent — waiting for response
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequest(p.id)}
                      disabled={requestMutation.isPending}
                      className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors w-full sm:w-auto"
                    >
                      {requestMutation.isPending ? 'Sending...' : "I'm In! 🎾"}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
