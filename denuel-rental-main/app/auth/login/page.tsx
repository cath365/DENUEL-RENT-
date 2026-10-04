"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login } from '../../../lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'service_provider') {
      setNotice('Registration complete. Sign in to continue.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email: email.trim(), password });

      if (res?.error) {
        setError(res.error);
        return;
      }

      const redirect = searchParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
        return;
      }

      const role = res?.user?.role;
      if (role === 'DRIVER') window.location.href = '/driver';
      else if (role === 'SERVICE_PROVIDER') window.location.href = '/services/dashboard';
      else if (role === 'LANDLORD' || role === 'AGENT') window.location.href = '/dashboard/properties';
      else if (role === 'ADMIN') window.location.href = '/admin';
      else window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_480px]">
        <section className="hidden border-r border-slate-200 bg-white p-12 lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-slate-950">DENUEL</Link>
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-blue-700">Your property account</p>
            <h1 className="mt-3 text-5xl font-bold leading-tight tracking-[-0.045em] text-slate-950">
              Keep your property search and management in one place.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Access saved properties, enquiries, applications, listings and account tools from one secure dashboard.
            </p>
          </div>
          <p className="text-sm text-slate-400">DENUEL · Zambia</p>
        </section>

        <section className="flex items-center px-5 py-12 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-slate-950">DENUEL</Link>
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use the email and password linked to your account.</p>

            {notice && <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
            {error && <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs font-medium text-slate-500 hover:text-slate-950">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="h-12 w-full bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/auth/register" className="font-semibold text-blue-700 hover:underline">Create account</Link>
              <Link href="/" className="text-slate-500 hover:text-slate-950">Back to home</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><LoginContent /></Suspense>;
}
