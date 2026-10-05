'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type ServiceDocument = {
  id: string;
  type: string;
  name: string;
  fileAccessUrl: string;
  storagePrivate?: boolean;
  isVerified: boolean;
  uploadedAt: string;
};

type ServiceProvider = {
  id: string;
  providerType: string;
  businessName: string;
  category: string;
  phone: string;
  email: string;
  city: string;
  area?: string | null;
  isVerified: boolean;
  isActive: boolean;
  insured: boolean;
  verificationStatus: string;
  rejectionReason?: string | null;
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  companyRegistrationNumber?: string | null;
  tpinNumber?: string | null;
  nrcNumber?: string | null;
  licenseNumber?: string | null;
  yearsInBusiness?: number | null;
  teamSize?: number | null;
  createdAt: string;
  documents: ServiceDocument[];
  _count: { bookings: number; reviews: number };
};

const CATEGORY_LABELS: Record<string, string> = {
  SECURITY: 'Security',
  PEST_CONTROL: 'Pest control',
  LANDSCAPER: 'Gardening & landscaping',
  GARDENER: 'Gardener',
  MOVER: 'Moving',
  CLEANER: 'Cleaning',
  MAID: 'Housekeeping',
  PAINTER: 'Painting',
  PLUMBER: 'Plumbing',
  ELECTRICIAN: 'Electrical',
  CONTRACTOR: 'Contractor',
  INTERIOR_DESIGNER: 'Interior design',
  HOME_INSPECTOR: 'Home inspection',
};

function requiredDocuments(provider: ServiceProvider) {
  const required: { type: string; label: string }[] = [];

  if (provider.providerType === 'COMPANY') {
    required.push(
      { type: 'BUSINESS_LICENSE', label: 'Company registration' },
      { type: 'TAX_CLEARANCE', label: 'TPIN / tax document' },
      { type: 'NRC', label: 'Authorised contact person ID' }
    );
    if (provider.category === 'SECURITY') {
      required.push(
        { type: 'LICENSE', label: 'Security / operating licence' },
        { type: 'BACKGROUND_CHECK', label: 'Staff screening / police-clearance evidence' }
      );
    }
    if (provider.insured) {
      required.push({ type: 'INSURANCE', label: 'Insurance evidence' });
    }
  } else {
    required.push({ type: 'NRC', label: 'NRC / national identity' });
    if (provider.category === 'SECURITY') {
      required.push(
        { type: 'LICENSE', label: 'Security / professional licence' },
        { type: 'BACKGROUND_CHECK', label: 'Background / police clearance' }
      );
    }
    if (provider.category === 'ELECTRICIAN') {
      required.push({ type: 'QUALIFICATION', label: 'Electrical qualification / trade certificate' });
    }
  }

  return required;
}

export default function AdminServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceProvider | null>(null);
  const [status, setStatus] = useState('PENDING');
  const [providerType, setProviderType] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');

  const fetchProviders = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (providerType) p.set('providerType', providerType);
    if (category) p.set('category', category);
    if (query.trim()) p.set('q', query.trim());
    p.set('limit', '100');

    try {
      const res = await fetch('/api/admin/service-providers?' + p.toString());
      const data = await res.json();
      setProviders(Array.isArray(data.providers) ? data.providers : []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProviders, 200);
    return () => clearTimeout(timer);
  }, [status, providerType, category, query]);

  const allStats = useMemo(() => ({
    total: providers.length,
    companies: providers.filter((p) => p.providerType === 'COMPANY').length,
    individuals: providers.filter((p) => p.providerType !== 'COMPANY').length,
    verified: providers.filter((p) => p.isVerified).length,
  }), [providers]);

  function replaceProvider(updated: ServiceProvider) {
    setProviders((current) => current.map((p) => p.id === updated.id ? updated : p));
    setSelected(updated);
  }

  async function verifyDocument(documentId: string) {
    if (!selected) return;
    setProcessing(documentId);
    setError('');
    const res = await csrfFetch('/api/admin/service-documents/' + documentId + '/verify', { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.message || 'Could not verify document.');
      setProcessing('');
      return;
    }

    const updated = {
      ...selected,
      documents: selected.documents.map((doc) => doc.id === documentId ? { ...doc, isVerified: true } : doc),
    };
    replaceProvider(updated);
    setProcessing('');
  }

  async function approveProvider() {
    if (!selected) return;
    setProcessing('approve');
    setError('');
    const res = await csrfFetch('/api/admin/approvals/' + selected.id + '/approve', { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const missing = Array.isArray(data.missing) ? ' Missing: ' + data.missing.join(', ') : '';
      setError((data.error || data.message || 'Could not approve provider.') + missing);
      setProcessing('');
      return;
    }

    replaceProvider({ ...selected, isVerified: true, isActive: true, verificationStatus: 'VERIFIED', rejectionReason: null });
    setProcessing('');
  }

  async function rejectProvider() {
    if (!selected || !rejectReason.trim()) return;
    setProcessing('reject');
    setError('');
    const res = await csrfFetch('/api/admin/approvals/' + selected.id + '/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || 'Could not reject provider.');
      setProcessing('');
      return;
    }

    replaceProvider({ ...selected, isVerified: false, isActive: false, verificationStatus: 'REJECTED', rejectionReason: rejectReason.trim() });
    setRejectReason('');
    setProcessing('');
  }

  async function toggleActive(provider: ServiceProvider) {
    const res = await csrfFetch('/api/admin/service-providers/' + provider.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !provider.isActive }),
    });

    if (res.ok) {
      replaceProvider({ ...provider, isActive: !provider.isActive });
    }
  }

  const checklist = selected ? requiredDocuments(selected) : [];
  const canApprove = selected
    ? checklist.every((req) =>
        selected.documents.some(
          (doc) => doc.type === req.type && doc.isVerified && doc.storagePrivate
        )
      )
    : false;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-blue-700">Admin · Trust & safety</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Service provider verification</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review companies and individuals, inspect supporting documents and control the public DENUEL verified badge.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Admin home</Link>
            <Link href="/services" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Public services</Link>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Visible results', allStats.total],
            ['Companies', allStats.companies],
            ['Individuals', allStats.individuals],
            ['Verified', allStats.verified],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_170px_190px_200px]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, person, email, phone or city" className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 border border-slate-300 bg-white px-3 text-sm">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select value={providerType} onChange={(e) => setProviderType(e.target.value)} className="h-11 border border-slate-300 bg-white px-3 text-sm">
              <option value="">Company + individual</option>
              <option value="COMPANY">Companies</option>
              <option value="INDIVIDUAL">Individuals</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 border border-slate-300 bg-white px-3 text-sm">
              <option value="">All service categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-sm text-slate-500">Loading provider applications…</div>
          ) : providers.length === 0 ? (
            <div className="p-10">
              <h2 className="text-lg font-semibold text-slate-950">No providers match these filters</h2>
              <p className="mt-2 text-sm text-slate-500">Try another verification status, category or provider type.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {providers.map((provider) => {
                const required = requiredDocuments(provider);
                const verifiedRequired = required.filter((req) =>
                  provider.documents.some(
                    (doc) => doc.type === req.type && doc.isVerified && doc.storagePrivate
                  )
                ).length;
                return (
                  <button key={provider.id} onClick={() => { setSelected(provider); setError(''); setRejectReason(''); }} className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.4fr)_150px_170px_160px] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-950">{provider.businessName}</span>
                        <span className="border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{provider.providerType === 'COMPANY' ? 'Company' : 'Individual'}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{provider.email} · {[provider.area, provider.city].filter(Boolean).join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{CATEGORY_LABELS[provider.category] || provider.category}</div>
                      <div className="mt-1 text-xs text-slate-400">{provider._count?.reviews || 0} reviews</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{verifiedRequired}/{required.length} required verified</div>
                      <div className="mt-1 text-xs text-slate-400">{provider.documents.length} total documents</div>
                    </div>
                    <div>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${
                        provider.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : provider.verificationStatus === 'REJECTED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {provider.verificationStatus || (provider.isVerified ? 'VERIFIED' : 'PENDING')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-0 sm:p-4">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-950">{selected.businessName}</h2>
                  <span className="border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{selected.providerType === 'COMPANY' ? 'Company' : 'Individual'}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{CATEGORY_LABELS[selected.category] || selected.category} · {selected.city}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Profile identity</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {selected.providerType === 'COMPANY' ? (
                    <>
                      <div><div className="text-xs text-slate-400">Contact person</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.contactPersonName || 'Not supplied'}</div></div>
                      <div><div className="text-xs text-slate-400">Position</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.contactPersonRole || 'Not supplied'}</div></div>
                      <div><div className="text-xs text-slate-400">Company registration</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.companyRegistrationNumber || 'Not supplied'}</div></div>
                      <div><div className="text-xs text-slate-400">TPIN</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.tpinNumber || 'Not supplied'}</div></div>
                      <div><div className="text-xs text-slate-400">Team size</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.teamSize || 'Not supplied'}</div></div>
                    </>
                  ) : (
                    <>
                      <div><div className="text-xs text-slate-400">NRC / identity</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.nrcNumber ? 'Supplied' : 'Not supplied'}</div></div>
                      <div><div className="text-xs text-slate-400">Experience</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.yearsInBusiness != null ? selected.yearsInBusiness + ' years' : 'Not supplied'}</div></div>
                    </>
                  )}
                  <div><div className="text-xs text-slate-400">Phone</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.phone}</div></div>
                  <div><div className="text-xs text-slate-400">Email</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.email}</div></div>
                  <div><div className="text-xs text-slate-400">Licence number</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.licenseNumber || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Registered</div><div className="mt-1 text-sm font-semibold text-slate-900">{new Date(selected.createdAt).toLocaleDateString('en-ZM')}</div></div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">Required verification</h3>
                    <p className="mt-1 text-sm text-slate-500">Every required item must be uploaded and verified before approval.</p>
                  </div>
                  <Link href={'/services/' + selected.id} target="_blank" className="text-sm font-semibold text-blue-700">Public profile ↗</Link>
                </div>

                <div className="mt-4 divide-y divide-slate-100 border border-slate-200">
                  {checklist.map((req) => {
                    const doc = selected.documents.find((d) => d.type === req.type);
                    return (
                      <div key={req.type} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{req.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{doc ? doc.name : 'Not uploaded'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc ? (
                            <>
                              <a href={doc.fileAccessUrl} target="_blank" rel="noreferrer" className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">View</a>
                              {!doc.storagePrivate ? (
                                <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Secure re-upload required</span>
                              ) : doc.isVerified ? (
                                <span className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Verified</span>
                              ) : (
                                <button disabled={processing === doc.id} onClick={() => verifyDocument(doc.id)} className="bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                                  {processing === doc.id ? 'Saving…' : 'Verify document'}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Missing</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selected.documents.filter((doc) => !checklist.some((req) => req.type === doc.type)).length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-slate-900">Additional documents</h4>
                    <div className="mt-3 divide-y divide-slate-100 border border-slate-200">
                      {selected.documents.filter((doc) => !checklist.some((req) => req.type === doc.type)).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div><div className="text-sm font-medium text-slate-800">{doc.name}</div><div className="text-xs text-slate-400">{doc.type.replaceAll('_', ' ')}</div></div>
                          <div className="flex gap-2">
                            <a href={doc.fileAccessUrl} target="_blank" rel="noreferrer" className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">View</a>
                            {!doc.storagePrivate ? (
                              <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Secure re-upload required</span>
                            ) : !doc.isVerified ? (
                              <button disabled={processing === doc.id} onClick={() => verifyDocument(doc.id)} className="bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Verify</button>
                            ) : (
                              <span className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Verified</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-950">Decision</h3>
                <p className="mt-1 text-sm text-slate-500">{canApprove ? 'All required documents are verified. This provider can be approved.' : 'Approval is locked until all required documents are uploaded and verified.'}</p>

                {selected.rejectionReason && <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Previous rejection reason:</strong> {selected.rejectionReason}</div>}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button disabled={!canApprove || processing === 'approve'} onClick={approveProvider} className="bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                    {processing === 'approve' ? 'Approving…' : 'Approve & verify provider'}
                  </button>
                  <button onClick={() => toggleActive(selected)} className="border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
                    {selected.isActive ? 'Deactivate profile' : 'Activate profile'}
                  </button>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Reject / request corrections</label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain exactly what the provider needs to correct or upload." className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-red-500" />
                  <button disabled={!rejectReason.trim() || processing === 'reject'} onClick={rejectProvider} className="mt-3 border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-40">
                    {processing === 'reject' ? 'Saving…' : 'Reject and notify provider'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
