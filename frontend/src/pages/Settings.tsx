import { useSettings, useUpdateSettings } from '../hooks/useSettings';

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  if (isLoading || !settings) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  const toggle = (key: 'notify_sms' | 'notify_email') => {
    const updated = { ...settings, [key]: !settings[key] };
    updateMutation.mutate(updated);
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-green-700">Notification Settings</h1>
      <div className="bg-white rounded-xl shadow divide-y">
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div className="font-medium">📧 Email Notifications</div>
            <div className="text-sm text-gray-500">Match invites, score updates, etc.</div>
          </div>
          <div
            onClick={() => toggle('notify_email')}
            className={`w-12 h-7 rounded-full relative transition-colors ${settings.notify_email ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.notify_email ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div className="font-medium">📱 SMS Notifications</div>
            <div className="text-sm text-gray-500">Text messages to your phone number</div>
          </div>
          <div
            onClick={() => toggle('notify_sms')}
            className={`w-12 h-7 rounded-full relative transition-colors ${settings.notify_sms ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.notify_sms ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
      {updateMutation.isPending && <div className="text-center text-sm text-gray-400">Saving...</div>}
    </div>
  );
}
