import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { User, Match } from '../types';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlayerProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [player, setPlayer] = useState<User & { match_history: Match[] } | null>(null);
  const [h2h, setH2h] = useState<{ wins: number; losses: number; matches: Match[] } | null>(null);

  useEffect(() => {
    api.get(`/players/${id}`).then(r => setPlayer(r.data.player));
    if (me) api.get(`/players/${id}/h2h`).then(r => setH2h(r.data.h2h)).catch(() => {});
  }, [id, me]);

  if (!player) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-2xl font-bold text-green-700">{player.name}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          {player.ntrp && <span>NTRP {player.ntrp}</span>}
          <span>ELO {player.elo}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          <div className="bg-green-50 rounded-lg p-2"><div className="text-lg font-bold text-green-700">{player.wins}</div><div className="text-xs text-gray-500">Wins</div></div>
          <div className="bg-red-50 rounded-lg p-2"><div className="text-lg font-bold text-red-600">{player.losses}</div><div className="text-xs text-gray-500">Losses</div></div>
          <div className="bg-blue-50 rounded-lg p-2"><div className="text-lg font-bold text-blue-600">{player.unique_opponents}</div><div className="text-xs text-gray-500">Opponents</div></div>
          <div className="bg-yellow-50 rounded-lg p-2"><div className="text-lg font-bold text-yellow-600">{player.reliability}%</div><div className="text-xs text-gray-500">Reliable</div></div>
        </div>
        {me && me.id !== player.id && (
          <Link to={`/invite/${player.id}`} className="block mt-4 bg-green-600 text-white text-center rounded-lg py-2 font-semibold hover:bg-green-700">Invite to Play 🎾</Link>
        )}
      </div>

      {h2h && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Head to Head</h2>
          <p className="text-sm">You <span className="text-green-600 font-bold">{h2h.wins}</span> – <span className="text-red-600 font-bold">{h2h.losses}</span> {player.name}</p>
        </div>
      )}

      {player.availabilities && player.availabilities.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Weekly Availability</h2>
          <div className="space-y-1">
            {player.availabilities.map(a => (
              <p key={a.id} className="text-sm text-gray-600">{DAYS[a.day_of_week]} {a.start_time}–{a.end_time}</p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-2">Match History</h2>
        {player.match_history.length === 0 ? <p className="text-sm text-gray-400">No matches yet</p> : (
          <div className="space-y-2">
            {player.match_history.slice(0, 10).map(m => {
              const opp = m.player1.id === player.id ? m.player2 : m.player1;
              const won = m.winner_id === player.id;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm border-b pb-1">
                  <div>
                    <span className={won ? 'text-green-600 font-semibold' : 'text-red-500'}>{won ? 'W' : m.winner_id ? 'L' : '-'}</span>
                    {' vs '}<Link to={`/players/${opp.id}`} className="text-green-700 hover:underline">{opp.name}</Link>
                  </div>
                  <span className="text-xs text-gray-400">{m.score || m.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
