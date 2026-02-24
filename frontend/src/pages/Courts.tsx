import { useState, useEffect } from 'react';
import { useCourts, CourtData } from '../hooks/useCourts';

export default function Courts() {
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
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">📍 Tennis Courts</h1>

      {!loc && !locDenied && (
        <p className="text-sm text-gray-400 mb-3">Getting your location…</p>
      )}
      {locDenied && (
        <p className="text-sm text-amber-600 mb-3">Location unavailable — showing all courts alphabetically</p>
      )}

      <input
        className="w-full border rounded-lg p-3 mb-3"
        placeholder="Search courts…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterLighted(!filterLighted)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterLighted ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-200 text-gray-500'}`}
        >
          💡 Lighted
        </button>
        <button
          onClick={() => setFilterPublic(!filterPublic)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterPublic ? 'bg-green-100 border-green-400 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}
        >
          🏛 Public
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Loading courts…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No courts found</p>
      ) : (
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
    </div>
  );
}
