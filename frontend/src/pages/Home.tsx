import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Post } from '../types';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { user } = useAuth();

  useEffect(() => { api.get('/posts').then(r => setPosts(r.data.posts)); }, []);

  const claim = async (id: number) => {
    await api.post(`/posts/${id}/claim`);
    setPosts(posts.filter(p => p.id !== id));
  };

  const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${ap}`; };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-700">🎾 Looking to Play</h1>
        <Link to="/notifications" className="text-2xl">🔔</Link>
      </div>
      {posts.length === 0 && <p className="text-gray-500 text-center mt-8">No posts yet. Be the first!</p>}
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <Link to={`/players/${p.user_id}`} className="font-semibold text-green-700 hover:underline">{p.author_name}</Link>
                {p.author_ntrp && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {p.author_ntrp}</span>}
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.match_type}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">📅 {fmt(p.play_date)} · ⏰ {fmtTime(p.start_time)}–{fmtTime(p.end_time)}</p>
            <p className="text-sm text-gray-500">📍 {p.court}</p>
            {(p.level_min || p.level_max) && <p className="text-xs text-gray-400">Level: {p.level_min}–{p.level_max}</p>}
            {user && user.id !== p.user_id && (
              <button onClick={() => claim(p.id)} className="mt-2 bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700">I'm In! 🎾</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
