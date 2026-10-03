'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

const SERVICE_CATEGORIES = [
  { value: 'GARDENER', label: 'Garden Boy / Landscaping', icon: '🌿' },
  { value: 'LANDSCAPER', label: 'Professional Landscaper', icon: '🏡' },
  { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐜' },
  { value: 'MOVER', label: 'Moving Services', icon: '🚚' },
  { value: 'CLEANER', label: 'Cleaning Services', icon: '🧹' },
  { value: 'MAID', label: 'Maid / Housekeeper', icon: '👩‍🦰' },
  { value: 'PAINTER', label: 'Painting', icon: '🎨' },
  { value: 'PLUMBER', label: 'Plumbing', icon: '🔧' },
  { value: 'SECURITY', label: 'Security Services', icon: '🔒' },
  { value: 'INTERIOR_DESIGNER', label: 'Interior Design', icon: '🛋️' },
  { value: 'ELECTRICIAN', label: 'Electrician', icon: '⚡' },
  { value: 'CONTRACTOR', label: 'General Contractor', icon: '🏗️' },
];

const CITIES = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya'];

export default function ServiceProviderRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Account Details
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2: Business Details
  const [businessData, setBusinessData] = useState({
    businessName: '',
    category: '',
    description: '',
    yearsInBusiness: '',
    hourlyRate: '',
    minimumCharge: '',
    priceRange: '',
  });

  // Step 3: Location & Contact
  const [locationData, setLocationData] = useState({
    city: '',
    area: '',
    address: '',
    website: '',
    serviceAreas: [] as string[],
  });

  // Step 4: Documents
  const [documents, setDocuments] = useState<{
    nrc: File | null;
    certificate: File | null;
    license: File | null;
    profilePhoto: File | null;
  }>({
    nrc: null,
    certificate: null,
    license: null,
    profilePhoto: null,
  });

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountData({ ...accountData, [e.target.name]: e.target.value });
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBusinessData({ ...businessData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLocationData({ ...locationData, [e.target.name]: e.target.value });
  };

  const handleServiceAreaToggle = (area: string) => {
    setLocationData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof documents) => {
    if (e.target.files?.[0]) {
      setDocuments({ ...documents, [type]: e.target.files[0] });
    }
  };

  const validateStep = (stepNum: number): boolean => {
    setError('');
    
    if (stepNum === 1) {
      if (!accountData.name || !accountData.email || !accountData.phone || !accountData.password) {
        setError('Please fill in all required fields');
        return false;
      }
      if (accountData.password !== accountData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (accountData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }
    
    if (stepNum === 2) {
      if (!businessData.businessName || !businessData.category || !businessData.description) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    
    if (stepNum === 3) {
      if (!locationData.city) {
        setError('Please select your city');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    setError('');

    try {
      // First, create the user account
      const userRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountData.name,
          email: accountData.email,
          phone: accountData.phone,
          password: accountData.password,
          role: 'SERVICE_PROVIDER',
        }),
      });

      if (!userRes.ok) {
        const userData = await userRes.json();
        // Handle Zod validation errors (array format)
        let errorMsg = 'Failed to create account';
        if (Array.isArray(userData.error)) {
          errorMsg = userData.error.map((e: any) => e.message || e.path?.join('.')).join(', ');
        } else if (typeof userData.error === 'string') {
          errorMsg = userData.error;
        } else if (userData.message) {
          errorMsg = userData.message;
        }
        throw new Error(errorMsg);
      }

      const { user } = await userRes.json();

      // Upload documents if provided
      const uploadedDocs: { type: string; url: string; name: string }[] = [];
      
      for (const [type, file] of Object.entries(documents)) {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', type.toUpperCase());
          
          const uploadRes = await fetch('/api/uploads', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedDocs.push({ 
              type: type === 'profilePhoto' ? 'ID_PHOTO' : type.toUpperCase(), 
              url, 
              name: file.name 
            });
          }
        }
      }

      // Create the service provider profile
      const providerRes = await fetch('/api/services/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          businessName: businessData.businessName,
          category: businessData.category,
          description: businessData.description,
          yearsInBusiness: parseInt(businessData.yearsInBusiness) || 0,
          hourlyRate: parseFloat(businessData.hourlyRate) || null,
          minimumCharge: parseFloat(businessData.minimumCharge) || null,
          priceRange: businessData.priceRange,
          phone: accountData.phone,
          email: accountData.email,
          city: locationData.city,
          area: locationData.area,
          address: locationData.address,
          website: locationData.website,
          serviceAreas: locationData.serviceAreas,
          profilePhotoUrl: uploadedDocs.find(d => d.type === 'ID_PHOTO')?.url,
          documents: uploadedDocs,
        }),
      });

      if (!providerRes.ok) {
        const providerData = await providerRes.json();
        throw new Error(providerData.message || 'Failed to create provider profile');
      }

      // Redirect to login page - user needs to login to access dashboard
      router.push('/auth/login?registered=service_provider&redirect=/services/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`w-full h-1 mx-2 ${
                    s < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} style={{ width: '60px' }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Account</span>
            <span>Business</span>
            <span>Location</span>
            <span>Documents</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {step === 1 && 'Create Your Account'}
            {step === 2 && 'Business Information'}
            {step === 3 && 'Location & Service Areas'}
            {step === 4 && 'Upload Documents'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={accountData.name}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="John Mwansa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={accountData.phone}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+260 97 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={accountData.password}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={accountData.confirmPassword}
                  onChange={handleAccountChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter your password"
                />
              </div>

              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business / Professional Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={businessData.businessName}
                  onChange={handleBusinessChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John's Cleaning Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Category *
                </label>
                <select
                  name="category"
                  value={businessData.category}
                  onChange={handleBusinessChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description of Services *
                </label>
                <textarea
                  name="description"
                  value={businessData.description}
                  onChange={handleBusinessChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your services, experience, and what makes you stand out..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    name="yearsInBusiness"
                    value={businessData.yearsInBusiness}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (K)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={businessData.hourlyRate}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 150"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Charge (K)
                  </label>
                  <input
                    type="number"
                    name="minimumCharge"
                    value={businessData.minimumCharge}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 200"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range
                  </label>
                  <input
                    type="text"
                    name="priceRange"
                    value={businessData.priceRange}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., K200-K1000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location & Service Areas */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <select
                  name="city"
                  value={locationData.city}
                  onChange={handleLocationChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your city</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  name="area"
                  value={locationData.area}
                  onChange={handleLocationChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Kabulonga"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={locationData.address}
                  onChange={handleLocationChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (optional)
                </label>
                <input
                  type="url"
                  name="website"
                  value={locationData.website}
                  onChange={handleLocationChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Areas (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Kabulonga', 'Rhodes Park', 'Woodlands', 'Ibex Hill', 'Roma', 'Northmead', 'Chelston', 'Kabwata', 'Chilenje', 'Matero', 'Emmasdale', 'Avondale'].map((area) => (
                    <label
                      key={area}
                      className={`flex items-center p-2 border rounded-lg cursor-pointer ${
                        locationData.serviceAreas.includes(area)
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={locationData.serviceAreas.includes(area)}
                        onChange={() => handleServiceAreaToggle(area)}
                        className="mr-2"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-1">📄 Document Verification</h3>
                <p className="text-sm text-blue-600">
                  Upload your documents to get verified and build trust with customers.
                  Verified providers get more bookings!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {documents.profilePhoto ? (
                    <div>
                      <span className="text-green-600">✓ {documents.profilePhoto.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocuments({ ...documents, profilePhoto: null })}
                        className="ml-2 text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl block mb-2">📷</span>
                      <p className="text-gray-600 mb-2">Upload a professional photo</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'profilePhoto')}
                        className="hidden"
                        id="profilePhoto"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        Choose Photo
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National Registration Card (NRC) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {documents.nrc ? (
                    <div>
                      <span className="text-green-600">✓ {documents.nrc.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocuments({ ...documents, nrc: null })}
                        className="ml-2 text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl block mb-2">🪪</span>
                      <p className="text-gray-600 mb-2">Upload a copy of your NRC</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'nrc')}
                        className="hidden"
                        id="nrc"
                      />
                      <label
                        htmlFor="nrc"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        Upload NRC
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Certificate / Qualification
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {documents.certificate ? (
                    <div>
                      <span className="text-green-600">✓ {documents.certificate.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocuments({ ...documents, certificate: null })}
                        className="ml-2 text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl block mb-2">📜</span>
                      <p className="text-gray-600 mb-2">Training certificates, qualifications</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'certificate')}
                        className="hidden"
                        id="certificate"
                      />
                      <label
                        htmlFor="certificate"
                        className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700"
                      >
                        Upload Certificate
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business License (if applicable)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {documents.license ? (
                    <div>
                      <span className="text-green-600">✓ {documents.license.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocuments({ ...documents, license: null })}
                        className="ml-2 text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl block mb-2">📋</span>
                      <p className="text-gray-600 mb-2">Business registration, trade license</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'license')}
                        className="hidden"
                        id="license"
                      />
                      <label
                        htmlFor="license"
                        className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700"
                      >
                        Upload License
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back
              </button>
            ) : (
              <Link
                href="/services"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <span className="text-3xl block mb-2">💰</span>
            <h3 className="font-medium text-gray-800">Earn More</h3>
            <p className="text-sm text-gray-600">Connect with clients actively looking for your services</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <span className="text-3xl block mb-2">✓</span>
            <h3 className="font-medium text-gray-800">Get Verified</h3>
            <p className="text-sm text-gray-600">Build trust with verification badges</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <span className="text-3xl block mb-2">⭐</span>
            <h3 className="font-medium text-gray-800">Build Reviews</h3>
            <p className="text-sm text-gray-600">Grow your reputation with customer reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}
