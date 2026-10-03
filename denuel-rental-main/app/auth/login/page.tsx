"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '../../../lib/api';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success message for newly registered service providers
    if (searchParams.get('registered') === 'service_provider') {
      setSuccessMessage('🎉 Registration successful! Please sign in to access your dashboard.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password: password.trim() });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      
      // Use window.location for full page reload to ensure cookies are properly sent
      // Check for redirect parameter first
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      
      // Redirect users based on their role to their appropriate dashboard
      const role = res?.user?.role;
      switch (role) {
        case 'DRIVER':
          window.location.href = '/driver';
          break;
        case 'SERVICE_PROVIDER':
          window.location.href = '/services/dashboard';
          break;
        case 'LANDLORD':
        case 'AGENT':
          window.location.href = '/dashboard/properties';
          break;
        case 'ADMIN':
          window.location.href = '/admin';
          break;
        default:
          // Regular users (renters/buyers)
          window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
          <div className="space-y-4 text-center">
            <svg className="mx-auto w-20 h-20 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12l2-2 4 4 8-8 4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-2xl font-bold">Welcome back</h3>
            <p className="opacity-90 max-w-xs mx-auto">Sign in to manage your applications, saved searches, and messages.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <a href="/" className="text-sm text-gray-500 hover:underline">Back to home</a>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
              {successMessage}
            </div>
          )}

          {error && <div role="alert" aria-live="assertive" className="text-sm text-red-600 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                aria-required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a href="/auth/register" className="text-sm text-blue-600 hover:underline">Create an account</a>
              <a href="/" className="text-sm text-gray-500 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium disabled:opacity-60 transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}