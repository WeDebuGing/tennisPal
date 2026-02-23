import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Stats {
  total_users: number;
  total_matches: number;
  active_posts: number;
  pending_invites: number;
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { nav('/admin/login'); return; }
    api.get('/admin/stats', { headers: { 'X-Admin-Token': token } })
      .then(r => setStats(r.data))
      .catch(() => { localStorage.removeItem('admin_token'); nav('/admin/login'); })
      .finally(() => setLoading(false));
  }, [nav]);

  const logout = () => { localStorage.removeItem('admin_token'); nav('/admin/login'); };

  if (loading) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">🛡️ Admin Dashboard</h1>
        <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.total_users}</div>
            <div className="text-sm text-gray-500">Players</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_matches}</div>
            <div className="text-sm text-gray-500">Matches</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.active_posts}</div>
            <div className="text-sm text-gray-500">Active Posts</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.pending_invites}</div>
            <div className="text-sm text-gray-500">Pending Invites</div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400">No stats available. Admin API endpoints need to be implemented.</p>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
        <strong>Note:</strong> This is a placeholder dashboard. Full admin features (user management, match moderation, notification management) are coming in a future update.
      </div>
    </div>
  );
}
