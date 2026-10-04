"use client";

import React, { useEffect, useState } from 'react';
import { csrfFetch } from '../lib/csrf';

export default function AvailabilityManager({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadAvailability() {
    setLoading(true);
    setError('');

    try {
      const res = await window.fetch(`/api/properties/${propertyId}/availability`, {
        credentials: 'same-origin',
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load availability.');
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load availability.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, [propertyId]);

  async function add() {
    if (!startDate || !endDate) {
      setError('Choose both a start date and an end date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await csrfFetch(`/api/properties/${propertyId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, note: note.trim() || undefined }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        window.location.href = `/auth/login?redirect=/dashboard/properties/${propertyId}/edit&reason=session`;
        return;
      }

      if (!res.ok || !data?.availability) {
        throw new Error(data?.error || text || 'Unable to add availability.');
      }

      setStartDate('');
      setEndDate('');
      setNote('');
      await loadAvailability();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add availability.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this availability range?')) return;

    setSaving(true);
    setError('');

    try {
      const res = await csrfFetch(`/api/properties/${id}/availability`, {
        method: 'DELETE',
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        window.location.href = `/auth/login?redirect=/dashboard/properties/${propertyId}/edit&reason=session`;
        return;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || text || 'Unable to delete availability.');
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete availability.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <div>
        <h3 className="font-semibold text-slate-950">Availability</h3>
        <p className="mt-1 text-sm text-slate-500">Add dates when this property can be occupied or booked.</p>
      </div>

      {error && <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          End date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
        </label>
      </div>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="mt-2 h-11 w-full border border-slate-300 px-3" />
      </label>

      <button
        type="button"
        onClick={add}
        disabled={saving || !startDate || !endDate}
        className="mt-4 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add availability'}
      </button>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading availability…</div>
        ) : items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {new Date(item.startDate).toLocaleDateString('en-ZM')} — {new Date(item.endDate).toLocaleDateString('en-ZM')}
                  </div>
                  {item.note && <div className="mt-1 text-sm text-slate-500">{item.note}</div>}
                </div>
                <button type="button" onClick={() => remove(item.id)} disabled={saving} className="text-sm font-medium text-red-700 disabled:opacity-50">
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No availability ranges added yet.</div>
        )}
      </div>
    </section>
  );
}
