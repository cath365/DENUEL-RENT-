'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ServiceType = 'maid' | 'cleaner' | 'security' | 'gardener' | 'plumber' | 'electrician' | 'painter' | 'mover';

const SERVICE_TYPES: { id: ServiceType; label: string; icon: string; description: string }[] = [
  { id: 'maid', label: 'Maid / Housekeeper', icon: '🏠', description: 'Cooking, cleaning, childcare, and household management' },
  { id: 'cleaner', label: 'Professional Cleaner', icon: '🧹', description: 'Deep cleaning, regular cleaning, move-in/out cleaning' },
  { id: 'security', label: 'Security Guard', icon: '🛡️', description: 'Property security, patrol, and access control' },
  { id: 'gardener', label: 'Gardener / Landscaper', icon: '🌳', description: 'Garden maintenance, landscaping, and lawn care' },
  { id: 'plumber', label: 'Plumber', icon: '🔧', description: 'Pipe repairs, installations, and drain cleaning' },
  { id: 'electrician', label: 'Electrician', icon: '⚡', description: 'Electrical repairs, wiring, and installations' },
  { id: 'painter', label: 'Painter', icon: '🎨', description: 'Interior and exterior painting services' },
  { id: 'mover', label: 'Moving Services', icon: '📦', description: 'Packing, moving, and furniture assembly' },
];

const ZAMBIAN_CITIES = [
  'Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone',
  'Luanshya', 'Kasama', 'Chipata', 'Solwezi', 'Mansa', 'Mongu', 'Kafue', 'Choma'
];

export default function BecomeServiceProviderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    serviceType: '' as ServiceType | '',
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    nrcNumber: '',
    experience: '',
    description: '',
    services: [] as string[],
    serviceAreas: [] as string[],
    hourlyRate: '',
    availability: [] as string[],
  });

  const [documents, setDocuments] = useState<{ type: string; file: File | null }[]>([
    { type: 'nrc', file: null },
    { type: 'clearance', file: null },
    { type: 'certificate', file: null },
  ]);

  const handleServiceSelect = (serviceId: ServiceType) => {
    setFormData({ ...formData, serviceType: serviceId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (name: 'services' | 'serviceAreas' | 'availability', value: string) => {
    const current = formData[name];
    if (current.includes(value)) {
      setFormData({ ...formData, [name]: current.filter((v: string) => v !== value) });
    } else {
      setFormData({ ...formData, [name]: [...current, value] });
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newDocs = [...documents];
    newDocs[index].file = file;
    setDocuments(newDocs);
  };

  const getServicesForType = (type: ServiceType): string[] => {
    const serviceOptions: Record<ServiceType, string[]> = {
      maid: ['Cooking', 'Cleaning', 'Laundry', 'Childcare', 'Elder Care', 'Shopping', 'Ironing'],
      cleaner: ['Deep Cleaning', 'Regular Cleaning', 'Move-in/out', 'Office Cleaning', 'Window Cleaning', 'Carpet Cleaning'],
      security: ['Day Shift', 'Night Shift', '24/7 Coverage', 'Event Security', 'Access Control', 'Patrol'],
      gardener: ['Lawn Care', 'Garden Maintenance', 'Tree Trimming', 'Planting', 'Irrigation', 'Landscaping Design'],
      plumber: ['Pipe Repairs', 'Installation', 'Drain Cleaning', 'Water Heater', 'Bathroom Remodel', 'Emergency Repairs'],
      electrician: ['Wiring', 'Repairs', 'Installation', 'Panel Upgrade', 'Lighting', 'Generator Installation'],
      painter: ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Texture Coating', 'Wood Finishing'],
      mover: ['Packing', 'Loading/Unloading', 'Furniture Assembly', 'Storage', 'Office Moving', 'Long Distance'],
    };
    return serviceOptions[type] || [];
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // First upload documents
      const uploadedDocs: { type: string; url: string; name: string }[] = [];
      
      for (const doc of documents) {
        if (doc.file) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', doc.file);
          formDataUpload.append('type', 'document');

          const uploadRes = await fetch('/api/uploads', {
            method: 'POST',
            body: formDataUpload,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedDocs.push({ type: doc.type, url, name: doc.file.name });
          }
        }
      }

      // Submit application
      const res = await fetch('/api/service-providers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hourlyRate: parseFloat(formData.hourlyRate) || 0,
          documents: uploadedDocs,
        }),
      });

      if (res.ok) {
        router.push('/services/apply/success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={`text-xs mt-2 ${step >= s ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {s === 1 ? 'Service' : s === 2 ? 'Details' : s === 3 ? 'Services' : 'Documents'}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Step 1: Select Service Type */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What service do you provide?</h2>
              <p className="text-gray-600 mb-6">Select the type of service you want to offer</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICE_TYPES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.serviceType === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{service.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.serviceType}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Details</h2>
              <p className="text-gray-600 mb-6">Tell us about yourself</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name (Optional)</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="If you have a registered business"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+260 97X XXX XXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NRC Number *</label>
                    <input
                      type="text"
                      name="nrcNumber"
                      value={formData.nrcNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123456/10/1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience *</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select experience</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About You *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell potential clients about your experience, skills, and why they should hire you..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (ZMW) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">K</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">/hour</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.fullName || !formData.email || !formData.phone || !formData.nrcNumber || !formData.experience || !formData.description}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Services & Areas */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Services & Availability</h2>
              <p className="text-gray-600 mb-6">Select the services you offer and your coverage areas</p>

              <div className="space-y-8">
                {/* Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Services You Offer *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.serviceType && getServicesForType(formData.serviceType as ServiceType).map((service) => (
                      <label
                        key={service}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.services.includes(service)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleCheckboxChange('services', service)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Service Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Service Areas *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ZAMBIAN_CITIES.map((city) => (
                      <label
                        key={city}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.serviceAreas.includes(city)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.serviceAreas.includes(city)}
                          onChange={() => handleCheckboxChange('serviceAreas', city)}
                          className="rounded text-green-600"
                        />
                        <span className="text-sm">📍 {city}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Availability *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <label
                        key={day}
                        className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.availability.includes(day)
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(day)}
                          onChange={() => handleCheckboxChange('availability', day)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{day.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={formData.services.length === 0 || formData.serviceAreas.length === 0 || formData.availability.length === 0}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
              <p className="text-gray-600 mb-6">Please upload the required documents for verification</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* NRC Copy */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">NRC Copy *</h4>
                      <p className="text-sm text-gray-500">Front and back of your National Registration Card</p>
                    </div>
                    {documents[0].file && (
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(0, e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Police Clearance */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Police Clearance Certificate *</h4>
                      <p className="text-sm text-gray-500">Must be issued within the last 6 months</p>
                    </div>
                    {documents[1].file && (
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(1, e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Professional Certificate (Optional) */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Professional Certificate (Optional)</h4>
                      <p className="text-sm text-gray-500">Trade certificate, license, or professional qualification</p>
                    </div>
                    {documents[2].file && (
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(2, e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Terms Agreement */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-blue-600" required />
                    <span className="text-sm text-gray-600">
                      I confirm that all information provided is accurate and I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                      I understand that false information may result in rejection or removal from the platform.
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !documents[0].file || !documents[1].file}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-3">
              Our team is here to assist you with your application. Contact us if you have any questions.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+260971234567" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                📞 +260 97 123 4567
              </a>
              <a href="mailto:support@denuelrental.com" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                ✉️ support@denuelrental.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
