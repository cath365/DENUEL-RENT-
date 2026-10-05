'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type VerificationDocument = {
  id: string;
  type: string;
  name: string;
  fileSize?: number | null;
  mimeType?: string | null;
  isVerified: boolean;
  uploadedAt: string;
  fileAccessUrl: string;
  storagePrivate?: boolean;
};

type Provider = {
  id: string;
  providerType: string;
  businessName: string;
  category: string;
  insured: boolean;
  verificationStatus: string;
  rejectionReason?: string | null;
  isVerified: boolean;
};

type Requirement = {
  type: string;
  label: string;
  required: boolean;
  description: string;
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

async function readResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { text, data };
}

function fileSizeLabel(value?: number | null) {
  if (!value) return '';
  if (value < 1024 * 1024) return Math.ceil(value / 1024) + ' KB';
  return (value / 1024 / 1024).toFixed(1) + ' MB';
}

export default function ServiceVerificationPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [removing, setRemoving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const redirectToLogin = () => {
    router.push('/auth/login?redirect=/services/verification&reason=session');
  };

  async function loadVerification() {
    setLoading(true);
    setError('');

    try {
      const [profileRes, docsRes] = await Promise.all([
        fetch('/api/services/me', { credentials: 'same-origin' }),
        fetch('/api/services/documents', { credentials: 'same-origin' }),
      ]);

      if (profileRes.status === 401 || docsRes.status === 401) {
        redirectToLogin();
        return;
      }

      const [profilePayload, docsPayload] = await Promise.all([
        readResponse(profileRes),
        readResponse(docsRes),
      ]);

      if (profileRes.status === 404) {
        router.push('/services/register');
        return;
      }

      if (!profileRes.ok || !profilePayload.data?.provider) {
        throw new Error(
          profilePayload.data?.message ||
          profilePayload.text ||
          'Unable to load your service provider profile.'
        );
      }

      if (!docsRes.ok) {
        throw new Error(
          docsPayload.data?.message ||
          docsPayload.text ||
          'Unable to load verification documents.'
        );
      }

      setProvider(profilePayload.data.provider);
      setDocuments(Array.isArray(docsPayload.data?.documents) ? docsPayload.data.documents : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load verification details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerification();
  }, []);

  const requirements = useMemo<Requirement[]>(() => {
    if (!provider) return [];

    const isCompany = provider.providerType === 'COMPANY';
    const security = provider.category === 'SECURITY';

    if (isCompany) {
      return [
        {
          type: 'BUSINESS_LICENSE',
          label: 'Company registration / business certificate',
          required: true,
          description: 'Official company or business registration document.',
        },
        {
          type: 'TAX_CLEARANCE',
          label: 'TPIN / tax document',
          required: true,
          description: 'Tax registration or current tax document.',
        },
        {
          type: 'NRC',
          label: 'Authorised contact person ID',
          required: true,
          description: 'Identity document for the company representative responsible for this DENUEL account.',
        },
        {
          type: 'LICENSE',
          label: security ? 'Security / operating licence' : 'Professional or operating licence',
          required: security,
          description: 'Applicable operating or professional licence.',
        },
        {
          type: 'BACKGROUND_CHECK',
          label: 'Staff screening / police-clearance evidence',
          required: security,
          description: 'Security companies must provide applicable staff screening or police-clearance evidence.',
        },
        {
          type: 'INSURANCE',
          label: 'Insurance evidence',
          required: Boolean(provider.insured),
          description: 'Current insurance certificate or cover note where applicable.',
        },
        {
          type: 'PROOF_OF_ADDRESS',
          label: 'Business address evidence',
          required: false,
          description: 'Lease, utility bill or other current business-address evidence.',
        },
      ];
    }

    return [
      {
        type: 'NRC',
        label: 'NRC / national identity',
        required: true,
        description: 'Clear copy of the provider’s identity document.',
      },
      {
        type: 'QUALIFICATION',
        label: 'Qualification / trade certificate',
        required: provider.category === 'ELECTRICIAN',
        description: 'Relevant qualification, trade certificate or professional training.',
      },
      {
        type: 'LICENSE',
        label: security ? 'Security / professional licence' : 'Trade or professional licence',
        required: security,
        description: 'Applicable licence where the service requires one.',
      },
      {
        type: 'BACKGROUND_CHECK',
        label: 'Background / police clearance',
        required: security,
        description: 'Police clearance or equivalent background document where applicable.',
      },
      {
        type: 'PROOF_OF_ADDRESS',
        label: 'Proof of address',
        required: false,
        description: 'Recent document confirming current address.',
      },
    ];
  }, [provider]);

  const docFor = (type: string) => documents.find((document) => document.type === type);

  const requiredRequirements = requirements.filter((requirement) => requirement.required);
  const requiredUploaded = requiredRequirements.filter((requirement) => docFor(requirement.type)).length;
  const requiredVerified = requiredRequirements.filter((requirement) => {
    const document = docFor(requirement.type);
    return Boolean(document?.isVerified && document.storagePrivate);
  }).length;
  const requiredComplete = requiredUploaded === requiredRequirements.length && requiredRequirements.length > 0;

  async function uploadDocument(requirement: Requirement, file: File) {
    setMessage('');
    setError('');

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError('Use a PDF, JPG, PNG or WEBP file for verification.');
      return;
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError('Verification documents must be 4MB or smaller.');
      return;
    }

    const existing = docFor(requirement.type);
    if (existing?.isVerified && existing.storagePrivate) {
      setError('This securely stored document is already verified and cannot be replaced from the provider account.');
      return;
    }

    setUploading(requirement.type);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', requirement.type);

      const res = await csrfFetch('/api/services/documents/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok || !data?.document) {
        throw new Error(data?.error || text || 'Unable to upload verification document.');
      }

      setDocuments((current) => [
        data.document,
        ...current.filter((document) => document.type !== requirement.type),
      ]);
      setMessage('Document uploaded securely. It is now waiting for admin review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload verification document.');
    } finally {
      setUploading('');
    }
  }

  async function removeDocument(document: VerificationDocument) {
    if (document.isVerified) {
      setError('Verified documents cannot be removed from the provider account.');
      return;
    }

    if (!window.confirm('Remove this verification document?')) return;

    setRemoving(document.id);
    setMessage('');
    setError('');

    try {
      const res = await csrfFetch(
        '/api/services/documents?id=' + encodeURIComponent(document.id),
        {
          method: 'DELETE',
          credentials: 'same-origin',
        }
      );
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || text || 'Unable to remove document.');
      }

      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setMessage('Document removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove document.');
    } finally {
      setRemoving('');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="h-64 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-2xl font-bold">No service-provider profile found</h1>
          <p className="mt-2 text-sm text-slate-500">Create your professional profile before uploading verification documents.</p>
          <Link href="/services/register" className="mt-5 inline-flex bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Create provider profile
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/services/dashboard" className="text-sm font-semibold text-blue-700">
              ← Service dashboard
            </Link>
            <p className="mt-4 text-sm font-semibold text-blue-700">
              {provider.providerType === 'COMPANY' ? 'Company verification' : 'Individual verification'}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">{provider.businessName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Upload the required evidence below. Verification documents are private and are only available to your account and authorised DENUEL administrators.
            </p>
          </div>

          {provider.isVerified && (
            <Link
              href={'/services/' + provider.id}
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              View public profile
            </Link>
          )}
        </section>

        {provider.verificationStatus === 'REJECTED' && provider.rejectionReason && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Verification needs changes</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">{provider.rejectionReason}</p>
          </section>
        )}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-4">
          {[
            ['Status', provider.isVerified ? 'Verified' : humanizeStatus(provider.verificationStatus || 'PENDING')],
            ['Required uploaded', requiredUploaded + '/' + requiredRequirements.length],
            ['Required verified', requiredVerified + '/' + requiredRequirements.length],
            ['Total documents', documents.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">Private verification storage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Accepted files: PDF, JPG, PNG and WEBP, up to 4MB each. Uploaded identity and business documents are not published on your public service profile.
          </p>
        </section>

        <section className="mt-6 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold">Verification checklist</h2>
            <p className="mt-1 text-sm text-slate-500">
              Requirements depend on whether you registered as a company or individual and on your service category.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {requirements.map((requirement) => {
              const document = docFor(requirement.type);

              return (
                <div key={requirement.type} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{requirement.label}</h3>
                      {requirement.required ? (
                        <span className="bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Required</span>
                      ) : (
                        <span className="bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Optional</span>
                      )}
                      {document && !document.storagePrivate && (
                        <span className="bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Secure re-upload required</span>
                      )}
                      {document?.isVerified && document.storagePrivate && (
                        <span className="bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Admin verified</span>
                      )}
                      {document && document.storagePrivate && !document.isVerified && (
                        <span className="bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting review</span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">{requirement.description}</p>

                    {document && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span>{document.name}</span>
                        {document.fileSize ? <span>{fileSizeLabel(document.fileSize)}</span> : null}
                        <span>Uploaded {new Date(document.uploadedAt).toLocaleDateString('en-ZM')}</span>
                        <a
                          href={document.fileAccessUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700"
                        >
                          Open secure document
                        </a>
                        {!document.isVerified && document.storagePrivate && (
                          <button
                            type="button"
                            disabled={removing === document.id}
                            onClick={() => removeDocument(document)}
                            className="font-semibold text-red-700 disabled:opacity-50"
                          >
                            {removing === document.id ? 'Removing…' : 'Remove'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!document && (
                    <label className="inline-flex cursor-pointer items-center justify-center bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                      {uploading === requirement.type ? 'Uploading…' : 'Upload document'}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        disabled={Boolean(uploading)}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadDocument(requirement, file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  )}

                  {document && (!document.isVerified || !document.storagePrivate) && (
                    <label className="inline-flex cursor-pointer items-center justify-center border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                      {uploading === requirement.type
                        ? 'Replacing…'
                        : !document.storagePrivate
                          ? 'Re-upload securely'
                          : 'Replace before review'}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        disabled={Boolean(uploading)}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadDocument(requirement, file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className={
          'mt-6 border p-5 ' +
          (provider.isVerified
            ? 'border-emerald-200 bg-emerald-50'
            : requiredComplete
              ? 'border-blue-200 bg-blue-50'
              : 'border-amber-200 bg-amber-50')
        }>
          <h2 className="font-semibold">
            {provider.isVerified
              ? 'Verification complete'
              : requiredComplete
                ? 'Required documents uploaded'
                : 'Verification is not ready yet'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {provider.isVerified
              ? 'Your provider profile has passed DENUEL verification.'
              : requiredComplete
                ? 'Your required documents are available for admin review. The verified badge appears only after approval.'
                : 'Upload all required documents above before your profile can complete verification.'}
          </p>
        </section>
      </main>
    </div>
  );
}

function humanizeStatus(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
