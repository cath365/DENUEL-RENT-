'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

const SPECIALTIES = [
  ['RESIDENTIAL_SALES', 'Residential sales'],
  ['RESIDENTIAL_RENTALS', 'Residential rentals'],
  ['COMMERCIAL', 'Commercial'],
  ['LUXURY', 'Luxury homes'],
  ['FIRST_TIME_BUYERS', 'First-time buyers'],
  ['INVESTMENT', 'Investment property'],
  ['RELOCATION', 'Relocation'],
  ['NEW_CONSTRUCTION', 'New construction'],
];

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AgentProfileEditorPage() {
  const [profileId, setProfileId] = useState('');
  const [form, setForm] = useState({
    bio: '',
    specialties: [] as string[],
    areasServed: '',
    licenseNumber: '',
    yearsExperience: '',
    languages: '',
    profilePhotoUrl: '',
    coverPhotoUrl: '',
    website: '',
    facebookUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    publicEmail: '',
    publicPhone: '',
    whatsappNumber: '',
  });
  const [completion, setCompletion] = useState(0);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'profile' | 'cover' | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [profileResponse, verificationResponse] = await Promise.all([
        fetch('/api/agents/profile?me=true'),
        fetch('/api/verification'),
      ]);

      if (profileResponse.status === 401 || verificationResponse.status === 401) {
        window.location.href = '/auth/login?redirect=/agent/profile';
        return;
      }

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        const agent = data.agent;
        setProfileId(agent.id || '');
        setCompletion(Number(agent.profileCompletion || 0));
        setForm({
          bio: agent.bio || '',
          specialties: Array.isArray(agent.specialties) ? agent.specialties : [],
          areasServed: Array.isArray(agent.areasServed) ? agent.areasServed.join(', ') : '',
          licenseNumber: agent.licenseNumber || '',
          yearsExperience: agent.yearsExperience == null ? '' : String(agent.yearsExperience),
          languages: Array.isArray(agent.languages) ? agent.languages.join(', ') : '',
          profilePhotoUrl: agent.profilePhotoUrl || '',
          coverPhotoUrl: agent.coverPhotoUrl || '',
          website: agent.website || '',
          facebookUrl: agent.facebookUrl || '',
          linkedinUrl: agent.linkedinUrl || '',
          instagramUrl: agent.instagramUrl || '',
          publicEmail: agent.publicEmail || '',
          publicPhone: agent.publicPhone || '',
          whatsappNumber: agent.whatsappNumber || '',
        });
      } else if (profileResponse.status !== 404) {
        const data = await profileResponse.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to load your agent profile.');
      }

      if (verificationResponse.ok) {
        setVerification(await verificationResponse.json());
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your agent profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSpecialty(value: string) {
    setForm((current) => ({
      ...current,
      specialties: current.specialties.includes(value)
        ? current.specialties.filter((item) => item !== value)
        : [...current.specialties, value],
    }));
  }

  async function uploadImage(file: File, kind: 'profile' | 'cover') {
    setUploading(kind);
    setError('');
    setSuccess('');

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('key', `agent/${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`);

      const response = await csrfFetch('/api/uploads/direct', {
        method: 'POST',
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error || 'Unable to upload this image.');
      }

      setForm((current) => ({
        ...current,
        [kind === 'profile' ? 'profilePhotoUrl' : 'coverPhotoUrl']: data.publicUrl,
      }));
      setSuccess('Image uploaded. Save the profile to publish the change.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload this image.');
    } finally {
      setUploading('');
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const yearsExperience =
        form.yearsExperience.trim() === ''
          ? null
          : Number(form.yearsExperience);

      if (
        yearsExperience !== null &&
        (!Number.isInteger(yearsExperience) ||
          yearsExperience < 0 ||
          yearsExperience > 80)
      ) {
        throw new Error('Years of experience must be a whole number from 0 to 80.');
      }

      const response = await csrfFetch('/api/agents/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: form.bio.trim() || null,
          specialties: form.specialties,
          areasServed: csvToArray(form.areasServed),
          licenseNumber: form.licenseNumber.trim() || null,
          yearsExperience,
          languages: csvToArray(form.languages),
          profilePhotoUrl: form.profilePhotoUrl || null,
          coverPhotoUrl: form.coverPhotoUrl || null,
          website: form.website.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
          linkedinUrl: form.linkedinUrl.trim() || null,
          instagramUrl: form.instagramUrl.trim() || null,
          publicEmail: form.publicEmail.trim() || null,
          publicPhone: form.publicPhone.trim() || null,
          whatsappNumber: form.whatsappNumber.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.profile) {
        throw new Error(data.error || 'Unable to save the agent profile.');
      }

      setProfileId(data.profile.id);
      setCompletion(Number(data.profileCompletion || 0));
      setSuccess('Agent profile saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the agent profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-[560px] animate-pulse border border-slate-200 bg-white" />
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
            <Link href="/agent" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
              ← Agent dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Professional identity</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Agent profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This information appears on your public Ng&apos;anda agent profile. Only add information you can stand behind professionally.
            </p>
          </div>

          {profileId && (
            <Link
              href={'/agents/' + profileId}
              className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              View public profile
            </Link>
          )}
        </div>

        {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={save} className="border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Public information</h2>
                <p className="mt-1 text-xs text-slate-500">Profile completion: {completion}%</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Professional bio</label>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  rows={6}
                  maxLength={4000}
                  placeholder="Describe your real estate work, approach and the clients you help."
                  className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Years of experience</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={form.yearsExperience}
                  onChange={(event) => setForm({ ...form, yearsExperience: event.target.value })}
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">License / professional number</label>
                <input
                  value={form.licenseNumber}
                  onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })}
                  placeholder="Only if applicable"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Areas served</label>
                <input
                  value={form.areasServed}
                  onChange={(event) => setForm({ ...form, areasServed: event.target.value })}
                  placeholder="Lusaka, Kabulonga, Ibex Hill"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
                <p className="mt-1 text-xs text-slate-400">Separate areas with commas.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Languages</label>
                <input
                  value={form.languages}
                  onChange={(event) => setForm({ ...form, languages: event.target.value })}
                  placeholder="English, Nyanja, Bemba"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-5">
                <div className="text-sm font-semibold text-slate-900">Public contact details</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Only these contact details are shown publicly. Your account login email and private account phone are not exposed by the agent directory.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Public email</label>
                    <input
                      type="email"
                      value={form.publicEmail}
                      onChange={(event) => setForm({ ...form, publicEmail: event.target.value })}
                      placeholder="work@example.com"
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Public phone</label>
                    <input
                      value={form.publicPhone}
                      onChange={(event) => setForm({ ...form, publicPhone: event.target.value })}
                      placeholder="+260..."
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp number</label>
                    <input
                      value={form.whatsappNumber}
                      onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })}
                      placeholder="+260..."
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-2 text-sm font-semibold text-slate-700">Specialties</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SPECIALTIES.map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.specialties.includes(value)}
                        onChange={() => toggleSpecialty(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {[
                ['Website', 'website'],
                ['LinkedIn', 'linkedinUrl'],
                ['Facebook', 'facebookUrl'],
                ['Instagram', 'instagramUrl'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                  <input
                    type="url"
                    value={(form as any)[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value } as any)}
                    placeholder="https://"
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-7 bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving profile…' : 'Save agent profile'}
            </button>
          </form>

          <aside className="space-y-5">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">Profile photo</h2>
              <div className="mt-4 aspect-square overflow-hidden bg-slate-100">
                {form.profilePhotoUrl ? (
                  <img src={form.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <label className="mt-3 block cursor-pointer border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700">
                {uploading === 'profile' ? 'Uploading…' : 'Upload profile photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={Boolean(uploading)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(file, 'profile');
                  }}
                />
              </label>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">Cover image</h2>
              <div className="mt-4 aspect-[16/7] overflow-hidden bg-slate-100">
                {form.coverPhotoUrl ? (
                  <img src={form.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <label className="mt-3 block cursor-pointer border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700">
                {uploading === 'cover' ? 'Uploading…' : 'Upload cover image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={Boolean(uploading)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(file, 'cover');
                  }}
                />
              </label>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">Verification</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>ID</span><strong>{verification?.isIdVerified ? 'Verified' : 'Not verified'}</strong></div>
                <div className="flex justify-between"><span>Business</span><strong>{verification?.isBusinessVerified ? 'Verified' : 'Not verified'}</strong></div>
                <div className="flex justify-between"><span>Trust score</span><strong>{Math.round(Number(verification?.trustScore || 0))}/100</strong></div>
              </div>
              <Link href="/profile/verification" className="mt-4 inline-flex text-sm font-semibold text-[#16A34A]">
                Manage verification →
              </Link>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
