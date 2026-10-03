"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';

const VEHICLE_TYPES = [
  { id: 'MOTORBIKE', label: 'Motorbike', icon: '🏍️', description: 'Small deliveries & quick trips' },
  { id: 'CAR', label: 'Car / Sedan', icon: '🚗', description: 'Up to 4 passengers' },
  { id: 'SUV', label: 'SUV', icon: '🚙', description: 'Up to 6 passengers, more luggage space' },
  { id: 'VAN', label: 'Van / Minibus', icon: '🚐', description: 'Up to 12 passengers or medium cargo' },
  { id: 'TRUCK_SMALL', label: 'Small Truck', icon: '🛻', description: 'Small moving jobs, up to 1 ton' },
  { id: 'TRUCK_MEDIUM', label: 'Medium Truck', icon: '🚚', description: 'Medium moving jobs, 1-3 tons' },
  { id: 'TRUCK_LARGE', label: 'Large Truck', icon: '🚛', description: 'Large moving jobs, 3+ tons' },
];

const ZAMBIAN_CITIES = [
  'Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone',
  'Luanshya', 'Kasama', 'Chipata', 'Solwezi', 'Mansa', 'Mongu', 'Kafue', 'Choma'
];

export default function DriverApplyPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nrcNumber: '',
    licenseNumber: '',
    vehicleType: '',
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
  const [documents, setDocuments] = useState<{ type: string; file: File | null }[]>([
    { type: 'nrc', file: null },
    { type: 'license', file: null },
    { type: 'vehicle_reg', file: null },
    { type: 'insurance', file: null },
    { type: 'clearance', file: null },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      try {
        const p = await axios.get('/api/driver/profile');
        if (p.data.profile) router.push('/driver');
      } catch (e) {
        // ignore
      }
    }
    check();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setFormData({ ...formData, vehicleType: vehicleId });
  };

  const handleAreaToggle = (city: string) => {
    const current = formData.serviceAreas;
    if (current.includes(city)) {
      setFormData({ ...formData, serviceAreas: current.filter(c => c !== city) });
    } else {
      setFormData({ ...formData, serviceAreas: [...current, city] });
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newDocs = [...documents];
    newDocs[index].file = file;
    setDocuments(newDocs);
  };

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      // Upload documents first
      const uploadedDocs: { type: string; url: string; name: string }[] = [];
      
      for (const doc of documents) {
        if (doc.file) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', doc.file);
          formDataUpload.append('type', 'document');

          try {
            const uploadRes = await axios.post('/api/uploads', formDataUpload);
            if (uploadRes.data.url) {
              uploadedDocs.push({ type: doc.type, url: uploadRes.data.url, name: doc.file.name });
            }
          } catch (e) {
            console.log('Document upload failed:', doc.type);
          }
        }
      }

      // Submit driver application
      const body = {
        licenseNumber: formData.licenseNumber,
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehiclePlate,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: parseInt(formData.vehicleYear) || new Date().getFullYear(),
        vehicleColor: formData.vehicleColor,
        vehicleCapacityKg: parseInt(formData.capacity) || 0,
        experience: formData.experience,
        bio: formData.bio,
        serviceAreas: formData.serviceAreas,
        documents: uploadedDocs,
      };

      const res = await axios.post('/api/driver/profile', body);
      if (res.data.error) {
        setError(res.data.error);
      } else {
        router.push('/driver/apply/success');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Submit failed');
    } finally { 
      setLoading(false); 
    }
  }

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
                    {s === 1 ? 'Vehicle' : s === 2 ? 'Personal' : s === 3 ? 'Areas' : 'Documents'}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Vehicle Selection */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🚗 Select Your Vehicle Type</h2>
              <p className="text-gray-600 mb-6">Choose the type of vehicle you'll be using for transport services</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {VEHICLE_TYPES.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.vehicleType === vehicle.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{vehicle.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vehicle.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{vehicle.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Vehicle Details */}
              {formData.vehicleType && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Vehicle Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                      <input
                        type="text"
                        name="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={handleInputChange}
                        placeholder="e.g., Toyota"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                      <input
                        type="text"
                        name="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                        placeholder="e.g., Land Cruiser"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <input
                        type="number"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={handleInputChange}
                        placeholder="e.g., 2020"
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                      <input
                        type="text"
                        name="vehicleColor"
                        value={formData.vehicleColor}
                        onChange={handleInputChange}
                        placeholder="e.g., White"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plate Number *</label>
                      <input
                        type="text"
                        name="vehiclePlate"
                        value={formData.vehiclePlate}
                        onChange={handleInputChange}
                        placeholder="e.g., ABZ 1234"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (kg) - Optional</label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="e.g., 500"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.vehicleType || !formData.vehicleMake || !formData.vehicleModel || !formData.vehiclePlate}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">👤 Your Personal Details</h2>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NRC Number *</label>
                    <input
                      type="text"
                      name="nrcNumber"
                      value={formData.nrcNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="123456/10/1"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+260 97X XXX XXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver's License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="DL123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driving Experience *</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">About You</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell clients about your driving experience, why you're reliable, etc..."
                  />
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
                  disabled={!formData.fullName || !formData.licenseNumber || !formData.experience}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Service Areas */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📍 Service Areas</h2>
              <p className="text-gray-600 mb-6">Select the cities where you're available to provide transport services</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ZAMBIAN_CITIES.map((city) => (
                  <label
                    key={city}
                    className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.serviceAreas.includes(city)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceAreas.includes(city)}
                      onChange={() => handleAreaToggle(city)}
                      className="rounded text-green-600"
                    />
                    <span className="font-medium">📍 {city}</span>
                  </label>
                ))}
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
                  disabled={formData.serviceAreas.length === 0}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Upload Documents</h2>
              <p className="text-gray-600 mb-6">Please upload the required documents for verification</p>

              <div className="space-y-4">
                {[
                  { index: 0, label: 'NRC Copy (Front & Back)', required: true },
                  { index: 1, label: "Driver's License", required: true },
                  { index: 2, label: 'Vehicle Registration (Blue Book)', required: true },
                  { index: 3, label: 'Vehicle Insurance', required: true },
                  { index: 4, label: 'Police Clearance Certificate', required: true },
                ].map((doc) => (
                  <div key={doc.index} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </h4>
                      </div>
                      {documents[doc.index].file && (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Uploaded
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(doc.index, e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                ))}

                {/* Terms */}
                <div className="bg-gray-50 p-4 rounded-xl mt-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-blue-600" required />
                    <span className="text-sm text-gray-600">
                      I confirm that all information provided is accurate and I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                      I understand that providing false information may result in permanent removal from the platform.
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
                  disabled={loading || documents.slice(0, 5).some(d => !d.file)}
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
              Having trouble with your application? Our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+260971234567" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                📞 +260 97 123 4567
              </a>
              <a href="mailto:drivers@denuelrental.com" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                ✉️ drivers@denuelrental.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
