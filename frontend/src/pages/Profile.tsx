import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-2xl font-bold text-green-700">{user.name}</h1>
        <div className="text-sm text-gray-500 mt-1">{user.email} {user.phone && `· ${user.phone}`}</div>
        <div className="flex gap-4 mt-2 text-sm">
          {user.ntrp && <span>NTRP {user.ntrp}</span>}
          <span>ELO {user.elo}</span>
        </div>
      </div>
      <Link to={`/players/${user.id}`} className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">View Full Profile</Link>
      <Link to="/availability" className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">📅 Manage Availability</Link>
      <Link to="/settings" className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">🔔 Notification Settings</Link>
      <Link to="/leaderboard" className="block bg-white rounded-xl shadow p-4 text-center text-green-700 font-semibold hover:bg-green-50">🏆 Leaderboard</Link>
      <button onClick={logout} className="w-full bg-red-100 text-red-600 rounded-xl p-4 font-semibold">Log Out</button>
    </div>
  );
}
