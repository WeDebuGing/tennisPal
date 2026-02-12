import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { User } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Players() {
  const [players, setPlayers] = useState<User[]>([]);
  const [day, setDay] = useState('');

  useEffect(() => { api.get('/players', { params: day !== '' ? { day } : {} }).then(r => setPlayers(r.data.players)); }, [day]);

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">👥 Players</h1>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        <button onClick={() => setDay('')} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${day === '' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
        {DAYS.map((d, i) => (
          <button key={i} onClick={() => setDay(String(i))} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${day === String(i) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{d.slice(0, 3)}</button>
        ))}
      </div>
      <div className="space-y-2">
        {players.map(p => (
          <Link key={p.id} to={`/players/${p.id}`} className="flex items-center justify-between bg-white rounded-xl shadow p-3 hover:bg-green-50">
            <div>
              <span className="font-semibold text-gray-800">{p.name}</span>
              {p.ntrp && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NTRP {p.ntrp}</span>}
            </div>
            <span className="text-xs text-gray-400">ELO {p.elo}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
