"use client";
import React, { useEffect, useState } from 'react';

export default function AvailabilityManager({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetch() {
    setLoading(true);
    const res = await (fetch as any)(`/api/properties/${propertyId}/availability`);
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  }

  useEffect(() => { fetch(); }, [propertyId]);

  async function add() {
    const res = await (fetch as any)(`/api/properties/${propertyId}/availability`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDate, note }) });
    const json = await res.json();
    if (json?.availability) {
      setStartDate(''); setEndDate(''); setNote('');
      fetch();
    } else alert(json?.error || 'Error');
  }

  async function remove(id: string) {
    if (!confirm('Delete this availability?')) return;
    const res = await (fetch as any)(`/api/properties/${id}/availability`, { method: 'DELETE' });
    const json = await res.json();
    if (json?.ok) fetch();
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Availability</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="w-full p-2 border rounded mb-2" />
      <div className="flex items-center justify-between mb-3">
        <button onClick={add} className="bg-brand-500 text-white px-3 py-1 rounded">Add range</button>
        {loading && <div className="text-sm text-muted">Loading...</div>}
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between border p-2 rounded">
            <div>
              <div className="font-semibold">{new Date(it.startDate).toLocaleDateString()} — {new Date(it.endDate).toLocaleDateString()}</div>
              <div className="text-sm text-muted">{it.note}</div>
            </div>
            <button onClick={() => remove(it.id)} className="text-sm text-red-600">Delete</button>
          </div>
        ))}
        {items.length === 0 && !loading && <div className="text-muted">No availability ranges</div>}
      </div>
    </div>
  );
}