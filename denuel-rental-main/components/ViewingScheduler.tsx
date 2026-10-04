'use client';

import React, { useMemo, useState } from 'react';

type RawViewingSlot = {
  id: string;
  dayOfWeek?: number | null;
  date?: string | Date | null;
  startTime: string;
  endTime: string;
  slotDuration?: number | null;
  isRecurring?: boolean;
  isActive?: boolean;
};

interface ViewingSchedulerProps {
  propertyId: string;
  propertyTitle: string;
  slots: RawViewingSlot[];
  className?: string;
}

type BookableSlot = {
  key: string;
  label: string;
  scheduledAt: string;
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function fromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function ViewingScheduler({
  propertyId,
  propertyTitle,
  slots,
  className = '',
}: ViewingSchedulerProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const bookableSlots = useMemo<BookableSlot[]>(() => {
    const now = new Date();
    const next14Days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const options: BookableSlot[] = [];

    for (const slot of slots || []) {
      if (slot.isActive === false) continue;

      const dates: Date[] = [];
      if (slot.date) {
        const specific = new Date(slot.date);
        if (!Number.isNaN(specific.getTime())) {
          specific.setHours(0, 0, 0, 0);
          if (specific >= next14Days[0]) dates.push(specific);
        }
      } else if (slot.isRecurring && typeof slot.dayOfWeek === 'number') {
        dates.push(...next14Days.filter((date) => date.getDay() === slot.dayOfWeek));
      }

      const start = toMinutes(slot.startTime);
      const end = toMinutes(slot.endTime);
      const duration = Math.max(15, Number(slot.slotDuration || 30));

      for (const date of dates) {
        for (let minute = start; minute + duration <= end; minute += duration) {
          const time = fromMinutes(minute);
          const scheduled = new Date(`${dateKey(date)}T${time}:00`);
          if (scheduled <= now) continue;

          options.push({
            key: `${slot.id}-${scheduled.toISOString()}`,
            scheduledAt: scheduled.toISOString(),
            label: scheduled.toLocaleString('en-ZM', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        }
      }
    }

    return options
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 40);
  }, [slots]);

  async function bookViewing() {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/viewings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          scheduledAt: selectedSlot,
          notes: notes.trim() || undefined,
        }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || text || 'Unable to book this viewing.');
      }

      setBooked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to book this viewing.');
    } finally {
      setSubmitting(false);
    }
  }

  if (booked) {
    return (
      <div className={`border border-emerald-200 bg-emerald-50 p-5 ${className}`}>
        <div className="font-semibold text-emerald-900">Viewing request sent</div>
        <p className="mt-1 text-sm leading-6 text-emerald-800">
          The property owner will be able to review your request.
        </p>
      </div>
    );
  }

  if (!bookableSlots.length) {
    return (
      <div className={`border border-slate-200 bg-slate-50 p-4 ${className}`}>
        <div className="text-sm font-semibold text-slate-900">No viewing times are currently available</div>
        <p className="mt-1 text-sm text-slate-500">Use the enquiry form to ask the owner for another time.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Choose a viewing time</label>
        <select
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
        >
          <option value="">Select date and time</option>
          {bookableSlots.map((slot) => (
            <option key={slot.key} value={slot.scheduledAt}>{slot.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={`Anything the owner should know before the viewing of ${propertyTitle}?`}
          className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-slate-950"
        />
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}

      <button
        type="button"
        onClick={bookViewing}
        disabled={submitting || !selectedSlot}
        className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? 'Sending request…' : 'Request viewing'}
      </button>
    </div>
  );
}
