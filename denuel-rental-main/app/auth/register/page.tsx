"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const accountTypes = [
  { id: 'USER', title: 'Renter or buyer', description: 'Save properties, send enquiries and manage applications.' },
  { id: 'LANDLORD', title: 'Property owner', description: 'List property and manage tenants, leases and payments.' },
  { id: 'AGENT', title: 'Real estate agent', description: 'Manage listings and work with property clients.' },
] as const;

const serviceTypes = [
  ['DRIVER', 'Driver / transport', 'Passenger transport, deliveries and moving support.'],
  ['CLEANER', 'Cleaning', 'Home, office and move-in / move-out cleaning.'],
  ['ELECTRICIAN', 'Electrical', 'Electrical installation, repairs and maintenance.'],
  ['PLUMBER', 'Plumbing', 'Plumbing installation, repairs and emergency work.'],
  ['SECURITY', 'Security', 'Guards, patrol, CCTV, alarms and related security services.'],
  ['MOVER', 'Moving', 'Home and office moving, packing and furniture transport.'],
  ['LANDSCAPER', 'Gardening & landscaping', 'Garden maintenance, lawns and landscaping.'],
  ['PAINTER', 'Painting', 'Interior and exterior painting services.'],
  ['CONTRACTOR', 'Construction / contractor', 'Building, renovation and general property works.'],
  ['PEST_CONTROL', 'Pest control', 'Pest treatment and prevention services.'],
  ['HOME_INSPECTOR', 'Home inspection', 'Property inspection and condition checks.'],
  ['INTERIOR_DESIGNER', 'Interior design', 'Interior planning, styling and space design.'],
  ['OTHER', 'Other property service', 'Another professional property-related service.'],
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<'general' | 'service'>('general');
  const [accountType, setAccountType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedLabel = useMemo(() => {
    if (category === 'general') {
      return accountTypes.find((type) => type.id === accountType)?.title || 'Property account';
    }
    return serviceTypes.find(([id]) => id === serviceType)?.[1] || 'Service provider';
  }, [accountType, category, serviceType]);

  const chooseCategory = (value: 'general' | 'service') => {
    setCategory(value);
    setAccountType('');
    setServiceType('');
    setError('');
    setStep(2);
  };

  const chooseType = (value: string) => {
    if (category === 'general') setAccountType(value);
    else setServiceType(value);
    setError('');
    setStep(3);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const role =
        category === 'general'
          ? accountType
          : serviceType === 'DRIVER'
            ? 'DRIVER'
            : 'SERVICE_PROVIDER';

      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role,
      };

      if (category === 'service' && serviceType !== 'DRIVER') {
        payload.serviceType = serviceType;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok || data?.error) {
        setError(typeof data.error === 'string' ? data.error : text || 'Registration failed.');
        return;
      }

      if (category === 'service') {
        if (serviceType === 'DRIVER') {
          router.push('/driver/apply');
        } else {
          router.push('/services/register');
        }
      } else if (accountType === 'LANDLORD' || accountType === 'AGENT') {
        router.push('/dashboard/properties');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <Link href="/" className="text-xl font-bold tracking-[-0.03em]">DENUEL</Link>
          <Link href="/auth/login" className="text-sm font-semibold text-blue-700 hover:underline">
            Already have an account? Sign in
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="mb-8 flex items-center">
            {[1, 2, 3].map((number) => (
              <div key={number} className="flex flex-1 items-center last:flex-none">
                <span
                  className={
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ' +
                    (step >= number
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-400')
                  }
                >
                  {number}
                </span>
                {number < 3 && (
                  <span className={'mx-3 h-px flex-1 ' + (step > number ? 'bg-slate-950' : 'bg-slate-300')} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <section>
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-blue-700">Create an account</p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  How will you use DENUEL?
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  Choose the account path that matches what you want to do. You can still use the rest of the marketplace after signing in.
                </p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => chooseCategory('general')}
                  className="border border-slate-300 bg-white p-6 text-left transition hover:border-slate-950 hover:bg-slate-50"
                >
                  <div className="text-lg font-semibold">Property account</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    For renters, buyers, landlords and real estate agents.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => chooseCategory('service')}
                  className="border border-slate-300 bg-white p-6 text-left transition hover:border-slate-950 hover:bg-slate-50"
                >
                  <div className="text-lg font-semibold">Services & transport</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    For service professionals, companies and drivers working through DENUEL.
                  </p>
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-950"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-bold tracking-[-0.035em]">
                {category === 'general' ? 'What best describes you?' : 'What do you provide?'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This choice sets up the right dashboard and onboarding flow.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {category === 'general'
                  ? accountTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => chooseType(type.id)}
                        className="border border-slate-300 bg-white p-5 text-left transition hover:border-slate-950 hover:bg-slate-50"
                      >
                        <div className="font-semibold">{type.title}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{type.description}</p>
                      </button>
                    ))
                  : serviceTypes.map(([id, label, description]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => chooseType(id)}
                        className="border border-slate-300 bg-white p-5 text-left transition hover:border-slate-950 hover:bg-slate-50"
                      >
                        <div className="font-semibold">{label}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                      </button>
                    ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-950"
                >
                  ← Back
                </button>

                <h1 className="text-3xl font-bold tracking-[-0.035em]">Your account details</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Use details you can access again when signing in.
                </p>

                {error && (
                  <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="mt-7 space-y-5">
                  <label className="block text-sm font-medium text-slate-700">
                    Full name
                    <input
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="mt-2 h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input
                      required
                      autoComplete="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-2 h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Phone number
                    <input
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+260 97X XXX XXX"
                      className="mt-2 h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950"
                    />
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative mt-2">
                      <input
                        required
                        minLength={8}
                        autoComplete="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Create a password"
                        className="h-12 w-full border border-slate-300 bg-white px-4 pr-16 text-sm outline-none focus:border-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-950"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !form.name || !form.email || form.password.length < 8}
                    className="h-12 w-full bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>
              </div>

              <aside className="h-fit border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account setup</div>
                <div className="mt-2 text-lg font-semibold">{selectedLabel}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {category === 'service' && serviceType !== 'DRIVER'
                    ? 'After account creation, you will complete a professional service profile and verification.'
                    : serviceType === 'DRIVER'
                      ? 'After account creation, you will complete the driver and vehicle verification process.'
                      : 'After account creation, you will go directly to the correct property dashboard.'}
                </p>
                <div className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                  DENUEL uses your account role only to open the correct tools and onboarding flow.
                </div>
              </aside>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
