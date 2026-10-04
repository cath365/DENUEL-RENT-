'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../../lib/csrf';

const VEHICLE_TYPES = [
  ['MOTORBIKE', 'Motorbike', 'Small deliveries and short transport requests.'],
  ['CAR', 'Car / sedan', 'Passenger trips and light transport.'],
  ['SUV', 'SUV', 'Passenger trips with additional luggage space.'],
  ['VAN', 'Van / minibus', 'Passenger groups or medium cargo.'],
  ['TRUCK_SMALL', 'Small truck', 'Small moving and cargo jobs.'],
  ['TRUCK_MEDIUM', 'Medium truck', 'Medium moving and cargo jobs.'],
  ['TRUCK_LARGE', 'Large truck', 'Large moving and cargo jobs.'],
] as const;

const ZAMBIAN_CITIES = [
  'Lusaka',
  'Kitwe',
  'Ndola',
  'Kabwe',
  'Chingola',
  'Mufulira',
  'Livingstone',
  'Luanshya',
  'Kasama',
  'Chipata',
  'Solwezi',
  'Mansa',
  'Mongu',
  'Kafue',
  'Choma',
];

const REQUIRED_DOCUMENTS = [
  ['NRC', 'NRC / national identity', 'Clear copy of your NRC.'],
  ['DRIVER_LICENSE', 'Driver’s licence', 'Current licence showing the licence number used in your application.'],
  ['VEHICLE_REGISTRATION', 'Vehicle registration', 'Registration document for the vehicle you want to use.'],
  ['INSURANCE', 'Vehicle insurance', 'Current vehicle insurance evidence.'],
  ['POLICE_CLEARANCE', 'Police clearance', 'Current police-clearance or equivalent background-check document.'],
] as const;

type DocumentType = typeof REQUIRED_DOCUMENTS[number][0];

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

export default function DriverApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<any>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [form, setForm] = useState({
    nrcNumber: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    vehicleColor: '',
    capacity: '',
    experience: '',
    bio: '',
    serviceAreas: [] as string[],
  });
  const [documents, setDocuments] = useState<Record<DocumentType, File | null>>({
    NRC: null,
    DRIVER_LICENSE: null,
    VEHICLE_REGISTRATION: null,
    INSURANCE: null,
    POLICE_CLEARANCE: null,
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAccountState() {
      try {
        const profileRes = await fetch('/api/driver/profile', { credentials: 'same-origin' });

        if (profileRes.status === 401) {
          router.push('/auth/login?redirect=/driver/apply&reason=session');
          return;
        }

        if (profileRes.status === 403) {
          if (!cancelled) {
            setError('This account is not registered as a driver account.');
            setCheckingAccount(false);
          }
          return;
        }

        if (profileRes.ok) {
          const { data } = await readResponse(profileRes);
          if (data?.profile) {
            router.push('/driver');
            return;
          }
        }

        const meRes = await fetch('/api/auth/me', { credentials: 'same-origin' });
        const { data: meData } = await readResponse(meRes);

        if (!meData?.user) {
          router.push('/auth/login?redirect=/driver/apply&reason=session');
          return;
        }

        if (meData.user.role !== 'DRIVER') {
          if (!cancelled) {
            setError('Choose Driver / transport during registration before completing a driver application.');
            setCheckingAccount(false);
          }
          return;
        }

        if (!cancelled) {
          setAccount(meData.user);
        }
      } catch {
        if (!cancelled) setError('Unable to load your driver account.');
      } finally {
        if (!cancelled) setCheckingAccount(false);
      }
    }

    loadAccountState();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const allDocumentsSelected = useMemo(
    () => REQUIRED_DOCUMENTS.every(([type]) => Boolean(documents[type])),
    [documents],
  );

  const stepOneReady =
    Boolean(form.vehicleType) &&
    form.vehicleMake.trim().length >= 2 &&
    form.vehicleModel.trim().length >= 1 &&
    Number(form.vehicleYear) >= 1980 &&
    form.vehiclePlate.trim().length >= 2 &&
    form.vehicleColor.trim().length >= 2;

  const stepTwoReady =
    form.nrcNumber.trim().length >= 5 &&
    form.licenseNumber.trim().length >= 3 &&
    form.experience.trim().length >= 2;

  const toggleArea = (area: string) => {
    setForm((current) => ({
      ...current,
      serviceAreas: current.serviceAreas.includes(area)
        ? current.serviceAreas.filter((item) => item !== area)
        : [...current.serviceAreas, area],
    }));
  };

  async function submitApplication() {
    setError('');

    if (!stepOneReady || !stepTwoReady || form.serviceAreas.length === 0 || !allDocumentsSelected) {
      setError('Complete all required driver, vehicle, service-area and document fields.');
      return;
    }

    setLoading(true);

    try {
      const profileRes = await csrfFetch('/api/driver/profile', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nrcNumber: form.nrcNumber.trim(),
          licenseNumber: form.licenseNumber.trim(),
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate.trim(),
          vehicleMake: form.vehicleMake.trim(),
          vehicleModel: form.vehicleModel.trim(),
          vehicleYear: Number(form.vehicleYear),
          vehicleColor: form.vehicleColor.trim(),
          vehicleCapacityKg: form.capacity ? Number(form.capacity) : undefined,
          experience: form.experience.trim(),
          bio: form.bio.trim() || undefined,
          serviceAreas: form.serviceAreas,
        }),
      });

      const profilePayload = await readResponse(profileRes);

      if (profileRes.status === 401) {
        router.push('/auth/login?redirect=/driver/apply&reason=session');
        return;
      }

      if (!profileRes.ok && profileRes.status !== 409) {
        const validation = Array.isArray(profilePayload.data?.error)
          ? profilePayload.data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : profilePayload.data?.error;
        throw new Error(validation || profilePayload.text || 'Unable to create driver application.');
      }

      const uploadFailures: string[] = [];

      for (const [type, label] of REQUIRED_DOCUMENTS) {
        const file = documents[type];
        if (!file) continue;

        setUploadProgress('Uploading ' + label + '…');

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('type', type);

        const uploadRes = await csrfFetch('/api/driver/documents/upload', {
          method: 'POST',
          credentials: 'same-origin',
          body: uploadForm,
        });
        const uploadPayload = await readResponse(uploadRes);

        if (uploadRes.status === 401) {
          router.push('/auth/login?redirect=/driver&reason=session');
          return;
        }

        if (!uploadRes.ok) {
          uploadFailures.push(label + ': ' + (uploadPayload.data?.error || uploadPayload.text || 'upload failed'));
        }
      }

      if (uploadFailures.length) {
        setError(
          'Your driver profile was saved, but some verification documents did not upload. ' +
          uploadFailures.join(' ')
        );
        setUploadProgress('');
        return;
      }

      router.push('/driver/apply/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit driver application.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  if (checkingAccount) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-72 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-blue-700">Transport onboarding</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Driver application</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Add your vehicle and driver information, choose the areas you serve, and upload the documents DENUEL needs to verify your account.
          </p>
        </section>

        {account && (
          <section className="mt-6 border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signed-in account</div>
            <div className="mt-2 font-semibold">{account.name || 'Driver account'}</div>
            <div className="mt-1 text-sm text-slate-500">
              {account.email}{account.phone ? ' · ' + account.phone : ''}
            </div>
          </section>
        )}

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error}
            {error.includes('profile was saved') && (
              <div className="mt-3">
                <Link href="/driver" className="font-semibold underline underline-offset-4">
                  Open driver dashboard to finish verification
                </Link>
              </div>
            )}
          </section>
        )}

        <div className="mt-7 flex items-center">
          {[
            [1, 'Vehicle'],
            [2, 'Driver'],
            [3, 'Service areas'],
            [4, 'Documents'],
          ].map(([number, label], index) => (
            <div key={number} className={'flex items-center ' + (index < 3 ? 'flex-1' : '')}>
              <button
                type="button"
                onClick={() => Number(number) < step && setStep(Number(number))}
                className={
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ' +
                  (step >= Number(number)
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-300 bg-white text-slate-400')
                }
              >
                {number}
              </button>
              <span className="ml-2 hidden text-xs font-medium text-slate-500 sm:inline">{label}</span>
              {index < 3 && (
                <span className={'mx-3 h-px flex-1 ' + (step > Number(number) ? 'bg-slate-950' : 'bg-slate-300')} />
              )}
            </div>
          ))}
        </div>

        <section className="mt-7 border border-slate-200 bg-white p-5 sm:p-7">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold">Vehicle information</h2>
              <p className="mt-1 text-sm text-slate-500">Use the vehicle you intend to operate through DENUEL.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {VEHICLE_TYPES.map(([id, label, description]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm({ ...form, vehicleType: id })}
                    className={
                      'border p-4 text-left transition ' +
                      (form.vehicleType === id
                        ? 'border-slate-950 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400')
                    }
                  >
                    <div className="font-semibold">{label}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Make
                  <input value={form.vehicleMake} onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })} placeholder="e.g. Toyota" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Model
                  <input value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} placeholder="e.g. Corolla" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Year
                  <input type="number" min="1980" max={new Date().getFullYear() + 1} value={form.vehicleYear} onChange={(e) => setForm({ ...form, vehicleYear: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Colour
                  <input value={form.vehicleColor} onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })} placeholder="e.g. White" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Plate number
                  <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })} placeholder="e.g. ABC 1234" className="mt-2 h-11 w-full border border-slate-300 px-3 uppercase" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Cargo capacity in kg (optional)
                  <input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="For cargo vehicles" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
              </div>

              <div className="mt-7 flex justify-end">
                <button type="button" disabled={!stepOneReady} onClick={() => setStep(2)} className="bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold">Driver information</h2>
              <p className="mt-1 text-sm text-slate-500">These details are used during trust and safety review.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  NRC number
                  <input value={form.nrcNumber} onChange={(e) => setForm({ ...form, nrcNumber: e.target.value })} placeholder="e.g. 123456/10/1" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Driver’s licence number
                  <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Driving experience
                  <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3">
                    <option value="">Select experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-2 years">1–2 years</option>
                    <option value="3-5 years">3–5 years</option>
                    <option value="5-10 years">5–10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  About your driving work (optional)
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} maxLength={3000} placeholder="Experience, types of transport work and relevant professional background." className="mt-2 w-full border border-slate-300 p-3" />
                </label>
              </div>

              <div className="mt-7 flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Back</button>
                <button type="button" disabled={!stepTwoReady} onClick={() => setStep(3)} className="bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold">Service areas</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the cities where you are genuinely available to accept transport work.</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ZAMBIAN_CITIES.map((city) => (
                  <label key={city} className={'flex cursor-pointer items-center gap-2 border p-3 text-sm ' + (form.serviceAreas.includes(city) ? 'border-slate-950 bg-slate-50' : 'border-slate-200')}>
                    <input type="checkbox" checked={form.serviceAreas.includes(city)} onChange={() => toggleArea(city)} />
                    <span>{city}</span>
                  </label>
                ))}
              </div>

              <div className="mt-7 flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Back</button>
                <button type="button" disabled={!form.serviceAreas.length} onClick={() => setStep(4)} className="bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold">Private verification documents</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                All five documents are required for driver approval. Files are stored privately and can be opened only by your account and authorised DENUEL administrators.
              </p>

              <div className="mt-5 divide-y divide-slate-100 border border-slate-200">
                {REQUIRED_DOCUMENTS.map(([type, label, description]) => (
                  <div key={type} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-center">
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    <label className="block text-sm font-medium text-slate-700">
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.size > 10 * 1024 * 1024) {
                            setError(label + ' must be 10MB or smaller.');
                            e.currentTarget.value = '';
                            return;
                          }
                          setDocuments((current) => ({ ...current, [type]: file }));
                        }}
                        className="block w-full border border-slate-300 p-2 text-xs"
                      />
                      <span className="mt-1 block text-xs text-slate-400">
                        {documents[type]?.name || 'PDF, JPG, PNG or WEBP · max 10MB'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              {uploadProgress && (
                <div className="mt-4 border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {uploadProgress}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <button type="button" disabled={loading} onClick={() => setStep(3)} className="border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40">Back</button>
                <button type="button" disabled={loading || !allDocumentsSelected} onClick={submitApplication} className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
                  {loading ? 'Submitting application…' : 'Submit driver application'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold">Approval is not automatic</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your driver account remains offline until an administrator reviews the required private documents and approves the application.
          </p>
        </section>
      </main>
    </div>
  );
}
