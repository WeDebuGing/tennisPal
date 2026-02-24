import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches, useRecentResults, useRespondInvite } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';
import { Match } from '../types';

export default function Matches() {
  const { user } = useAuth();
  const { data: myData, isLoading: myLoading, error: myError, refetch } = useMatches();
  const { data: recentResults, isLoading: recentLoading } = useRecentResults();
  const respondMutation = useRespondInvite();
  const { toast } = useToast();
  const [showInvites, setShowInvites] = useState(false);

  const handleRespond = (id: number, action: 'accept' | 'decline') => {
    respondMutation.mutate({ id, action }, {
      onSuccess: () => toast(action === 'accept' ? 'Invite accepted! Match on 🎾' : 'Invite declined'),
      onError: () => toast('Failed to respond to invite', 'error'),
    });
  };

  if (myLoading || recentLoading) return <div className="p-4 pb-24 max-w-lg mx-auto"><Spinner text="Loading results..." /></div>;
  if (myError) return <div className="p-4 pb-24 max-w-lg mx-auto"><ErrorBox message="Failed to load matches" onRetry={refetch} /></div>;

  const { pending_invites: pending = [], sent_invites: sent = [] } = myData || {};
  const inviteCount = pending.length + sent.length;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-indigo-700">📊 Match Results</h1>

      {/* Collapsible invites section */}
      {inviteCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowInvites(!showInvites)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span>
              📩 Invites
              {pending.length > 0 && (
                <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pending.length} pending
                </span>
              )}
              {sent.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">{sent.length} sent</span>
              )}
            </span>
            <span className="text-gray-400">{showInvites ? '▲' : '▼'}</span>
          </button>

          {showInvites && (
            <div className="px-4 pb-4 space-y-2">
              {pending.map(inv => (
                <div key={inv.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                  <p className="text-sm font-semibold">{inv.from_user.name} invited you</p>
                  <p className="text-xs text-gray-500 mt-0.5">{inv.play_date} · {inv.start_time}–{inv.end_time} · {inv.court}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleRespond(inv.id, 'accept')} disabled={respondMutation.isPending}
                      className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg disabled:opacity-50">Accept</button>
                    <button onClick={() => handleRespond(inv.id, 'decline')} disabled={respondMutation.isPending}
                      className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg disabled:opacity-50">Decline</button>
                  </div>
                </div>
              ))}
              {sent.map(inv => (
                <div key={inv.id} className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-3">
                  <p className="text-sm">Invited <span className="font-semibold">{inv.to_user.name}</span></p>
                  <p className="text-xs text-gray-400">{inv.play_date} · ⏳ Pending</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent results feed */}
      <div>
        <h2 className="font-semibold text-gray-500 mb-3 text-xs uppercase tracking-wider">Recent Results</h2>
        {!recentResults || recentResults.length === 0 ? (
          <EmptyState icon="📊" title="No results yet" subtitle="Completed matches will appear here" />
        ) : (
          <div className="space-y-3">
            {recentResults.map(m => (
              <ResultCard key={m.id} match={m} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ match: m, currentUserId }: { match: Match; currentUserId?: number }) {
  const p1Won = m.winner_id === m.player1.id;
  const p2Won = m.winner_id === m.player2.id;

  return (
    <Link to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Score header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Player 1 */}
          <div className={`flex-1 text-left ${p1Won ? '' : 'opacity-60'}`}>
            <p className={`text-sm font-bold ${p1Won ? 'text-indigo-700' : 'text-gray-600'}`}>
              {p1Won && '🏆 '}{m.player1.name}
              {m.player1.id === currentUserId && <span className="text-xs text-gray-400 ml-1">(you)</span>}
            </p>
          </div>

          {/* Score */}
          {m.sets && m.sets.length > 0 ? (
            <div className="flex gap-2 shrink-0">
              {m.sets.map((set, i) => (
                <div key={i} className="text-center">
                  <div className={`text-sm font-mono font-bold ${p1Won ? 'text-indigo-700' : 'text-gray-500'}`}>{set.p1}</div>
                  <div className="border-t border-gray-200 mt-0.5 pt-0.5">
                    <span className={`text-sm font-mono font-bold ${p2Won ? 'text-indigo-700' : 'text-gray-500'}`}>{set.p2}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : m.score ? (
            <span className="text-sm font-mono font-bold text-gray-700">{m.score}</span>
          ) : null}

          {/* Player 2 */}
          <div className={`flex-1 text-right ${p2Won ? '' : 'opacity-60'}`}>
            <p className={`text-sm font-bold ${p2Won ? 'text-indigo-700' : 'text-gray-600'}`}>
              {m.player2.name}{p2Won && ' 🏆'}
              {m.player2.id === currentUserId && <span className="text-xs text-gray-400 ml-1">(you)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <span>📅 {m.play_date}</span>
        <span className="capitalize">{m.match_type} · {m.match_format?.replace(/_/g, ' ')}</span>
      </div>
    </Link>
  );
}
