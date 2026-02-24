import { Link } from 'react-router-dom';
import { useMatches, useRespondInvite } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Matches() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useMatches();
  const respondMutation = useRespondInvite();

  if (isLoading) return <div className="p-4 pb-24 max-w-lg mx-auto"><Spinner text="Loading matches..." /></div>;
  if (error) return <div className="p-4 pb-24 max-w-lg mx-auto"><ErrorBox message="Failed to load matches" onRetry={refetch} /></div>;

  const { matches = [], pending_invites: pending = [], sent_invites: sent = [] } = data || {};

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-green-700">🎾 My Matches</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Pending Invites</h2>
          {pending.map(inv => (
            <div key={inv.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-2">
              <p className="text-sm font-semibold">{inv.from_user.name} invited you</p>
              <p className="text-xs text-gray-500 mt-1">{inv.play_date} · {inv.start_time}–{inv.end_time} · {inv.court}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => respondMutation.mutate({ id: inv.id, action: 'accept' })} className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg active:bg-green-800 transition-colors">Accept</button>
                <button onClick={() => respondMutation.mutate({ id: inv.id, action: 'decline' })} className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg active:bg-red-700 transition-colors">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Sent Invites</h2>
          {sent.map(inv => (
            <div key={inv.id} className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-4 mb-2">
              <p className="text-sm">Invited <span className="font-semibold">{inv.to_user.name}</span> · {inv.play_date}</p>
              <p className="text-xs text-gray-400 mt-1">⏳ Pending...</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Matches</h2>
        {matches.length === 0 ? <EmptyState icon="🎾" title="No matches yet" subtitle="Find a player and start playing!" /> : (
          <div className="space-y-2">
            {matches.map(m => {
              const opp = m.player1.id === user?.id ? m.player2 : m.player1;
              return (
                <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm p-4 hover:bg-green-50 active:bg-green-100 transition-colors">
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800">vs {opp.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{m.play_date}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${m.status === 'completed' ? 'bg-green-100 text-green-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                  </div>
                  {m.score && <p className="text-sm text-gray-500 mt-1">{m.score} {m.score_confirmed ? '✅' : m.score_disputed ? '❌' : '⏳'}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
