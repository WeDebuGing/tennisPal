import { useNotifications } from '../hooks/useNotifications';
import { Spinner, ErrorBox, EmptyState } from '../components/ui';

export default function Notifications() {
  const { data: notes, isLoading, error, refetch } = useNotifications();

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">🔔 Notifications</h1>
      {isLoading ? <Spinner text="Loading notifications..." /> :
       error ? <ErrorBox message="Failed to load notifications" onRetry={refetch} /> :
       !notes?.length ? <EmptyState icon="🔔" title="All caught up!" subtitle="No notifications right now" /> : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className={`bg-white rounded-xl shadow-sm p-4 transition-colors ${!n.read ? 'border-l-4 border-green-500' : ''}`}>
              <p className="text-sm text-gray-700">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
