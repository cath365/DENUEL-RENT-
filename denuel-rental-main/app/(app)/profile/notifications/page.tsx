"use client";
import React, { useEffect, useState } from 'react';

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/user/notifications');
      const json = await res.json();
      if (json.user) {
        setNotifyEmail(json.user.notifyEmail);
        setNotifyWhatsApp(json.user.notifyWhatsApp);
        setPhone(json.user.phone || '');
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    const res = await fetch('/api/user/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifyEmail, notifyWhatsApp, phone }) });
    const json = await res.json();
    if (json.user) setMessage('Saved');
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Notification settings</h2>
      <div className="bg-white dark:bg-gray-800 rounded p-4 shadow max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Email alerts</div>
            <div className="text-sm text-muted">Receive email digests for saved searches</div>
          </div>
          <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">WhatsApp alerts</div>
            <div className="text-sm text-muted">SMS / WhatsApp alerts for new matches (mobile required)</div>
          </div>
          <input type="checkbox" checked={notifyWhatsApp} onChange={(e) => setNotifyWhatsApp(e.target.checked)} />
        </div>

        <div className="mb-4">
          <label className="block text-sm">Phone (for WhatsApp)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={save} className="bg-brand-500 text-white px-4 py-2 rounded">Save</button>
          <div>{message}</div>
        </div>
      </div>
    </main>
  );
}