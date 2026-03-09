import { useParams, Link } from 'react-router-dom';
import { usePlayer, useH2H } from '../hooks/usePlayers';
import { usePlayerAvailability } from '../hooks/useAvailability';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBox } from '../components/ui';
import ProfileTags from '../components/ProfileTags';
import PlayerBadges from '../components/PlayerBadges';
import { buildSmsUri } from '../utils/sms';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
function timeToHour(t: string): number { const [h, m] = t.split(':').map(Number); return h + m / 60; }
function formatHour(h: number): string { const s = h >= 12 ? 'p' : 'a'; const d = h > 12 ? h - 12 : h === 0 ? 12 : h; return `${d}${s}`; }

export default function PlayerProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data: player, isLoading, error, refetch } = usePlayer(id);
  const { data: h2h } = useH2H(id, me?.id);
  const { data: availSlots } = usePlayerAvailability(id);

  if (isLoading) return <div className="p-4 pb-24 max-w-lg mx-auto"><Spinner /></div>;
  if (error || !player) return <div className="p-4 pb-24 max-w-lg mx-auto"><ErrorBox message={error ? 'Failed to load player' : 'Player not found'} onRetry={refetch} /></div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h1 className="text-2xl font-bold text-green-700">{player.name}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          {player.ntrp && <span>NTRP {player.ntrp}</span>}
          <span>ELO {player.elo}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          <div className="bg-green-50 rounded-lg p-2"><div className="text-lg font-bold text-green-700">{player.wins}</div><div className="text-xs text-gray-500">Wins</div></div>
          <div className="bg-red-50 rounded-lg p-2"><div className="text-lg font-bold text-red-600">{player.losses}</div><div className="text-xs text-gray-500">Losses</div></div>
          <div className="bg-blue-50 rounded-lg p-2"><div className="text-lg font-bold text-blue-600">{player.unique_opponents}</div><div className="text-xs text-gray-500">Opp.</div></div>
          <div className="bg-yellow-50 rounded-lg p-2"><div className="text-lg font-bold text-yellow-600">{player.reliability}%</div><div className="text-xs text-gray-500">Reliable</div></div>
        </div>
        {me && me.id !== player.id && (
          <>
            <Link to={`/invite/${player.id}`} className="block mt-4 bg-green-600 text-white text-center rounded-lg py-3 font-semibold hover:bg-green-700 active:bg-green-800 transition-colors">Invite to Play 🎾</Link>
            {player.phone && (
              <a href={buildSmsUri(player.phone, `Hey ${player.name}, found you on TennisPal! Want to hit sometime? 🎾`)}
                className="block mt-2 bg-green-100 text-green-700 text-center rounded-lg py-3 font-semibold hover:bg-green-200 active:bg-green-300 transition-colors">
                📱 Text Player
              </a>
            )}
          </>
        )}
      </div>

      {h2h && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Head to Head</h2>
          <p className="text-sm">You <span className="text-green-600 font-bold">{h2h.wins}</span> – <span className="text-red-600 font-bold">{h2h.losses}</span> {player.name}</p>
        </div>
      )}

      <PlayerBadges userId={player.id} />

      <ProfileTags userId={player.id} />

      {(() => {
        const avails = availSlots || player.availabilities || [];
        if (!avails.length) return null;
        const byDay: Record<number, typeof avails> = {};
        for (const a of avails) { if (!byDay[a.day_of_week]) byDay[a.day_of_week] = []; byDay[a.day_of_week]!.push(a); }
        const minH = HOURS[0], maxH = HOURS[HOURS.length - 1] + 1, total = maxH - minH;
        return (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Weekly Availability</h2>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-10 shrink-0" />
                <div className="flex-1 flex justify-between text-[10px] text-gray-400 px-0.5">
                  {HOURS.filter((_, i) => i % 2 === 0).map(h => <span key={h}>{formatHour(h)}</span>)}
                </div>
              </div>
              {DAYS.map((day, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="w-10 shrink-0 text-xs font-medium text-gray-500">{day}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded relative">
                    {(byDay[idx] || []).map(a => {
                      const s = Math.max(timeToHour(a.start_time), minH);
                      const e = Math.min(timeToHour(a.end_time), maxH);
                      return (
                        <div key={a.id} className="absolute top-0.5 bottom-0.5 bg-green-500 rounded" style={{ left: `${((s - minH) / total) * 100}%`, width: `${((e - s) / total) * 100}%` }}
                          title={`${a.start_time}–${a.end_time}`}>
                          <span className="text-[9px] text-white font-medium truncate px-1 leading-5">{a.start_time}–{a.end_time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 mb-2">Match History</h2>
        {player.match_history.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No matches yet</p> : (
          <div className="space-y-2">
            {player.match_history.slice(0, 10).map(m => {
              const opp = m.player1.id === player.id ? m.player2 : m.player1;
              const won = m.winner_id === player.id;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <div className="min-w-0">
                    <span className={`inline-block w-5 font-bold ${won ? 'text-green-600' : 'text-red-500'}`}>{won ? 'W' : m.winner_id ? 'L' : '-'}</span>
                    {' vs '}<Link to={`/players/${opp.id}`} className="text-green-700 hover:underline">{opp.name}</Link>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{m.score || m.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
