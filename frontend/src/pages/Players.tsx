import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePlayers, PlayerSearchParams } from '../hooks/usePlayers';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NTRP_LEVELS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'ntrp', label: 'NTRP Level' },
  { value: 'activity', label: 'Recent Activity' },
] as const;

export default function Players() {
  const [day, setDay] = useState('');
  const [search, setSearch] = useState('');
  const [ntrpMin, setNtrpMin] = useState<number | undefined>();
  const [ntrpMax, setNtrpMax] = useState<number | undefined>();
  const [court, setCourt] = useState('');
  const [sort, setSort] = useState<'name' | 'ntrp' | 'activity'>('name');
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo<PlayerSearchParams>(() => ({
    day: day || undefined,
    search: search || undefined,
    ntrp_min: ntrpMin,
    ntrp_max: ntrpMax,
    court: court || undefined,
    sort,
  }), [day, search, ntrpMin, ntrpMax, court, sort]);

  const { data: players, isLoading, error, refetch } = usePlayers(params);

  const hasActiveFilters = ntrpMin !== undefined || ntrpMax !== undefined || court !== '';

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">👥 Players</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search players by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Sort + Filter toggle row */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={sort}
          onChange={e => setSort(e.target.value as typeof sort)}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>Sort: {o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          ⚙️ Filters{hasActiveFilters ? ' ●' : ''}
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => { setNtrpMin(undefined); setNtrpMax(undefined); setCourt(''); }}
            className="text-xs text-red-500 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Collapsible filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 w-20 shrink-0">NTRP Range</label>
            <select
              value={ntrpMin ?? ''}
              onChange={e => setNtrpMin(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Min</option>
              {NTRP_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-gray-400 text-xs">–</span>
            <select
              value={ntrpMax ?? ''}
              onChange={e => setNtrpMax(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Max</option>
              {NTRP_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 w-20 shrink-0">Court</label>
            <input
              type="text"
              placeholder="Filter by preferred court..."
              value={court}
              onChange={e => setCourt(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
            />
          </div>
        </div>
      )}

      {/* Day filter pills */}
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1 -mx-4 px-4 scrollbar-hide">
        <button onClick={() => setDay('')} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors ${day === '' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>All</button>
        {DAYS.map((d, i) => (
          <button key={i} onClick={() => setDay(String(i))} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors ${day === String(i) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>{d.slice(0, 3)}</button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? <Spinner text="Finding players..." /> :
       error ? <ErrorBox message="Failed to load players" onRetry={refetch} /> :
       !players?.length ? <EmptyState icon="👥" title="No players found" subtitle={search || hasActiveFilters ? 'Try adjusting your filters' : day !== '' ? 'Try a different day' : 'Invite friends to join!'} /> : (
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white rounded-xl shadow-sm p-3 hover:bg-green-50 transition-colors">
              <Link to={`/players/${p.id}`} className="min-w-0 flex-1">
                <span className="font-semibold text-gray-800">{p.name}</span>
                {p.ntrp && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {p.ntrp}</span>}
                {p.preferred_courts && (
                  <span className="block text-xs text-gray-400 mt-0.5 truncate">📍 {p.preferred_courts}</span>
                )}
              </Link>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-400">ELO {p.elo}</span>
                <Link
                  to={`/invite/${p.id}`}
                  className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  Invite
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
