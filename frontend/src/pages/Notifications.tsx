import { useEffect, useState } from 'react';
import api from '../api/client';
import { Notification } from '../types';

export default function Notifications() {
  const [notes, setNotes] = useState<Notification[]>([]);
  useEffect(() => { api.get('/notifications').then(r => setNotes(r.data.notifications)); }, []);

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">🔔 Notifications</h1>
      {notes.length === 0 ? <p className="text-gray-400 text-center mt-8">No notifications</p> : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className={`bg-white rounded-xl shadow p-3 ${!n.read ? 'border-l-4 border-green-500' : ''}`}>
              <p className="text-sm text-gray-700">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
