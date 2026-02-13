import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Suggestion {
  id: number;
  name: string;
  ntrp: number | null;
  elo: number;
  match_score: number;
  reasons: string[];
  elo_diff: number;
  recent_matches: number;
  availability_overlap: number | null;
  reliability: number;
}

export default function Matchmaking() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matchmaking/suggestions').then(r => {
      setSuggestions(r.data.suggestions);
      setLoading(false);
    });
  }, []);

  const eloBadgeColor = (diff: number) => {
    if (diff <= 50) return 'bg-green-100 text-green-700';
    if (diff <= 150) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) return <div className="p-4 text-center text-green-600">Finding your best matches...</div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-1">🎯 Find a Match</h1>
      <p className="text-sm text-gray-500 mb-4">Players ranked by skill compatibility, availability overlap, and variety</p>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">🎾</p>
          <p>No suggestions yet. Add your availability to get better matches!</p>
          <Link to="/availability" className="text-green-600 underline text-sm mt-2 inline-block">Set Availability →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={s.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                  <div>
                    <Link to={`/players/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600">
                      {s.name}
                    </Link>
                    <div className="flex gap-1.5 mt-0.5">
                      {s.ntrp && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {s.ntrp}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${eloBadgeColor(s.elo_diff)}`}>
                        ELO {s.elo} ({s.elo_diff > 0 ? '±' : ''}{s.elo_diff})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Match Score</div>
                  <div className="text-lg font-bold text-green-600">{s.match_score}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.reasons.map((r, j) => (
                  <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                ))}
                {s.reliability >= 90 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">✓ Reliable</span>}
              </div>

              <div className="flex gap-2">
                <Link to={`/invite/${s.id}`} className="flex-1 text-center bg-green-600 text-white text-sm rounded-lg py-2 font-semibold hover:bg-green-700">
                  Challenge
                </Link>
                <Link to={`/players/${s.id}`} className="flex-1 text-center bg-gray-100 text-gray-700 text-sm rounded-lg py-2 font-semibold hover:bg-gray-200">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
