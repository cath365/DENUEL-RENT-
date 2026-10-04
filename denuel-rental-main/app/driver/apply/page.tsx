'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';
import { TRANSPORT_IMAGES } from '../../../lib/transport/vehicleImages';
import { csrfFetch } from '../../../lib/csrf';

type VehicleType =
  | 'MOTORBIKE'
  | 'CAR'
  | 'SUV'
  | 'VAN'
  | 'TRUCK_SMALL'
  | 'TRUCK_MEDIUM'
  | 'TRUCK_LARGE';

type VehicleOption = {
  id: VehicleType;
  label: string;
  description: string;
  image?: string;
  capacityHint?: string;
};

const VEHICLE_TYPES: VehicleOption[] = [
  {
    id: 'MOTORBIKE',
    label: 'Motorbike',
    description: 'Passenger trips and light deliveries.',
    image: TRANSPORT_IMAGES.motorbike,
  },
  {
    id: 'CAR',
    label: 'Car / Taxi',
    description: 'Standard passenger transport.',
    image: TRANSPORT_IMAGES.taxi,
  },
  {
    id: 'SUV',
    label: 'SUV / 4x4',
    description: 'More passenger and luggage space.',
    image: TRANSPORT_IMAGES.suv,
  },
  {
    id: 'VAN',
    label: 'Van / Minibus',
    description: 'Group travel or medium cargo.',
  },
  {
    id: 'TRUCK_SMALL',
    label: 'Small Truck',
    description: 'Small moving and delivery jobs.',
    image: TRANSPORT_IMAGES.small_truck,
  },
  {
    id: 'TRUCK_MEDIUM',
    label: 'Medium Truck',
    description: 'Household and business moves.',
    image: TRANSPORT_IMAGES.medium_truck,
  },
  {
    id: 'TRUCK_LARGE',
    label: 'Large Truck',
    description: 'Large moves and heavier loads.',
    image: TRANSPORT_IMAGES.medium_truck,
  },
];

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

type DriverDocument = {
  type: 'nrc' | 'license' | 'vehicle_reg' | 'insurance' | 'clearance';
  label: string;
  help: string;
  file: File | null;
};

export default function DriverApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nrcNumber: '',
    licenseNumber: '',
    vehicleType: '' as VehicleType | '',
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

  const [documents, setDocuments] = useState<DriverDocument[]>([
    {
      type: 'nrc',
      label: 'NRC / National ID',
      help: 'Clear copy of the applicant’s identity document.',
      file: null,
    },
    {
      type: 'license',
      label: "Driver's licence",
      help: 'Current driving licence appropriate for the vehicle class.',
      file: null,
    },
    {
      type: 'vehicle_reg',
      label: 'Vehicle registration / Blue Book',
      help: 'Document showing the vehicle registration details.',
      file: null,
    },
    {
      type: 'insurance',
      label: 'Vehicle insurance',
      help: 'Current insurance evidence for the vehicle.',
      file: null,
    },
    {
      type: 'clearance',
      label: 'Police clearance / background check',
      help: 'Background-check document for driver verification.',
      file: null,
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function checkAccount() {
      try {
        const meRes = await fetch('/api/auth/me');
        const me = await meRes.json().catch(() => ({ user: null }));

        if (!cancelled && meRes.ok && me?.user) {
          setSignedIn(true);
          setFormData((current) => ({
            ...current,
            fullName: me.user.name || '',
            email: me.user.email || '',
            phone: me.user.phone || '',
          }));

          const profileRes = await fetch('/api/driver/profile');
          const profileData = await profileRes.json().catch(() => ({}));

          if (profileRes.ok && profileData?.profile) {
            setExistingProfile(true);
          }
        }
      } catch {
        // Account state is handled by the sign-in prompt below.
      } finally {
        if (!cancelled) setCheckingAccount(false);
      }
    }

    checkAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVehicle = useMemo(
    () => VEHICLE_TYPES.find((vehicle) => vehicle.id === formData.vehicleType),
    [formData.vehicleType]
  );

  function updateField(name: string, value: string) {
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function toggleArea(city: string) {
    setFormData((current) => ({
      ...current,
      serviceAreas: current.serviceAreas.includes(city)
        ? current.serviceAreas.filter((area) => area !== city)
        : [...current.serviceAreas, city],
    }));
  }

  function setDocument(index: number, file: File | null) {
    setDocuments((current) =>
      current.map((document, i) => (i === index ? { ...document, file } : document))
    );
  }

  function canContinueStep1() {
    return Boolean(
      formData.vehicleType &&
      formData.vehicleMake.trim() &&
      formData.vehicleModel.trim() &&
      formData.vehicleYear &&
      formData.vehiclePlate.trim() &&
      formData.vehicleColor.trim()
    );
  }

  function canContinueStep2() {
    return Boolean(
      formData.fullName.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.nrcNumber.trim() &&
      formData.licenseNumber.trim() &&
      formData.experience
    );
  }

  async function uploadDocument(document: DriverDocument) {
    if (!document.file) throw new Error(`${document.label} is required.`);

    const form = new FormData();
    form.append('file', document.file);
    form.append(
      'key',
      'driver-verification/' +
        document.type +
        '-' +
        Date.now() +
        '-' +
        document.file.name.replace(/\s+/g, '-')
    );

    const response = await csrfFetch('/api/uploads/direct', {
      method: 'POST',
      body: form,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.publicUrl) {
      throw new Error(data.error || `Could not upload ${document.label}.`);
    }

    return {
      type: document.type,
      url: data.publicUrl,
      name: document.file.name,
    };
  }

  async function handleSubmit() {
    if (!signedIn) {
      setError('Sign in before submitting a driver application.');
      return;
    }

    if (documents.some((document) => !document.file)) {
      setError('Upload every required verification document before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadedDocs = [];

      for (let i = 0; i < documents.length; i += 1) {
        const document = documents[i];
        setUploadProgress(`Uploading ${i + 1} of ${documents.length}: ${document.label}`);
        uploadedDocs.push(await uploadDocument(document));
      }

      setUploadProgress('Saving driver application…');

      const response = await csrfFetch('/api/driver/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          nrcNumber: formData.nrcNumber.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          vehicleType: formData.vehicleType,
          vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
          vehicleMake: formData.vehicleMake.trim(),
          vehicleModel: formData.vehicleModel.trim(),
          vehicleYear: Number(formData.vehicleYear),
          vehicleColor: formData.vehicleColor.trim(),
          vehicleCapacityKg: formData.capacity ? Number(formData.capacity) : undefined,
          experience: formData.experience,
          bio: formData.bio.trim() || undefined,
          serviceAreas: formData.serviceAreas,
          documents: uploadedDocs,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit the driver application.');
      }

      router.push('/driver/apply/success');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit the driver application.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  if (checkingAccount) {
    return (
      <main className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="h-72 animate-pulse border border-slate-200 bg-white" />
        </div>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="border border-slate-200 bg-white p-7">
            <p className="text-sm font-semibold text-[#16A34A]">Ng’anda Transport</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#0F2B46]">
              Sign in before applying as a driver
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your application contains private identity, licence and vehicle documents, so it must be linked to a verified Ng’anda account.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth/login?redirect=/driver/apply"
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register?redirect=/driver/apply"
                className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (existingProfile) {
    return (
      <main className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="border border-slate-200 bg-white p-7">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#0F2B46]">
              Driver profile already exists
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use your driver dashboard to review the application status and manage your transport profile.
            </p>
            <Link href="/driver" className="mt-6 inline-flex bg-[#0F2B46] px-5 py-3 text-sm font-semibold text-white">
              Open driver dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const progressLabels = ['Vehicle', 'Driver', 'Coverage', 'Documents'];

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_260px] md:items-center">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Ng’anda Transport Provider</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#0F2B46] sm:text-4xl">
              Register your vehicle and driver profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Enter real vehicle details and submit the required documents. The profile remains pending until an administrator completes verification.
            </p>
          </div>

          <div className="flex min-h-36 items-center justify-center border border-slate-200 bg-[#F8F9FA] p-4">
            {selectedVehicle?.image ? (
              <img src={selectedVehicle.image} alt="" className="max-h-32 w-full object-contain" />
            ) : (
              <img src={TRANSPORT_IMAGES.taxi} alt="" className="max-h-32 w-full object-contain" />
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-7 grid grid-cols-4 border border-slate-200 bg-white">
          {progressLabels.map((label, index) => {
            const number = index + 1;
            return (
              <div
                key={label}
                className={`border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${
                  step === number ? 'bg-[#0F2B46] text-white' : step > number ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">{step > number ? '✓' : number}</div>
                <div className="mt-1 text-[11px] font-medium sm:text-xs">{label}</div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold text-[#0F2B46]">1. Vehicle information</h2>
            <p className="mt-2 text-sm text-slate-500">
              Select the exact vehicle type you will use on Ng’anda.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VEHICLE_TYPES.map((vehicle) => (
                <button
                  type="button"
                  key={vehicle.id}
                  onClick={() => updateField('vehicleType', vehicle.id)}
                  className={`min-h-44 border p-3 text-left transition ${
                    formData.vehicleType === vehicle.id
                      ? 'border-[#16A34A] bg-emerald-50/40'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex h-24 items-center justify-center bg-[#F8F9FA]">
                    {vehicle.image ? (
                      <img src={vehicle.image} alt="" className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="text-xs font-medium text-slate-400">Image coming soon</div>
                    )}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-950">{vehicle.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{vehicle.description}</div>
                </button>
              ))}
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Vehicle make *</label>
                <input
                  value={formData.vehicleMake}
                  onChange={(e) => updateField('vehicleMake', e.target.value)}
                  placeholder="e.g. Toyota"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Vehicle model *</label>
                <input
                  value={formData.vehicleModel}
                  onChange={(e) => updateField('vehicleModel', e.target.value)}
                  placeholder="e.g. Corolla"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Year *</label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicleYear}
                  onChange={(e) => updateField('vehicleYear', e.target.value)}
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Colour *</label>
                <input
                  value={formData.vehicleColor}
                  onChange={(e) => updateField('vehicleColor', e.target.value)}
                  placeholder="e.g. White"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Registration / plate number *</label>
                <input
                  value={formData.vehiclePlate}
                  onChange={(e) => updateField('vehiclePlate', e.target.value)}
                  placeholder="e.g. ABC 1234"
                  className="h-11 w-full border border-slate-300 px-3 text-sm uppercase outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Load capacity (kg) <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => updateField('capacity', e.target.value)}
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canContinueStep1()}
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold text-[#0F2B46]">2. Driver information</h2>
            <p className="mt-2 text-sm text-slate-500">
              These details are linked to the signed-in account and verification documents.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Full name *</label>
                <input
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">NRC number *</label>
                <input
                  value={formData.nrcNumber}
                  onChange={(e) => updateField('nrcNumber', e.target.value)}
                  placeholder="123456/10/1"
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="h-11 w-full border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">Uses the email on your signed-in Ng’anda account.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Phone *</label>
                <input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+260..."
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Driver's licence number *</label>
                <input
                  value={formData.licenseNumber}
                  onChange={(e) => updateField('licenseNumber', e.target.value)}
                  className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Driving experience *</label>
                <select
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
                >
                  <option value="">Select experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Professional summary <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Describe your driving experience and transport work."
                  className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Back</button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canContinueStep2()}
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold text-[#0F2B46]">3. Service coverage</h2>
            <p className="mt-2 text-sm text-slate-500">
              Select only the cities where you genuinely provide transport.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {ZAMBIAN_CITIES.map((city) => (
                <button
                  type="button"
                  key={city}
                  onClick={() => toggleArea(city)}
                  className={`border px-3 py-3 text-sm font-medium transition ${
                    formData.serviceAreas.includes(city)
                      ? 'border-[#16A34A] bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="mt-7 flex justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Back</button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={formData.serviceAreas.length === 0}
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold text-[#0F2B46]">4. Verification documents</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              All five items are required. They are stored for admin verification and are not displayed publicly.
            </p>

            <div className="mt-6 divide-y divide-slate-100 border border-slate-200">
              {documents.map((document, index) => (
                <div key={document.type} className="grid gap-3 p-4 sm:grid-cols-[1fr_250px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{document.label} *</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{document.help}</div>
                    {document.file && (
                      <div className="mt-2 text-xs font-medium text-emerald-700">{document.file.name}</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.pdf"
                    onChange={(e) => setDocument(index, e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:border-0 file:bg-[#0F2B46] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-slate-600">
              Submission does not mean automatic approval. An administrator must review the identity, driver licence, vehicle registration, insurance and background-check documents before the driver can receive transport requests.
            </div>

            {uploadProgress && (
              <div className="mt-5 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {uploadProgress}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={loading}
                className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || documents.some((document) => !document.file)}
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Submitting application…' : 'Submit for verification'}
              </button>
            </div>
          </section>
        )}

        <div className="mt-6 border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-[#0F2B46]">Need help?</h3>
          <p className="mt-2 text-sm text-slate-600">
            If you have trouble with the application, use Ng’anda support. No unconfigured phone numbers or email addresses are shown here.
          </p>
          <Link href="/contact-support" className="mt-3 inline-flex text-sm font-semibold text-[#16A34A]">
            Contact support →
          </Link>
        </div>
      </div>
    </main>
  );
}
