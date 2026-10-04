'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type VerificationDoc = {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  user: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    role: string;
    trustScore: number;
  };
};

export default function AdminVerificationPage() {
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VerificationDoc | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function fetchDocs() {
    setLoading(true);
    try {
      const response = await csrfFetch('/api/admin/verifications');
      const data = await response.json();
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  async function review(status: 'APPROVED' | 'REJECTED') {
    if (!selected) return;
    setProcessing(true);
    setError('');

    const response = await csrfFetch('/api/admin/verifications', {
      method: 'PATCH',
      body: JSON.stringify({
        documentId: selected.id,
        status,
        reviewNotes: notes,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || 'Unable to save this review.');
      setProcessing(false);
      return;
    }

    setDocs((current) => current.map((doc) => doc.id === selected.id ? { ...doc, status, reviewNotes: notes } : doc));
    setSelected(null);
    setNotes('');
    setProcessing(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (filter !== 'all' && doc.status.toLowerCase() !== filter) return false;
      if (!q) return true;
      return [
        doc.user.name || '',
        doc.user.email,
        doc.user.phone || '',
        doc.documentType,
        doc.user.role,
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [docs, filter, query]);

  const stats = {
    pending: docs.filter((d) => d.status === 'PENDING').length,
    approved: docs.filter((d) => d.status === 'APPROVED').length,
    rejected: docs.filter((d) => d.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-blue-700">Admin · Identity verification</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">User verification documents</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review identity and business documents used to build user trust scores and verification status.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Admin home</Link>
            <Link href="/admin/service-providers" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Provider verification</Link>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          {[
            ['Pending review', stats.pending],
            ['Approved', stats.approved],
            ['Rejected', stats.rejected],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search person, email, phone, role or document" className="h-11 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950" />
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`border px-3 py-2 text-sm font-semibold ${filter === item ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-600'}`}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-sm text-slate-500">Loading verification documents…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10">
              <h2 className="text-lg font-semibold text-slate-950">No verification documents found</h2>
              <p className="mt-2 text-sm text-slate-500">Change the status filter or search query.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <button key={doc.id} onClick={() => { setSelected(doc); setNotes(doc.reviewNotes || ''); setError(''); }} className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.5fr)_180px_140px_140px] md:items-center">
                  <div>
                    <div className="font-semibold text-slate-950">{doc.user.name || 'Unnamed user'}</div>
                    <div className="mt-1 text-sm text-slate-500">{doc.user.email} · {doc.user.role}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{doc.documentType.replaceAll('_', ' ')}</div>
                    <div className="mt-1 text-xs text-slate-400">{new Date(doc.submittedAt).toLocaleDateString('en-ZM')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{Math.round(doc.user.trustScore || 0)}/100</div>
                    <div className="mt-2 h-1.5 bg-slate-100"><div className="h-1.5 bg-blue-600" style={{ width: Math.min(100, Math.max(0, doc.user.trustScore || 0)) + '%' }} /></div>
                  </div>
                  <div>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : doc.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-0 sm:p-4">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Review {selected.documentType.replaceAll('_', ' ')}</h2>
                <p className="mt-1 text-sm text-slate-500">{selected.user.name || 'Unnamed user'} · {selected.user.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <section className="grid gap-4 border border-slate-200 p-4 sm:grid-cols-2">
                <div><div className="text-xs text-slate-400">Name</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.name || 'Not provided'}</div></div>
                <div><div className="text-xs text-slate-400">Role</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.role}</div></div>
                <div><div className="text-xs text-slate-400">Phone</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.phone || 'Not provided'}</div></div>
                <div><div className="text-xs text-slate-400">Trust score</div><div className="mt-1 text-sm font-semibold text-slate-900">{Math.round(selected.user.trustScore || 0)}/100</div></div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-950">Document</h3>
                  <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700">Open original ↗</a>
                </div>
                <div className="mt-4 overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={selected.documentUrl} alt="Verification document" className="max-h-[560px] w-full object-contain" />
                </div>
              </section>

              <section>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Review notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Record why this document is approved or what needs correction." className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-slate-950" />
              </section>

              <section className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <button disabled={processing} onClick={() => review('APPROVED')} className="bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Approve document</button>
                <button disabled={processing || !notes.trim()} onClick={() => review('REJECTED')} className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-40">Reject with notes</button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
