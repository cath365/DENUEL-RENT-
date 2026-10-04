"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login } from '../../../lib/api';

function safeRedirect(value: string | null) {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

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
    } else if (searchParams.get('reason') === 'session') {
      setNotice('Your session expired. Sign in again to continue.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setError(typeof res.error === 'string' ? res.error : 'Unable to sign in.');
        return;
      }

      const redirect = safeRedirect(searchParams.get('redirect'));
      if (redirect) {
        window.location.assign(redirect);
        return;
      }

      const role = res?.user?.role;
      if (role === 'DRIVER') window.location.assign('/driver');
      else if (role === 'SERVICE_PROVIDER') window.location.assign('/services/dashboard');
      else if (role === 'LANDLORD' || role === 'AGENT') window.location.assign('/dashboard/properties');
      else if (role === 'ADMIN') window.location.assign('/admin');
      else window.location.assign('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="hidden border-r border-slate-200 bg-white p-12 lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="text-xl font-bold tracking-[-0.03em]">DENUEL</Link>

          <div className="max-w-xl">
            <p className="text-sm font-semibold text-blue-700">One account, the right workspace</p>
            <h1 className="mt-3 text-5xl font-bold leading-tight tracking-[-0.045em]">
              Property, services and transport in one place.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in to continue with saved properties, enquiries, listings, service work, transport requests and account tools.
            </p>
          </div>

          <div className="text-sm text-slate-400">DENUEL · Zambia</div>
        </section>

        <section className="flex items-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-xl font-bold tracking-[-0.03em]">DENUEL</Link>
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-950">Home</Link>
            </div>

            <p className="text-sm font-semibold text-blue-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Sign in to DENUEL</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              We’ll open the dashboard that matches your account.
            </p>

            {notice && (
              <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {notice}
              </div>
            )}

            {error && (
              <div role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-950"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || password.length < 8}
                className="h-12 w-full bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-600">
                New to DENUEL?{' '}
                <Link href="/auth/register" className="font-semibold text-blue-700 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            <div className="mt-6 text-xs leading-5 text-slate-400">
              Your account role is used to open the correct renter, owner, agent, service-provider, driver or admin workspace.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
