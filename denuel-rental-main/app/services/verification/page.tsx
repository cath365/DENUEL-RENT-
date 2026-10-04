'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

type Provider = {
  id: string;
  providerType: string;
  businessName: string;
  category: string;
  insured: boolean;
  verificationStatus: string;
  isVerified: boolean;
  documents: any[];
};

type Requirement = {
  type: string;
  label: string;
  required: boolean;
  description: string;
};

export default function ServiceVerificationPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/services/me').then((r) => r.ok ? r.json() : null),
      fetch('/api/services/documents').then((r) => r.ok ? r.json() : null),
    ])
      .then(([profileData, docsData]) => {
        setProvider(profileData?.provider || null);
        setDocuments(Array.isArray(docsData?.documents) ? docsData.documents : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const requirements = useMemo<Requirement[]>(() => {
    if (!provider) return [];
    const isCompany = provider.providerType === 'COMPANY';
    const security = provider.category === 'SECURITY';

    if (isCompany) {
      return [
        { type: 'BUSINESS_LICENSE', label: 'Company registration / business certificate', required: true, description: 'Official company or business registration document.' },
        { type: 'TAX_CLEARANCE', label: 'TPIN / tax document', required: true, description: 'Tax registration or clearance document.' },
        { type: 'NRC', label: 'Authorised contact person ID', required: true, description: 'Identity document for the company representative responsible for the DENUEL account.' },
        { type: 'LICENSE', label: security ? 'Security / operating licence' : 'Professional or operating licence', required: security, description: 'Applicable operating or professional licence.' },
        { type: 'BACKGROUND_CHECK', label: 'Staff screening / police-clearance evidence', required: security, description: 'Security companies must provide evidence of background screening or applicable police-clearance checks.' },
        { type: 'INSURANCE', label: 'Insurance evidence', required: Boolean(provider.insured), description: 'Current insurance certificate or cover note where applicable.' },
        { type: 'PROOF_OF_ADDRESS', label: 'Business address evidence', required: false, description: 'Lease, utility bill or other business address evidence.' },
      ];
    }

    return [
      { type: 'NRC', label: 'NRC / national identity', required: true, description: 'Clear copy of the provider’s identity document.' },
      { type: 'QUALIFICATION', label: 'Qualification / trade certificate', required: provider.category === 'ELECTRICIAN', description: 'Relevant qualification, trade certificate or professional training. Required for electricians on DENUEL.' },
      { type: 'LICENSE', label: security ? 'Security / professional licence' : 'Trade or professional licence', required: security, description: 'Applicable licence where the service requires one.' },
      { type: 'BACKGROUND_CHECK', label: 'Background / police clearance', required: security, description: 'Police clearance or equivalent background document where applicable.' },
      { type: 'PROOF_OF_ADDRESS', label: 'Proof of address', required: false, description: 'Recent document confirming current address.' },
    ];
  }, [provider]);

  const docFor = (type: string) => documents.find((d) => d.type === type);

  async function uploadDocument(req: Requirement, file: File) {
    setUploading(req.type);
    setMessage('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('key', 'service-verification/' + req.type.toLowerCase() + '-' + Date.now() + '-' + file.name.replace(/\s+/g, '-'));

      const uploadRes = await fetch('/api/uploads/direct', { method: 'POST', body: form });
      const uploaded = await uploadRes.json();

      if (!uploadRes.ok || !uploaded.publicUrl) {
        throw new Error(uploaded.error || 'Upload failed');
      }

      const saveRes = await fetch('/api/services/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: req.type,
          name: file.name,
          fileUrl: uploaded.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.message || 'Could not save document');

      setDocuments((current) => [saved.document, ...current.filter((d) => d.type !== req.type)]);
      setMessage('Document uploaded. It is now waiting for admin review.');
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.');
    } finally {
      setUploading('');
    }
  }

  async function removeDocument(id: string) {
    const res = await fetch('/api/services/documents?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (res.ok) setDocuments((current) => current.filter((d) => d.id !== id));
  }

  const requiredComplete = requirements.filter((r) => r.required).every((r) => docFor(r.type));
  const verifiedCount = documents.filter((d) => d.isVerified).length;

  if (loading) {
    return <div className="min-h-screen bg-slate-50"><Header /><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="h-64 animate-pulse border border-slate-200 bg-white" /></div></div>;
  }

  if (!provider) {
    return <div className="min-h-screen bg-slate-50"><Header /><main className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-2xl font-bold">No service-provider profile found</h1><Link href="/services/register" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Create your profile</Link></main></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">{provider.providerType === 'COMPANY' ? 'Company verification' : 'Individual verification'}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">{provider.businessName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Complete the required checks below. Your profile stays out of the public Services directory until an administrator approves the required documents.</p>
          </div>
          <Link href={'/services/' + provider.id} className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">View public profile</Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          <div className="border-b border-r border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Verification status</div><div className="mt-2 text-xl font-bold text-slate-950">{provider.isVerified ? 'Verified' : provider.verificationStatus || 'Pending'}</div></div>
          <div className="border-b border-r border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Documents uploaded</div><div className="mt-2 text-xl font-bold text-slate-950">{documents.length}</div></div>
          <div className="border-b border-r border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Documents verified</div><div className="mt-2 text-xl font-bold text-slate-950">{verifiedCount}</div></div>
        </section>

        {message && <div className="mt-6 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

        <section className="mt-6 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Verification checklist</h2>
            <p className="mt-1 text-sm text-slate-500">Required items depend on whether the provider is a company or an individual and on the service category.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {requirements.map((req) => {
              const doc = docFor(req.type);
              return (
                <div key={req.type} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-950">{req.label}</h3>
                      {req.required ? <span className="bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Required</span> : <span className="bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Optional</span>}
                      {doc?.isVerified && <span className="bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Admin verified</span>}
                      {doc && !doc.isVerified && <span className="bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting review</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{req.description}</p>
                    {doc && <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span>File received by DENUEL for review.</span>{!doc.isVerified && <button onClick={() => removeDocument(doc.id)} className="font-semibold text-red-600">Remove</button>}</div>}
                  </div>

                  {!doc && (
                    <label className="inline-flex cursor-pointer items-center justify-center bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                      {uploading === req.type ? 'Uploading…' : 'Upload document'}
                      <input type="file" accept="image/*,.pdf" disabled={Boolean(uploading)} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadDocument(req, file); }} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className={`mt-6 border p-5 ${requiredComplete ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <h2 className="font-semibold text-slate-950">{requiredComplete ? 'Required documents uploaded' : 'Verification is not ready yet'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{requiredComplete ? 'Your required documents are available for admin review. DENUEL will show the verified badge only after the review is approved.' : 'Upload all required documents above before the profile can complete verification.'}</p>
        </div>
      </main>
    </div>
  );
}
