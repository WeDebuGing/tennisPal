import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeagues, useCreateLeague } from '../hooks/useLeagues';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';
import { League } from '../types';

function CreateLeagueModal({ onClose, onCreate, isPending }: { onClose: () => void; onCreate: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ name: '', description: '', season: '', start_date: '', end_date: '', max_members: '', require_approval: false });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-violet-700">🏆 Create League</h2>
        <div>
          <label className="text-sm font-medium text-gray-600">League Name *</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Pittsburgh Singles League" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" rows={2} placeholder="Open to all levels..." />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Season</label>
          <input type="text" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Spring 2026" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">End Date</label>
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Max Members</label>
            <input type="number" value={form.max_members} onChange={e => setForm({ ...form, max_members: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Unlimited" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.require_approval} onChange={e => setForm({ ...form, require_approval: e.target.checked })} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              Require approval
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onCreate({ ...form, max_members: form.max_members ? parseInt(form.max_members) : undefined })} disabled={!form.name.trim() || isPending} className="flex-1 bg-violet-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Creating...' : 'Create League'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leagues() {
  const { user } = useAuth();
  const { data: leagues, isLoading, error, refetch } = useLeagues();
  const createMutation = useCreateLeague();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = leagues?.filter((l: League) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.season?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => { toast('League created! 🏆'); setShowCreate(false); },
      onError: (err: any) => toast(err?.response?.data?.error || 'Failed to create league', 'error'),
    });
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-violet-700">🏆 Leagues</h1>
        {user && (
          <button onClick={() => setShowCreate(true)} className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-violet-700 shadow-md transition-colors">
            + Create
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search leagues..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none"
      />

      {isLoading ? <Spinner text="Loading leagues..." /> :
       error ? <ErrorBox message="Failed to load leagues" onRetry={refetch} /> :
       !filtered?.length ? <EmptyState icon="🏆" title="No leagues yet" subtitle="Create one to get started!" /> : (
        <div className="space-y-3">
          {filtered.map((league: League) => (
            <Link key={league.id} to={`/leagues/${league.slug}`} className="block bg-white rounded-xl shadow-sm p-4 border-l-4 border-violet-500 active:bg-violet-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-semibold text-violet-700 truncate">{league.name}</h3>
                  {league.season && <span className="text-xs text-gray-500">{league.season}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">{league.member_count} members</span>
                  {league.user_role && (
                    <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full capitalize">{league.user_role}</span>
                  )}
                </div>
              </div>
              {league.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{league.description}</p>}
              {league.start_date && league.end_date && (
                <p className="text-xs text-gray-400 mt-1">📅 {league.start_date} — {league.end_date}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateLeagueModal onClose={() => setShowCreate(false)} onCreate={handleCreate} isPending={createMutation.isPending} />}
    </div>
  );
}
