"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ACCOUNT_TYPES = [
  { 
    id: 'USER', 
    title: 'Renter / Buyer',
    description: 'Looking for a place to rent or buy',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    id: 'LANDLORD', 
    title: 'Landlord / Property Owner',
    description: 'List and manage your properties',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    id: 'AGENT', 
    title: 'Real Estate Agent',
    description: 'Help clients find properties',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
];

const SERVICE_TYPES = [
  { 
    id: 'DRIVER', 
    title: 'Driver',
    description: 'Provide transportation services',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v4m-4-4h8m-8-8V3a1 1 0 011-1h6a1 1 0 011 1v4M5 21h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    id: 'MAID', 
    title: 'Maid / Housekeeper',
    description: 'Household cleaning & management',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  { 
    id: 'CLEANER', 
    title: 'Professional Cleaner',
    description: 'Deep cleaning & sanitation',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  { 
    id: 'ELECTRICIAN', 
    title: 'Electrician',
    description: 'Electrical repairs & installations',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    id: 'PLUMBER', 
    title: 'Plumber',
    description: 'Plumbing repairs & installations',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  { 
    id: 'SECURITY', 
    title: 'Security Guard',
    description: 'Property security services',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  { 
    id: 'MOVER', 
    title: 'Mover / Moving Company',
    description: 'Help with relocations',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
      </svg>
    )
  },
  { 
    id: 'GARDENER', 
    title: 'Gardener / Landscaper',
    description: 'Garden & lawn maintenance',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  { 
    id: 'PAINTER', 
    title: 'Painter',
    description: 'Interior & exterior painting',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [accountCategory, setAccountCategory] = useState<'general' | 'service'>('general');
  const [accountType, setAccountType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleCategorySelect = (category: 'general' | 'service') => {
    setAccountCategory(category);
    setAccountType('');
    setServiceType('');
    setStep(2);
  };

  const handleTypeSelect = (type: string) => {
    if (accountCategory === 'general') {
      setAccountType(type);
    } else {
      setServiceType(type);
    }
    setStep(3);
  };

  const getFinalRole = () => {
    if (accountCategory === 'general') {
      return accountType;
    }
    return 'SERVICE_PROVIDER';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const role = getFinalRole();
      const payload: any = { 
        name, 
        email, 
        password, 
        phone,
        role,
      };
      
      if (accountCategory === 'service') {
        payload.serviceType = serviceType;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Server error. Please try again.');
        setLoading(false);
        return;
      }
      
      if (!res.ok || data?.error) {
        setError(typeof data.error === 'string' ? data.error : 'Registration failed');
        setLoading(false);
        return;
      }
      
      if (accountCategory === 'service') {
        if (serviceType === 'DRIVER') {
          router.push('/driver/apply');
        } else {
          router.push('/services/apply?type=' + serviceType.toLowerCase());
        }
      } else if (accountType === 'LANDLORD' || accountType === 'AGENT') {
        router.push('/dashboard/properties');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      setLoading(false);
    }
  }

  const getSelectedTypeName = () => {
    if (accountCategory === 'general') {
      return ACCOUNT_TYPES.find(t => t.id === accountType)?.title || '';
    }
    return SERVICE_TYPES.find(t => t.id === serviceType)?.title || '';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo / Back to Home */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-2xl font-bold">RentApp</span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Choose Category */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Create your account</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">What brings you to RentApp?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleCategorySelect('general')}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                  <svg className="w-8 h-8 text-blue-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Looking for Property</h3>
                <p className="text-gray-600 dark:text-gray-400">I want to rent, buy, or list properties</p>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Renter</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Buyer</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Landlord</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Agent</span>
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect('service')}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
              >
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                  <svg className="w-8 h-8 text-purple-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Offer Services</h3>
                <p className="text-gray-600 dark:text-gray-400">I provide professional services</p>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Driver</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Maid</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-2">Cleaner</span>
                  <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">+6 more</span>
                </div>
              </button>
            </div>

            <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-green-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Choose Specific Type */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <h1 className="text-3xl font-bold text-center mb-2">
              {accountCategory === 'general' ? 'What describes you best?' : 'What service do you offer?'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              {accountCategory === 'general' 
                ? 'Select your primary role on the platform'
                : 'Choose your professional service category'}
            </p>
            
            <div className={`grid gap-4 ${accountCategory === 'service' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
              {(accountCategory === 'general' ? ACCOUNT_TYPES : SERVICE_TYPES).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="group p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 dark:group-hover:bg-green-900/30 transition-colors">
                    {type.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{type.title}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Account Details */}
        {step === 3 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {getSelectedTypeName()}
                </div>
                <h1 className="text-2xl font-bold mb-2">Complete your profile</h1>
                <p className="text-gray-600 dark:text-gray-400">Enter your details to create your account</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    placeholder="Enter your full name" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    placeholder="you@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    placeholder="+260 97X XXX XXX" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={8}
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16" 
                      placeholder="Min. 8 characters" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword((s) => !s)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {accountCategory === 'service' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Service Provider Note</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          After registration, you&apos;ll need to complete your service application and upload required documents for verification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || !email || !password || !name || !phone} 
                  className="w-full bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    accountCategory === 'service' ? 'Create Account & Continue to Application' : 'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-green-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}