import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Match, MatchInvite } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [pending, setPending] = useState<MatchInvite[]>([]);
  const [sent, setSent] = useState<MatchInvite[]>([]);

  const load = () => api.get('/matches').then(r => { setMatches(r.data.matches); setPending(r.data.pending_invites); setSent(r.data.sent_invites); });
  useEffect(() => { load(); }, []);

  const respond = async (id: number, action: 'accept' | 'decline') => {
    await api.post(`/invites/${id}/${action}`);
    load();
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-green-700">🎾 My Matches</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">Pending Invites</h2>
          {pending.map(inv => (
            <div key={inv.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-3 mb-2">
              <p className="text-sm font-semibold">{inv.from_user.name} invited you</p>
              <p className="text-xs text-gray-500">{inv.play_date} · {inv.start_time}–{inv.end_time} · {inv.court}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => respond(inv.id, 'accept')} className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg">Accept</button>
                <button onClick={() => respond(inv.id, 'decline')} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">Sent Invites</h2>
          {sent.map(inv => (
            <div key={inv.id} className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-3 mb-2">
              <p className="text-sm">Invited <span className="font-semibold">{inv.to_user.name}</span> · {inv.play_date}</p>
              <p className="text-xs text-gray-400">Pending...</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-700 mb-2">Matches</h2>
        {matches.length === 0 ? <p className="text-sm text-gray-400">No matches yet</p> : (
          <div className="space-y-2">
            {matches.map(m => {
              const opp = m.player1.id === user?.id ? m.player2 : m.player1;
              return (
                <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow p-3 hover:bg-green-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-800">vs {opp.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{m.play_date}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-green-100 text-green-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
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
