import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useCourts, CourtData } from '../hooks/useCourts';

type SubTab = 'opponents' | 'courts';

function OpponentsSection() {
  const { data: suggestions, isLoading } = useMatchmaking();

  const eloBadgeColor = (diff: number) => {
    if (diff <= 50) return 'bg-green-100 text-green-700';
    if (diff <= 150) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (isLoading) return <div className="p-4 text-center text-green-600">Finding your best matches...</div>;

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">Players ranked by skill compatibility, availability overlap, and variety</p>
      {!suggestions?.length ? (
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
                    <Link to={`/players/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600">{s.name}</Link>
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
                <Link to={`/invite/${s.id}`} className="flex-1 text-center bg-green-600 text-white text-sm rounded-lg py-2 font-semibold hover:bg-green-700">Challenge</Link>
                <Link to={`/players/${s.id}`} className="flex-1 text-center bg-gray-100 text-gray-700 text-sm rounded-lg py-2 font-semibold hover:bg-gray-200">View Profile</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/leaderboard" className="block mt-4 text-center text-green-600 font-semibold hover:underline">🏆 View Leaderboard</Link>
    </>
  );
}

function CourtsSection() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locDenied, setLocDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLighted, setFilterLighted] = useState(false);
  const [filterPublic, setFilterPublic] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocDenied(true),
      { timeout: 5000 }
    );
  }, []);

  const { data: courts, isLoading } = useCourts(loc?.lat, loc?.lng);

  const filtered = (courts ?? []).filter((c: CourtData) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.address?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLighted && !c.lighted) return false;
    if (filterPublic && !c.public) return false;
    return true;
  });

  return (
    <>
      {!loc && !locDenied && <p className="text-sm text-gray-400 mb-3">Getting your location…</p>}
      {locDenied && <p className="text-sm text-amber-600 mb-3">Location unavailable — showing all courts alphabetically</p>}
      <input className="w-full border rounded-lg p-3 mb-3" placeholder="Search courts…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterLighted(!filterLighted)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterLighted ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-200 text-gray-500'}`}>💡 Lighted</button>
        <button onClick={() => setFilterPublic(!filterPublic)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterPublic ? 'bg-green-100 border-green-400 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>🏛 Public</button>
      </div>
      {isLoading ? <p className="text-center text-gray-400 py-8">Loading courts…</p> :
       filtered.length === 0 ? <p className="text-center text-gray-400 py-8">No courts found</p> : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{c.address}</p>
                </div>
                {c.distance_km !== undefined && (
                  <span className="ml-2 flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {c.distance_km < 1 ? `${Math.round(c.distance_km * 1000)}m` : `${c.distance_km.toFixed(1)} km`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🎾 {c.num_courts} court{c.num_courts !== 1 ? 's' : ''}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.surface}</span>
                {c.lighted && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">💡 Lighted</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.public ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.public ? '🏛 Public' : '🔒 Private'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Matchmaking() {
  const [tab, setTab] = useState<SubTab>('opponents');

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-3">🎯 Matchmaking</h1>

      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab('opponents')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${tab === 'opponents' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
        >
          Find Opponents
        </button>
        <button
          onClick={() => setTab('courts')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${tab === 'courts' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
        >
          Nearby Courts
        </button>
      </div>

      {tab === 'opponents' ? <OpponentsSection /> : <CourtsSection />}
    </div>
  );
}
