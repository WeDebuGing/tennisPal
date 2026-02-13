import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { Match, SetScore } from '../types';
import { useAuth } from '../context/AuthContext';
import ScoreSubmission from '../components/ScoreSubmission';

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => { api.get(`/matches/${id}`).then(r => setMatch(r.data.match)); }, [id]);

  if (!match) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  const canSubmitScore = match.status === 'scheduled' && user && (user.id === match.player1.id || user.id === match.player2.id);
  const canConfirm = match.status === 'completed' && !match.score_confirmed && !match.score_disputed && user && match.score_submitted_by !== user.id;

  const handleStructuredSubmit = async (sets: SetScore[], matchFormat: string) => {
    const { data } = await api.post(`/matches/${id}/score`, { sets, match_format: matchFormat });
    setMatch(data.match);
  };

  const confirm = async (action: string) => {
    const { data } = await api.post(`/matches/${id}/confirm`, { action });
    setMatch(data.match);
  };

  const cancel = async () => {
    const { data } = await api.post(`/matches/${id}/cancel`);
    setMatch(data.match);
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-bold text-green-700">{match.player1.name} vs {match.player2.name}</h1>
        <p className="text-sm text-gray-500 mt-1">📅 {match.play_date} · {match.match_type}</p>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${match.status === 'completed' ? 'bg-green-100 text-green-700' : match.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{match.status}</span>
        {match.score && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            {match.sets ? (
              <div className="space-y-2">
                <div className="flex gap-4 justify-center">
                  {match.sets.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Set {i + 1}</div>
                      <div className={`text-lg font-bold ${s.p1 > s.p2 ? 'text-green-700' : 'text-gray-500'}`}>{s.p1}</div>
                      <div className={`text-lg font-bold ${s.p2 > s.p1 ? 'text-green-700' : 'text-gray-500'}`}>{s.p2}</div>
                      {s.tiebreak && (s.p1 + s.p2 === 13) && (
                        <div className="text-xs text-gray-400">({Math.min(s.tiebreak.p1, s.tiebreak.p2)})</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 text-sm text-gray-500">
                  <span>{match.player1.name}</span>
                  <span>{match.player2.name}</span>
                </div>
              </div>
            ) : (
              <p className="font-semibold">{match.score}</p>
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">Winner: {match.winner_name}</p>
            <p className="text-xs text-gray-400 text-center">{match.score_confirmed ? '✅ Confirmed' : match.score_disputed ? '❌ Disputed' : '⏳ Awaiting confirmation'}</p>
          </div>
        )}
      </div>

      {canSubmitScore && (
        <ScoreSubmission match={match} onSubmit={handleStructuredSubmit} />
      )}

      {canConfirm && (
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">Confirm Score?</h2>
          <div className="flex gap-2">
            <button onClick={() => confirm('confirm')} className="flex-1 bg-green-600 text-white rounded-lg p-3 font-semibold">Confirm ✅</button>
            <button onClick={() => confirm('dispute')} className="flex-1 bg-red-500 text-white rounded-lg p-3 font-semibold">Dispute ❌</button>
          </div>
        </div>
      )}

      {match.status === 'scheduled' && user && (
        <button onClick={cancel} className="w-full bg-red-100 text-red-600 rounded-xl p-3 font-semibold">Cancel Match</button>
      )}
    </div>
  );
}
