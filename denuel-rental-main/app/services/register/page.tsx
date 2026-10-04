'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const categories = [
  ['SECURITY', 'Security'],
  ['PEST_CONTROL', 'Pest control'],
  ['LANDSCAPER', 'Gardening & landscaping'],
  ['PAINTER', 'Painting'],
  ['ELECTRICIAN', 'Electrical'],
  ['PLUMBER', 'Plumbing'],
  ['CLEANER', 'Cleaning'],
  ['MOVER', 'Moving'],
  ['CONTRACTOR', 'Construction / contractor'],
  ['HOME_INSPECTOR', 'Home inspection'],
  ['INTERIOR_DESIGNER', 'Interior design'],
  ['OTHER', 'Other property service'],
];

export default function ServiceProviderRegisterPage() {
  const router = useRouter();
  const [providerType, setProviderType] = useState<'COMPANY' | 'INDIVIDUAL'>('COMPANY');
  const [category, setCategory] = useState('SECURITY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isCompany = providerType === 'COMPANY';
  const isSecurity = category === 'SECURITY';

  const heading = useMemo(() => isCompany ? 'Register your company' : 'Register as an individual professional', [isCompany]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const services = String(form.get('servicesOffered') || '').split(',').map((x) => x.trim()).filter(Boolean);
    const areas = String(form.get('serviceAreas') || '').split(',').map((x) => x.trim()).filter(Boolean);
    const languages = String(form.get('languages') || '').split(',').map((x) => x.trim()).filter(Boolean);

    const payload: any = {
      providerType,
      category,
      businessName: String(form.get('businessName') || ''),
      contactPersonName: String(form.get('contactPersonName') || ''),
      contactPersonRole: String(form.get('contactPersonRole') || ''),
      description: String(form.get('description') || ''),
      bio: String(form.get('description') || ''),
      phone: String(form.get('phone') || ''),
      whatsappNumber: String(form.get('whatsappNumber') || ''),
      email: String(form.get('email') || ''),
      website: String(form.get('website') || ''),
      address: String(form.get('address') || ''),
      city: String(form.get('city') || ''),
      area: String(form.get('area') || ''),
      yearsInBusiness: Number(form.get('yearsInBusiness') || 0) || null,
      teamSize: Number(form.get('teamSize') || 0) || null,
      companyRegistrationNumber: String(form.get('companyRegistrationNumber') || ''),
      tpinNumber: String(form.get('tpinNumber') || ''),
      licenseNumber: String(form.get('licenseNumber') || ''),
      nrcNumber: String(form.get('nrcNumber') || ''),
      insured: form.get('insured') === 'on',
      insuranceProvider: String(form.get('insuranceProvider') || ''),
      backgroundCheckedStaff: form.get('backgroundCheckedStaff') === 'on',
      emergencyService: form.get('emergencyService') === 'on',
      responseTimeText: String(form.get('responseTimeText') || ''),
      servicesOffered: services,
      serviceAreas: areas,
      languages,
      priceRange: String(form.get('priceRange') || ''),
      categoryDetails: isSecurity ? {
        guardingServices: String(form.get('guardingServices') || ''),
        cctv: String(form.get('cctv') || ''),
        alarmResponse: String(form.get('alarmResponse') || ''),
        patrolServices: String(form.get('patrolServices') || ''),
        controlRoom: String(form.get('controlRoom') || ''),
        coverageModel: String(form.get('coverageModel') || ''),
      } : undefined,
    };

    if (isCompany && (!payload.companyRegistrationNumber || !payload.tpinNumber)) {
      setError('Company registration number and TPIN are required for company profiles.');
      setSaving(false);
      return;
    }
    if (!isCompany && !payload.nrcNumber) {
      setError('NRC / identity number is required for individual providers.');
      setSaving(false);
      return;
    }
    if (isSecurity && !payload.licenseNumber) {
      setError('Please provide the applicable security or operating licence number for verification.');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Unable to create the service profile.');
      return;
    }

    router.push('/services/' + data.id);
  }

  const input = 'h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600';
  const label = 'mb-1.5 block text-sm font-semibold text-slate-800';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Create a professional service profile</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Your public profile helps clients understand who you are, what you do and which details DENUEL has verified.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 border border-slate-300 bg-white p-1">
          <button type="button" onClick={() => setProviderType('COMPANY')} className={`px-4 py-3 text-sm font-semibold ${isCompany ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Company / organisation</button>
          <button type="button" onClick={() => setProviderType('INDIVIDUAL')} className={`px-4 py-3 text-sm font-semibold ${!isCompany ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Individual professional</button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-6">
          {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">{heading}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className={label}>{isCompany ? 'Company name' : 'Professional / trading name'}</label><input name="businessName" required className={input} /></div>
              <div><label className={label}>Service category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>{categories.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              {isCompany && <><div><label className={label}>Contact person</label><input name="contactPersonName" required className={input} /></div><div><label className={label}>Position / role</label><input name="contactPersonRole" className={input} placeholder="Operations Manager" /></div></>}
              <div><label className={label}>Phone</label><input name="phone" required className={input} /></div>
              <div><label className={label}>WhatsApp</label><input name="whatsappNumber" className={input} placeholder="260..." /></div>
              <div><label className={label}>Email</label><input type="email" name="email" required className={input} /></div>
              <div><label className={label}>Website</label><input name="website" className={input} placeholder="https://..." /></div>
              <div><label className={label}>City</label><input name="city" required className={input} defaultValue="Lusaka" /></div>
              <div><label className={label}>Area</label><input name="area" className={input} placeholder="Kabulonga, Roma, Kitwe..." /></div>
              <div className="sm:col-span-2"><label className={label}>Business / work address</label><input name="address" className={input} /></div>
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Identity & verification</h2>
            <p className="mt-1 text-sm text-slate-500">Sensitive verification documents are reviewed privately. Public profiles show verification status rather than exposing private documents.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {isCompany ? (
                <>
                  <div><label className={label}>Company registration number *</label><input name="companyRegistrationNumber" required className={input} /></div>
                  <div><label className={label}>TPIN *</label><input name="tpinNumber" required className={input} /></div>
                  <div><label className={label}>Team size</label><input type="number" min="1" name="teamSize" className={input} /></div>
                </>
              ) : (
                <>
                  <div><label className={label}>NRC / identity number *</label><input name="nrcNumber" required className={input} /></div>
                  <div><label className={label}>Years of professional experience</label><input type="number" min="0" name="yearsInBusiness" className={input} /></div>
                </>
              )}
              <div><label className={label}>{isSecurity ? 'Security / operating licence *' : 'Professional / trade licence'}</label><input name="licenseNumber" required={isSecurity} className={input} /></div>
              {isCompany && <div><label className={label}>Years in business</label><input type="number" min="0" name="yearsInBusiness" className={input} /></div>}
              <div><label className={label}>Insurance provider</label><input name="insuranceProvider" className={input} /></div>
              <div><label className={label}>Typical response time</label><input name="responseTimeText" className={input} placeholder="Usually within 30 minutes" /></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" name="insured" /> Insured</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="backgroundCheckedStaff" /> {isCompany ? 'Staff are background checked' : 'Background check available'}</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="emergencyService" /> Emergency / after-hours service</label>
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Professional profile</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={label}>About {isCompany ? 'the company' : 'you'}</label><textarea name="description" required rows={5} className="w-full border border-slate-300 p-3 text-sm" placeholder="Experience, strengths, how you work and what clients should know." /></div>
              <div className="sm:col-span-2"><label className={label}>Services offered</label><input name="servicesOffered" required className={input} placeholder="Separate services with commas" /></div>
              <div><label className={label}>Service areas</label><input name="serviceAreas" required className={input} placeholder="Lusaka, Chongwe, Kafue" /></div>
              <div><label className={label}>Languages</label><input name="languages" className={input} placeholder="English, Nyanja, Bemba" /></div>
              <div><label className={label}>Price range</label><input name="priceRange" className={input} placeholder="K500–K2,000 or Contact for quote" /></div>
            </div>
          </section>

          {isSecurity && (
            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Security capabilities</h2>
              <p className="mt-1 text-sm text-slate-500">Give clients enough operational information to understand the security services you can actually provide.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Guarding services</label><input name="guardingServices" className={input} placeholder="Residential, commercial, event..." /></div>
                <div><label className={label}>CCTV & surveillance</label><input name="cctv" className={input} placeholder="Installation, monitoring, maintenance..." /></div>
                <div><label className={label}>Alarm response</label><input name="alarmResponse" className={input} /></div>
                <div><label className={label}>Patrol services</label><input name="patrolServices" className={input} /></div>
                <div><label className={label}>Control room capability</label><input name="controlRoom" className={input} /></div>
                <div><label className={label}>Coverage model</label><input name="coverageModel" className={input} placeholder="24/7, scheduled shifts, call-out..." /></div>
              </div>
            </section>
          )}

          <section className="border border-blue-200 bg-blue-50 p-5">
            <h2 className="font-semibold text-slate-950">Verification documents</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              After creating the profile, the provider should upload the applicable identity, registration, tax, licence, insurance, qualification and supporting documents for DENUEL review. The public profile should only show which checks passed.
            </p>
          </section>

          <button disabled={saving} className="w-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Creating profile…' : 'Create profile and continue to verification'}
          </button>
        </form>
      </main>
    </div>
  );
}
