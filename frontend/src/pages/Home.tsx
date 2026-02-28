import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { usePosts, useClaimPost, useDeletePost, useUpdatePost, UpdatePostData, PostFilters } from '../hooks/usePosts';
import { useUpcomingMatches } from '../hooks/useMatches';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';
import { Post } from '../types';

function PostMenu({ post, onEdit, onDelete }: { post: Post; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Post options">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[120px]">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">✏️ Edit</button>
          <button onClick={() => { setOpen(false); onDelete(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

function EditPostModal({ post, onClose, onSave, isPending }: { post: Post; onClose: () => void; onSave: (data: UpdatePostData) => void; isPending: boolean }) {
  const [form, setForm] = useState<UpdatePostData>({
    play_date: post.play_date,
    start_time: post.start_time,
    end_time: post.end_time,
    court: post.court,
    match_type: post.match_type,
    level_min: post.level_min,
    level_max: post.level_max,
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800">Edit Post</h2>
        <div>
          <label className="text-sm font-medium text-gray-600">Date</label>
          <input type="date" value={form.play_date} onChange={e => setForm({ ...form, play_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Start</label>
            <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">End</label>
            <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Court / Location</label>
          <input type="text" value={form.court ?? ''} onChange={e => setForm({ ...form, court: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Flexible" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Match Type</label>
          <select value={form.match_type} onChange={e => setForm({ ...form, match_type: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm">
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Min Level</label>
            <input type="number" step="0.5" min="1" max="7" value={form.level_min ?? ''} onChange={e => setForm({ ...form, level_min: e.target.value ? parseFloat(e.target.value) : null })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Any" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Max Level</label>
            <input type="number" step="0.5" min="1" max="7" value={form.level_max ?? ''} onChange={e => setForm({ ...form, level_max: e.target.value ? parseFloat(e.target.value) : null })} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Any" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} disabled={isPending} className="flex-1 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-3xl mb-3">🗑️</p>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Delete Post?</h2>
        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedFilters({ filters, onChange, isLoggedIn }: { filters: PostFilters; onChange: (f: PostFilters) => void; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const hasFilters = !!(filters.level_min || filters.level_max || filters.court || filters.date_from || filters.date_to);

  const update = (patch: Partial<PostFilters>) => onChange({ ...filters, ...patch });
  const clearFilters = () => onChange({ sort: filters.sort, for_you: filters.for_you });

  return (
    <div className="mb-4">
      {/* Sort & Filter toggle row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort pills */}
        {(['newest', 'closest_date', 'skill_match'] as const).map(s => (
          <button
            key={s}
            onClick={() => update({ sort: s, for_you: false })}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filters.sort === s && !filters.for_you
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'newest' ? '🆕 Newest' : s === 'closest_date' ? '📅 Soonest' : '🎯 Skill Match'}
          </button>
        ))}
        {isLoggedIn && (
          <button
            onClick={() => update({ for_you: !filters.for_you })}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filters.for_you ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ✨ For You
          </button>
        )}
        <button
          onClick={() => setOpen(!open)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ml-auto ${
            hasFilters ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔍 Filter{hasFilters ? ' ●' : ''}
        </button>
      </div>

      {/* Collapsible filter panel */}
      {open && (
        <div className="mt-3 bg-white rounded-xl shadow-sm border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Min NTRP</label>
              <input
                type="number" step="0.5" min="1" max="7" placeholder="Any"
                value={filters.level_min ?? ''}
                onChange={e => update({ level_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full border rounded-lg px-3 py-1.5 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Max NTRP</label>
              <input
                type="number" step="0.5" min="1" max="7" placeholder="Any"
                value={filters.level_max ?? ''}
                onChange={e => update({ level_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full border rounded-lg px-3 py-1.5 mt-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Court / Location</label>
            <input
              type="text" placeholder="e.g. Schenley"
              value={filters.court ?? ''}
              onChange={e => update({ court: e.target.value || undefined })}
              className="w-full border rounded-lg px-3 py-1.5 mt-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">From Date</label>
              <input
                type="date"
                value={filters.date_from ?? ''}
                onChange={e => update({ date_from: e.target.value || undefined })}
                className="w-full border rounded-lg px-3 py-1.5 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">To Date</label>
              <input
                type="date"
                value={filters.date_to ?? ''}
                onChange={e => update({ date_to: e.target.value || undefined })}
                className="w-full border rounded-lg px-3 py-1.5 mt-1 text-sm"
              />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
              ✕ Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PostFilters>({ sort: 'newest' });
  const { data: posts, isLoading, error, refetch } = usePosts(filters);
  const { data: upcoming } = useUpcomingMatches();
  const claimMutation = useClaimPost();
  const deleteMutation = useDeletePost();
  const updateMutation = useUpdatePost();
  const { toast } = useToast();

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const handleClaim = (id: number) => {
    claimMutation.mutate(id, {
      onSuccess: () => toast('You\'re in! Match created 🎾'),
      onError: () => toast('Failed to claim post', 'error'),
    });
  };

  const handleDelete = () => {
    if (deletingPostId === null) return;
    deleteMutation.mutate(deletingPostId, {
      onSuccess: () => { toast('Post deleted'); setDeletingPostId(null); },
      onError: () => toast('Failed to delete post', 'error'),
    });
  };

  const handleUpdate = (data: UpdatePostData) => {
    if (!editingPost) return;
    updateMutation.mutate({ id: editingPost.id, data }, {
      onSuccess: () => { toast('Post updated'); setEditingPost(null); },
      onError: () => toast('Failed to update post', 'error'),
    });
  };

  const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${ap}`; };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      {/* Upcoming Matches */}
      {user && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-indigo-700 mb-3">📅 Upcoming Matches</h2>
          {upcoming && upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map(m => (
                <Link key={m.id} to={`/matches/${m.id}`} className="block bg-white rounded-xl shadow-sm p-3 border-l-4 border-indigo-500 active:bg-indigo-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <span className="font-semibold text-indigo-700">{m.opponent?.name ?? 'TBD'}</span>
                      {m.opponent?.ntrp && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">NTRP {m.opponent.ntrp}</span>}
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full shrink-0 capitalize">{m.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">📅 {fmt(m.play_date)} · {m.match_type}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-sm text-indigo-600">No upcoming matches — <Link to="/post" className="font-semibold underline">post when you're free!</Link></p>
            </div>
          )}
        </div>
      )}

      {/* Looking to Play */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">🎾 Looking to Play</h1>
        <Link to="/post" className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 shadow-md transition-colors">+ Post</Link>
      </div>
      <FeedFilters filters={filters} onChange={setFilters} isLoggedIn={!!user} />
      {isLoading ? <Spinner text="Loading posts..." /> :
       error ? <ErrorBox message="Failed to load posts" onRetry={refetch} /> :
       !posts?.length ? <EmptyState icon="📝" title="No posts yet" subtitle="Be the first to post — tap + below!" /> : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 active:bg-green-50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <Link to={`/players/${p.user_id}`} className="font-semibold text-green-700 hover:underline truncate">{p.author_name}</Link>
                  {p.author_ntrp && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {p.author_ntrp}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.match_type}</span>
                  {user && user.id === p.user_id && (
                    <PostMenu post={p} onEdit={() => setEditingPost(p)} onDelete={() => setDeletingPostId(p.id)} />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">📅 {fmt(p.play_date)} · ⏰ {fmtTime(p.start_time)}–{fmtTime(p.end_time)}</p>
              {p.court && <p className="text-sm text-gray-500">📍 {p.court}</p>}
              {(p.level_min || p.level_max) && <p className="text-xs text-gray-400 mt-1">Level: {p.level_min}–{p.level_max}</p>}
              {user && user.id !== p.user_id && (
                <button
                  onClick={() => handleClaim(p.id)}
                  disabled={claimMutation.isPending}
                  className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  {claimMutation.isPending ? 'Joining...' : "I'm In! 🎾"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleUpdate} isPending={updateMutation.isPending} />}
      {deletingPostId !== null && <ConfirmDeleteModal onClose={() => setDeletingPostId(null)} onConfirm={handleDelete} isPending={deleteMutation.isPending} />}
    </div>
  );
}
