"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const accountTypes = [
  { id: 'USER', title: 'Renter or buyer', description: 'Save properties, enquire and manage applications.' },
  { id: 'LANDLORD', title: 'Property owner', description: 'List property and manage tenants, leases and payments.' },
  { id: 'AGENT', title: 'Real estate agent', description: 'Manage listings and work with property clients.' },
];

const serviceTypes = [
  ['DRIVER', 'Driver'],
  ['CLEANER', 'Cleaner'],
  ['ELECTRICIAN', 'Electrician'],
  ['PLUMBER', 'Plumber'],
  ['SECURITY', 'Security'],
  ['MOVER', 'Mover'],
  ['GARDENER', 'Gardener'],
  ['PAINTER', 'Painter'],
  ['MAID', 'Housekeeper'],
];

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

  const chooseCategory = (value: 'general' | 'service') => {
    setCategory(value);
    setAccountType('');
    setServiceType('');
    setStep(2);
  };

  const chooseType = (value: string) => {
    if (category === 'general') setAccountType(value);
    else setServiceType(value);
    setStep(3);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        ...form,
        role: category === 'general' ? accountType : 'SERVICE_PROVIDER',
      };
      if (category === 'service') payload.serviceType = serviceType;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setError(typeof data.error === 'string' ? data.error : 'Registration failed.');
        return;
      }

      if (category === 'service') {
        if (serviceType === 'DRIVER') router.push('/driver/apply');
        else router.push('/services/apply?type=' + serviceType.toLowerCase());
      } else if (accountType === 'LANDLORD' || accountType === 'AGENT') {
        router.push('/dashboard/properties');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-slate-950">DENUEL</Link>
          <Link href="/auth/login" className="text-sm font-semibold text-blue-700">Already have an account? Sign in</Link>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="mb-8 flex items-center gap-3 text-sm">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold ${step >= n ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>{n}</span>
                {n < 3 && <span className="h-px w-8 bg-slate-300 sm:w-16" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <section>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Create your DENUEL account</h1>
              <p className="mt-2 text-sm text-slate-500">Choose how you plan to use the platform.</p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <button onClick={() => chooseCategory('general')} className="border border-slate-300 bg-white p-6 text-left transition hover:border-slate-950">
                  <div className="text-lg font-semibold text-slate-950">Property account</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">For renters, buyers, landlords and real estate agents.</p>
                </button>
                <button onClick={() => chooseCategory('service')} className="border border-slate-300 bg-white p-6 text-left transition hover:border-slate-950">
                  <div className="text-lg font-semibold text-slate-950">Service provider account</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">For professionals offering property-related services.</p>
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <button onClick={() => setStep(1)} className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-950">← Back</button>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">
                {category === 'general' ? 'What best describes you?' : 'What service do you provide?'}
              </h1>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {category === 'general'
                  ? accountTypes.map((type) => (
                      <button key={type.id} onClick={() => chooseType(type.id)} className="border border-slate-300 bg-white p-5 text-left transition hover:border-slate-950">
                        <div className="font-semibold text-slate-950">{type.title}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{type.description}</p>
                      </button>
                    ))
                  : serviceTypes.map(([id, label]) => (
                      <button key={id} onClick={() => chooseType(id)} className="border border-slate-300 bg-white p-4 text-left text-sm font-semibold text-slate-800 transition hover:border-slate-950">
                        {label}
                      </button>
                    ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="max-w-xl">
              <button onClick={() => setStep(2)} className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-950">← Back</button>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Your account details</h1>
              <p className="mt-2 text-sm text-slate-500">Use information you can access again when signing in.</p>

              {error && <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <form onSubmit={submit} className="mt-7 space-y-4">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950" />
                <div className="relative">
                  <input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="h-12 w-full border border-slate-300 bg-white px-4 pr-16 text-sm outline-none focus:border-slate-950" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">{showPassword ? 'Hide' : 'Show'}</button>
                </div>

                <button disabled={loading} className="h-12 w-full bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
