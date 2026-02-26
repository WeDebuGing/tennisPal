import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

/* ── helpers ── */
const adminApi = () => {
  const token = localStorage.getItem('admin_token');
  return { headers: { 'X-Admin-Token': token } };
};

/* ── types ── */
interface Stats {
  total_users: number;
  banned_users: number;
  total_matches: number;
  completed_matches: number;
  scheduled_matches: number;
  disputed_matches: number;
  active_posts: number;
  pending_invites: number;
  total_notifications: number;
  unread_notifications: number;
  new_users_week: number;
  new_users_month: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  ntrp: number | null;
  elo: number;
  is_admin: boolean;
  is_banned: boolean;
  matches_played: number;
  wins: number;
  losses: number;
  created_at: string | null;
}

interface AdminMatch {
  id: number;
  player1: { id: number; name: string } | null;
  player2: { id: number; name: string } | null;
  play_date: string;
  status: string;
  score: string | null;
  score_confirmed: boolean;
  score_disputed: boolean;
  winner_name: string | null;
  created_at: string | null;
}

type Tab = 'stats' | 'users' | 'matches' | 'notifications';

/* ── component ── */
export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchPage, setMatchPage] = useState(1);
  const [matchFilter, setMatchFilter] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifStatus, setNotifStatus] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    if (!localStorage.getItem('admin_token')) { nav('/admin/login'); return false; }
    return true;
  }, [nav]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats', adminApi());
      setStats(data);
    } catch { localStorage.removeItem('admin_token'); nav('/admin/login'); }
  }, [nav]);

  const loadUsers = useCallback(async (page = 1, search = '') => {
    try {
      const { data } = await api.get(`/admin/users?page=${page}&per_page=15&search=${search}`, adminApi());
      setUsers(data.users);
      setUserTotal(data.total);
    } catch {}
  }, []);

  const loadMatches = useCallback(async (page = 1, status = '') => {
    try {
      const { data } = await api.get(`/admin/matches?page=${page}&per_page=15&status=${status}`, adminApi());
      setMatches(data.matches);
      setMatchTotal(data.total);
    } catch {}
  }, []);

  useEffect(() => {
    if (!checkAuth()) return;
    loadStats().finally(() => setLoading(false));
  }, [checkAuth, loadStats]);

  useEffect(() => {
    if (tab === 'users') loadUsers(userPage, userSearch);
  }, [tab, userPage, userSearch, loadUsers]);

  useEffect(() => {
    if (tab === 'matches') loadMatches(matchPage, matchFilter);
  }, [tab, matchPage, matchFilter, loadMatches]);

  const logout = () => { localStorage.removeItem('admin_token'); nav('/admin/login'); };

  const banUser = async (id: number, ban: boolean) => {
    await api.post(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`, {}, adminApi());
    loadUsers(userPage, userSearch);
    loadStats();
  };

  const saveUser = async () => {
    if (!editingUser) return;
    await api.put(`/admin/users/${editingUser.id}`, {
      name: editingUser.name, email: editingUser.email,
      ntrp: editingUser.ntrp, elo: editingUser.elo, is_admin: editingUser.is_admin,
    }, adminApi());
    setEditingUser(null);
    loadUsers(userPage, userSearch);
  };

  const updateMatch = async (id: number, updates: Record<string, unknown>) => {
    await api.put(`/admin/matches/${id}`, updates, adminApi());
    loadMatches(matchPage, matchFilter);
    loadStats();
  };

  const deleteMatch = async (id: number) => {
    if (!confirm('Delete this match permanently?')) return;
    await api.delete(`/admin/matches/${id}`, adminApi());
    loadMatches(matchPage, matchFilter);
    loadStats();
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) return;
    const { data } = await api.post('/admin/notifications', { message: notifMsg }, adminApi());
    setNotifStatus(`Sent to ${data.sent_to} users`);
    setNotifMsg('');
    setTimeout(() => setNotifStatus(''), 3000);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'stats', label: 'Overview', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'matches', label: 'Matches', icon: '🎾' },
    { key: 'notifications', label: 'Notify', icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-green-700">🛡️ Admin Dashboard</h1>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${tab === t.key ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* ── Stats Tab ── */}
        {tab === 'stats' && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Players', value: stats.total_users, color: 'text-green-700' },
                { label: 'Banned', value: stats.banned_users, color: 'text-red-500' },
                { label: 'New (7d)', value: stats.new_users_week, color: 'text-blue-600' },
                { label: 'New (30d)', value: stats.new_users_month, color: 'text-blue-500' },
                { label: 'Total Matches', value: stats.total_matches, color: 'text-indigo-600' },
                { label: 'Completed', value: stats.completed_matches, color: 'text-green-600' },
                { label: 'Scheduled', value: stats.scheduled_matches, color: 'text-yellow-600' },
                { label: 'Disputed', value: stats.disputed_matches, color: 'text-red-500' },
                { label: 'Active Posts', value: stats.active_posts, color: 'text-orange-500' },
                { label: 'Pending Invites', value: stats.pending_invites, color: 'text-purple-500' },
                { label: 'Notifications', value: stats.total_notifications, color: 'text-gray-600' },
                { label: 'Unread Notifs', value: stats.unread_notifications, color: 'text-pink-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <>
            <input type="text" placeholder="Search by name or email..."
              value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              className="w-full border rounded-lg p-3 text-sm" />

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 hidden md:table-cell">Email</th>
                    <th className="px-4 py-3">NTRP</th>
                    <th className="px-4 py-3 hidden md:table-cell">W/L</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className={u.is_banned ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-medium">
                        {u.name} {u.is_admin && <span className="text-xs text-green-600">👑</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email || '—'}</td>
                      <td className="px-4 py-3">{u.ntrp ?? '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{u.wins}/{u.losses}</td>
                      <td className="px-4 py-3">
                        {u.is_banned
                          ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Banned</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => setEditingUser({ ...u })} className="text-blue-600 hover:underline text-xs">Edit</button>
                        <button onClick={() => banUser(u.id, !u.is_banned)}
                          className={`text-xs hover:underline ${u.is_banned ? 'text-green-600' : 'text-red-500'}`}>
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{userTotal} total users</span>
              <div className="space-x-2">
                <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-30">Prev</button>
                <span>Page {userPage}</span>
                <button disabled={userPage * 15 >= userTotal} onClick={() => setUserPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-30">Next</button>
              </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                  <h2 className="text-lg font-bold">Edit User #{editingUser.id}</h2>
                  <input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full border rounded-lg p-2" placeholder="Name" />
                  <input value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value || null })}
                    className="w-full border rounded-lg p-2" placeholder="Email" />
                  <div className="flex gap-3">
                    <input type="number" step="0.5" value={editingUser.ntrp ?? ''} placeholder="NTRP"
                      onChange={e => setEditingUser({ ...editingUser, ntrp: e.target.value ? parseFloat(e.target.value) : null })}
                      className="flex-1 border rounded-lg p-2" />
                    <input type="number" value={editingUser.elo} placeholder="Elo"
                      onChange={e => setEditingUser({ ...editingUser, elo: parseInt(e.target.value) || 1200 })}
                      className="flex-1 border rounded-lg p-2" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingUser.is_admin}
                      onChange={e => setEditingUser({ ...editingUser, is_admin: e.target.checked })} />
                    Admin privileges
                  </label>
                  <div className="flex gap-3">
                    <button onClick={() => setEditingUser(null)} className="flex-1 border rounded-lg p-2">Cancel</button>
                    <button onClick={saveUser} className="flex-1 bg-green-600 text-white rounded-lg p-2 font-semibold">Save</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Matches Tab ── */}
        {tab === 'matches' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {['', 'scheduled', 'completed', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setMatchFilter(s); setMatchPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${matchFilter === s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Players</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matches.map(m => (
                    <tr key={m.id} className={m.score_disputed ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3">
                        {m.player1?.name || '?'} vs {m.player2?.name || '?'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.play_date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          m.status === 'completed' ? 'bg-green-100 text-green-700' :
                          m.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{m.status}</span>
                        {m.score_disputed && <span className="ml-1 text-xs text-red-500">⚠️ Disputed</span>}
                      </td>
                      <td className="px-4 py-3">{m.score || '—'}</td>
                      <td className="px-4 py-3 space-x-2">
                        {m.score_disputed && (
                          <button onClick={() => updateMatch(m.id, { score_disputed: false, score_confirmed: true })}
                            className="text-xs text-green-600 hover:underline">Resolve</button>
                        )}
                        <button onClick={() => deleteMatch(m.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{matchTotal} total matches</span>
              <div className="space-x-2">
                <button disabled={matchPage <= 1} onClick={() => setMatchPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-30">Prev</button>
                <span>Page {matchPage}</span>
                <button disabled={matchPage * 15 >= matchTotal} onClick={() => setMatchPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-30">Next</button>
              </div>
            </div>
          </>
        )}

        {/* ── Notifications Tab ── */}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-lg">📢 Broadcast Notification</h2>
              <p className="text-sm text-gray-500">Send a notification to all active (non-banned) users.</p>
              <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                placeholder="Type your notification message..."
                className="w-full border rounded-lg p-3 text-sm h-24 resize-none" />
              <div className="flex items-center gap-3">
                <button onClick={sendNotification} disabled={!notifMsg.trim()}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                  Send to All Users
                </button>
                {notifStatus && <span className="text-sm text-green-600">{notifStatus}</span>}
              </div>
            </div>
            {stats && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold mb-2">Notification Stats</h3>
                <p className="text-sm text-gray-600">Total: {stats.total_notifications} · Unread: {stats.unread_notifications}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
