import { useNotifications, useMarkRead } from '../hooks/useNotifications';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Notifications() {
  const { data: notes, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkRead();

  const unreadCount = notes?.filter(n => !n.read).length ?? 0;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-700">🔔 Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markRead.mutate(undefined)}
            disabled={markRead.isPending}
            className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>
      {isLoading ? <Spinner text="Loading notifications..." /> :
       error ? <ErrorBox message="Failed to load notifications" onRetry={refetch} /> :
       !notes?.length ? <EmptyState icon="🔔" title="All caught up!" subtitle="No notifications right now" /> : (
        <div className="space-y-2">
          {notes.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl shadow-sm p-4 transition-colors ${!n.read ? 'border-l-4 border-green-500' : ''}`}
              onClick={() => { if (!n.read) markRead.mutate([n.id]); }}
            >
              <p className="text-sm text-gray-700">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              {!n.read && <span className="inline-block mt-1 text-[10px] text-green-600 font-medium">NEW</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
