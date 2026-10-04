'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type VerificationData = {
  role: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  isBusinessVerified: boolean;
  trustScore: number;
  verifiedAt?: string | null;
  nrcNumber?: string | null;
  businessLicense?: string | null;
  companyName?: string | null;
  verificationDocs: any[];
};

function statusTone(status?: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function VerificationPage() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('NATIONAL_ID');
  const [nrcNumber, setNrcNumber] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/profile/verification';
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load verification status.');
      }

      setData(result);
      setNrcNumber(result.nrcNumber || '');
      setBusinessLicense(result.businessLicense || '');
      setCompanyName(result.companyName || '');
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load verification status.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateInfo() {
    setSavingInfo(true);
    setError('');
    setSuccess('');

    try {
      const response = await csrfFetch('/api/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nrcNumber,
          businessLicense,
          companyName,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Unable to update verification information.');
      }

      setSuccess('Verification information updated.');
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update verification information.'
      );
    } finally {
      setSavingInfo(false);
    }
  }

  async function submitDocument() {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append(
        'key',
        `verification/${documentType.toLowerCase()}-${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      );

      const uploadResponse = await csrfFetch('/api/uploads/direct', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok || !uploadData.publicUrl) {
        throw new Error(
          uploadData.error || 'Unable to store the verification document.'
        );
      }

      const submitResponse = await csrfFetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          documentUrl: uploadData.publicUrl,
          metadata: {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type || null,
          },
        }),
      });

      const submitData = await submitResponse.json().catch(() => ({}));

      if (!submitResponse.ok) {
        throw new Error(
          submitData.error || 'Unable to submit the document for review.'
        );
      }

      setSelectedFile(null);
      setSuccess('Document submitted for admin review.');
      await load();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to submit the verification document.'
      );
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-[520px] animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href={data?.role === 'AGENT' ? '/agent' : data?.role === 'LANDLORD' ? '/landlord' : '/dashboard'}
              className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← Back to dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Account trust</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Verification
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload real identity or business documents for administrator review. Ng&apos;anda only marks verification checks approved after a reviewer accepts the submitted document.
            </p>
          </div>
        </div>

        {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

        {data && (
          <>
            <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-5">
              <div className="border-b border-r border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">Trust score</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{Math.round(Number(data.trustScore || 0))}/100</div>
              </div>
              {[
                ['Email', data.isEmailVerified],
                ['Phone', data.isPhoneVerified],
                ['Identity', data.isIdVerified],
                ['Business', data.isBusinessVerified],
              ].map(([label, verified]) => (
                <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className={`mt-2 text-lg font-bold ${verified ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {verified ? 'Verified' : 'Not verified'}
                  </div>
                </div>
              ))}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-950">Verification information</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter identifiers only when they apply to you or your business. Entering a number does not mark it verified.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">NRC / identity number</label>
                    <input
                      value={nrcNumber}
                      onChange={(event) => setNrcNumber(event.target.value)}
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Company name</label>
                    <input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Business / professional license number</label>
                    <input
                      value={businessLicense}
                      onChange={(event) => setBusinessLicense(event.target.value)}
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={updateInfo}
                  disabled={savingInfo}
                  className="mt-5 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingInfo ? 'Saving…' : 'Save information'}
                </button>
              </section>

              <section className="border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-950">Submit document</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The selected file is stored first, then its real stored URL is submitted for review.
                </p>

                <div className="mt-5 space-y-4">
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
                  >
                    <option value="NATIONAL_ID">National ID / NRC</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="BUSINESS_LICENSE">Business license</option>
                    <option value="LICENSE">Professional license</option>
                    <option value="PROOF_OF_ADDRESS">Proof of address</option>
                    <option value="TAX_CLEARANCE">Tax clearance</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="QUALIFICATION">Qualification</option>
                    <option value="OTHER">Other document</option>
                  </select>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    className="w-full border border-slate-300 bg-white p-3 text-sm"
                  />

                  {selectedFile && (
                    <div className="text-xs text-slate-500">
                      Selected: {selectedFile.name} · {Math.ceil(selectedFile.size / 1024).toLocaleString()} KB
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={submitDocument}
                  disabled={!selectedFile || uploading}
                  className="mt-5 bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploading ? 'Uploading and submitting…' : 'Submit for review'}
                </button>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Review timing depends on administrator availability. A submitted document remains pending until an administrator actually reviews it.
                </p>
              </section>
            </div>

            <section className="mt-6 border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-950">Submitted documents</h2>
              </div>

              {data.verificationDocs.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">No verification documents submitted yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.verificationDocs.map((doc) => (
                    <div key={doc.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-950">{String(doc.documentType).replaceAll('_', ' ')}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Submitted {new Date(doc.submittedAt).toLocaleDateString('en-ZM')}
                        </div>
                        {doc.reviewNotes && (
                          <div className="mt-2 text-xs leading-5 text-slate-600">Review notes: {doc.reviewNotes}</div>
                        )}
                      </div>
                      <span className={`w-fit px-2.5 py-1 text-xs font-semibold ${statusTone(doc.status)}`}>
                        {doc.status}
                      </span>
                      <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#16A34A]">
                        Open file
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
