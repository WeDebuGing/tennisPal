import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { token } = useAuth();
  const [notifySms, setNotifySms] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setNotifySms(d.settings.notify_sms);
        setNotifyEmail(d.settings.notify_email);
        setLoaded(true);
      });
  }, [token]);

  const save = async (sms: boolean, email: boolean) => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notify_sms: sms, notify_email: email }),
    });
    setSaving(false);
  };

  const toggleSms = () => {
    const v = !notifySms;
    setNotifySms(v);
    save(v, notifyEmail);
  };

  const toggleEmail = () => {
    const v = !notifyEmail;
    setNotifyEmail(v);
    save(notifySms, v);
  };

  if (!loaded) return <div className="p-4 text-center text-gray-400">Loading...</div>;

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
            onClick={toggleEmail}
            className={`w-12 h-7 rounded-full relative transition-colors ${notifyEmail ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notifyEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div className="font-medium">📱 SMS Notifications</div>
            <div className="text-sm text-gray-500">Text messages to your phone number</div>
          </div>
          <div
            onClick={toggleSms}
            className={`w-12 h-7 rounded-full relative transition-colors ${notifySms ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notifySms ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
      {saving && <div className="text-center text-sm text-gray-400">Saving...</div>}
    </div>
  );
}
