"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SERVICE_CATEGORIES = [
  { value: 'GARDENER', label: 'Garden & Landscaping', icon: '🌿', description: 'Lawn care, gardening, landscaping services' },
  { value: 'LANDSCAPER', label: 'Landscaping', icon: '🏡', description: 'Professional landscaping and outdoor design' },
  { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐛', description: 'Pest extermination and prevention' },
  { value: 'MOVER', label: 'Moving Services', icon: '🚚', description: 'Home and office moving, packing services' },
  { value: 'CLEANER', label: 'Cleaning Services', icon: '🧹', description: 'Home and office cleaning' },
  { value: 'MAID', label: 'Maid Services', icon: '🏠', description: 'Domestic help and housekeeping' },
  { value: 'PAINTER', label: 'Painting', icon: '🎨', description: 'Interior and exterior painting' },
  { value: 'PLUMBER', label: 'Plumbing', icon: '🔧', description: 'Plumbing repairs and installations' },
  { value: 'SECURITY', label: 'Security Services', icon: '🛡️', description: 'Home security, guards, and systems' },
  { value: 'INTERIOR_DESIGNER', label: 'Interior Design', icon: '🪑', description: 'Interior design and decoration' },
  { value: 'ELECTRICIAN', label: 'Electrical', icon: '⚡', description: 'Electrical repairs and installations' },
  { value: 'CONTRACTOR', label: 'General Contractor', icon: '🔨', description: 'General construction and repairs' },
  { value: 'HOME_INSPECTOR', label: 'Home Inspection', icon: '🔍', description: 'Property inspection services' },
  { value: 'HVAC', label: 'HVAC', icon: '❄️', description: 'Heating, ventilation, and air conditioning' },
  { value: 'ROOFING', label: 'Roofing', icon: '🏗️', description: 'Roof repairs and installations' },
  { value: 'FLOORING', label: 'Flooring', icon: '🪵', description: 'Floor installation and repairs' },
  { value: 'PHOTOGRAPHER', label: 'Photography', icon: '📷', description: 'Property and event photography' },
  { value: 'OTHER', label: 'Other Services', icon: '🛠️', description: 'Other home services' },
];

const CITIES = [
  'Lusaka',
  'Kitwe',
  'Ndola',
  'Livingstone',
  'Kabwe',
  'Chipata',
  'Chingola',
  'Mufulira',
  'Luanshya',
  'Solwezi',
];

export default function ServiceProviderRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: Personal info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nrcNumber, setNrcNumber] = useState('');
  
  // Step 3: Business info
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!fullName || !phone) {
      setError('Please fill in required fields');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (!businessName || !category || !city) {
      setError('Please fill in required fields');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register/service-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: fullName,
          phone,
          nrcNumber,
          businessName,
          category,
          description,
          city,
          area,
          yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : null,
          priceRange,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Redirect to service provider dashboard
      router.push('/services/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      setLoading(false);
    }
  };

  const selectedCategory = SERVICE_CATEGORIES.find(c => c.value === category);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Become a Service Provider</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join DENUEL and grow your business by connecting with homeowners and tenants
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= s 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > s ? 'bg-orange-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-8 mb-8 text-sm">
          <span className={step >= 1 ? 'text-orange-600 font-medium' : 'text-gray-400'}>Account</span>
          <span className={step >= 2 ? 'text-orange-600 font-medium' : 'text-gray-400'}>Personal</span>
          <span className={step >= 3 ? 'text-orange-600 font-medium' : 'text-gray-400'}>Business</span>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Your Account</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter your login credentials</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Create a secure password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  Continue
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-orange-600 hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                  <p className="text-gray-500 text-sm mt-1">Tell us about yourself</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="John Banda"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="+260 97X XXX XXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NRC Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={nrcNumber}
                    onChange={(e) => setNrcNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="123456/78/9"
                  />
                  <p className="text-xs text-gray-500 mt-1">Helps verify your identity for customer trust</p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Business Info */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Business Information</h2>
                  <p className="text-gray-500 text-sm mt-1">Tell us about your services</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Category *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          category === cat.value
                            ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 hover:border-orange-300 dark:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <p className="text-sm font-medium mt-1 text-gray-900 dark:text-white">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                  {selectedCategory && (
                    <p className="text-sm text-gray-500 mt-2">{selectedCategory.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business/Service Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., John's Garden Services"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select City</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Area/Suburb
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., Kabulonga"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years in Business
                    </label>
                    <input
                      type="number"
                      value={yearsInBusiness}
                      onChange={(e) => setYearsInBusiness(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., 5"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Range
                    </label>
                    <input
                      type="text"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., K200-K500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Describe your services, experience, and what makes you stand out..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-60"
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Get Bookings</h3>
            <p className="text-sm text-gray-500">Receive job requests directly from customers</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Build Reputation</h3>
            <p className="text-sm text-gray-500">Collect reviews and grow your rating</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Grow Income</h3>
            <p className="text-sm text-gray-500">Connect with customers looking for property services</p>
          </div>
        </div>
      </div>
    </main>
  );
}
