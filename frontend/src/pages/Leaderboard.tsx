import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  useEffect(() => { api.get('/leaderboard').then(r => setBoard(r.data.leaderboard)); }, []);

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">🏆 Leaderboard</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-600 text-white">
            <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Player</th><th className="p-2">W</th><th className="p-2">L</th><th className="p-2">ELO</th></tr>
          </thead>
          <tbody>
            {board.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                <td className="p-2 font-bold text-gray-400">{i + 1}</td>
                <td className="p-2"><Link to={`/players/${p.id}`} className="text-green-700 hover:underline font-semibold">{p.name}</Link>
                  {p.ntrp && <span className="ml-1 text-xs text-gray-400">{p.ntrp}</span>}</td>
                <td className="p-2 text-center text-green-600 font-semibold">{p.wins}</td>
                <td className="p-2 text-center text-red-500">{p.losses}</td>
                <td className="p-2 text-center">{p.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
