'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function splitCsv(value: string) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'ROOM', label: 'Room' },
  { value: 'OFFICE', label: 'Office space' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'LAND', label: 'Land / plot' },
  { value: 'COMMERCIAL', label: 'Commercial property' },
  { value: 'OTHER', label: 'Other' },
];

const LISTING_TYPES = [
  { value: 'RENT', label: 'For rent' },
  { value: 'SALE', label: 'For sale' },
];

type YesNo = '' | 'yes' | 'no';
type WaterSource = '' | 'MUNICIPAL' | 'BOREHOLE' | 'WELL' | 'TANK' | 'OTHER';
type PowerBackup = '' | 'NONE' | 'SOLAR' | 'INVERTER' | 'GENERATOR' | 'OTHER';

export default function NewPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [isShortStay, setIsShortStay] = useState(false);

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressText, setAddressText] = useState('');

  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');

  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [furnished, setFurnished] = useState<YesNo>('');
  const [petsAllowed, setPetsAllowed] = useState<YesNo>('');
  const [internetAvailable, setInternetAvailable] = useState<YesNo>('');
  const [waterSource, setWaterSource] = useState<WaterSource>('');
  const [powerBackup, setPowerBackup] = useState<PowerBackup>('');
  const [securityFeatures, setSecurityFeatures] = useState('');
  const [amenities, setAmenities] = useState('');
  const [rules, setRules] = useState('');

  const [images, setImages] = useState<{ src: string; key?: string }[]>([]);

  const inputClass =
    'h-12 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#16A34A]';
  const labelClass = 'mb-2 block text-sm font-semibold text-slate-800';

  const nonResidential = ['LAND', 'OFFICE', 'SHOP', 'WAREHOUSE', 'COMMERCIAL'].includes(propertyType);

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      if (!title.trim()) return 'Enter the property title.';
      if (description.trim().length < 20) return 'Add a fuller property description.';
      if (!propertyType) return 'Select the property type.';
      if (!listingType) return 'Select whether the property is for rent or sale.';
      if (!price || Number(price) <= 0) return 'Enter the real asking price.';
    }

    if (currentStep === 2 && !city.trim()) {
      return 'Enter the city where the property is located.';
    }

    if (currentStep === 3) {
      if (bedrooms === '' && !nonResidential) return 'Enter the number of bedrooms.';
      if (bathrooms === '') return 'Enter the number of bathrooms. Use 0 if not applicable.';
      if (parkingSpaces === '') return 'Enter the number of parking spaces. Use 0 if there are none.';
      if (!furnished) return 'Confirm whether the property is furnished.';
      if (!petsAllowed) return 'Confirm whether pets are allowed.';
      if (!internetAvailable) return 'Confirm whether internet is available.';
      if (!waterSource) return 'Select the actual water source.';
      if (!powerBackup) return 'Select the actual power-backup status.';
    }

    if (currentStep === 4 && images.length === 0) {
      return 'Upload at least one real photo of the property.';
    }

    return '';
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files can be added to a property listing.');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Each image must be less than 10MB.');
          continue;
        }

        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const presignJson = await presignRes.json();

        if (!presignRes.ok || !presignJson?.url) {
          throw new Error(presignJson?.error || 'Unable to prepare the image upload.');
        }

        if (presignJson.useDirectUpload) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('key', presignJson.key);

          const uploadRes = await csrfFetch('/api/uploads/direct', {
            method: 'POST',
            body: formData,
          });
          const uploaded = await uploadRes.json();

          if (!uploadRes.ok || !uploaded?.publicUrl) {
            throw new Error(uploaded?.error || 'Image upload failed.');
          }

          setImages((current) => [
            ...current,
            { src: uploaded.publicUrl, key: uploaded.key || presignJson.key },
          ]);
        } else {
          const put = await fetch(presignJson.url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!put.ok) throw new Error('Image upload failed.');

          const verifyRes = await fetch('/api/uploads/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: presignJson.key }),
          });
          const verified = await verifyRes.json();

          if (!verifyRes.ok || !verified?.publicUrl) {
            throw new Error(verified?.error || 'Unable to verify the uploaded image.');
          }

          setImages((current) => [
            ...current,
            { src: verified.publicUrl, key: presignJson.key },
          ]);
        }
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function resolveCoordinates() {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return {};

    const locationText = [addressText.trim(), area.trim(), city.trim(), 'Zambia']
      .filter(Boolean)
      .join(', ');

    if (!locationText) return {};

    try {
      const response = await fetch(
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
          encodeURIComponent(locationText) +
          '.json?country=ZM&limit=1&access_token=' +
          encodeURIComponent(token)
      );
      const data = await response.json();

      if (response.ok && Array.isArray(data.features) && data.features[0]?.center) {
        const [longitude, latitude] = data.features[0].center;
        return { latitude, longitude };
      }
    } catch {
      // The listing may still be submitted for admin review without coordinates.
    }

    return {};
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coordinates = await resolveCoordinates();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        propertyType,
        listingType,
        price: Number(price),
        deposit: deposit ? Number(deposit) : undefined,
        country: 'Zambia',
        city: city.trim(),
        area: area.trim() || undefined,
        addressText: addressText.trim() || undefined,
        ...coordinates,
        bedrooms: nonResidential && bedrooms === '' ? 0 : Number(bedrooms),
        bathrooms: Number(bathrooms),
        sizeSqm: sizeSqm ? Number(sizeSqm) : undefined,
        parkingSpaces: Number(parkingSpaces),
        furnished: furnished === 'yes',
        petsAllowed: petsAllowed === 'yes',
        internetAvailable: internetAvailable === 'yes',
        waterSource,
        powerBackup,
        securityFeatures: splitCsv(securityFeatures),
        amenities: splitCsv(amenities),
        rules: splitCsv(rules),
        isShortStay: listingType === 'RENT' && isShortStay,
        images: images.map((image) => ({ url: image.src })),
      };

      const response = await csrfFetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.id) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to submit this property.'
        );
      }

      router.push('/dashboard/properties?submitted=1');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit this property.'
      );
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    ['Property', 'Type and price'],
    ['Location', 'Where it is'],
    ['Details', 'Real features'],
    ['Photos', 'Property images'],
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/properties')}
          className="mb-5 text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
        >
          ← Back to properties
        </button>

        <div className="border-b border-slate-200 pb-6">
          <div className="text-sm font-semibold text-[#16A34A]">Ng&apos;anda property listing</div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
            Add a real property
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Enter only information you can confirm. New listings remain pending until they are reviewed.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-4 border border-slate-200 bg-white">
          {steps.map(([name, note], index) => {
            const number = index + 1;
            const active = step === number;
            const complete = step > number;

            return (
              <button
                key={name}
                type="button"
                onClick={() => number <= step && setStep(number)}
                className={`border-r border-slate-200 px-2 py-4 text-left last:border-r-0 sm:px-4 ${
                  active ? 'bg-[#0F2B46] text-white' : complete ? 'bg-emerald-50' : 'bg-white'
                }`}
              >
                <div className="text-xs font-semibold">{complete ? '✓' : number}</div>
                <div className="mt-1 text-xs font-semibold sm:text-sm">{name}</div>
                <div className={`mt-0.5 hidden text-xs sm:block ${active ? 'text-slate-200' : 'text-slate-400'}`}>
                  {note}
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <section className="border border-slate-200 bg-white p-5 sm:p-7">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Property and pricing</h2>
                <p className="mt-1 text-sm text-slate-500">No sample values are inserted. Enter the actual listing details.</p>

                <div className="mt-6 grid gap-5">
                  <div>
                    <label className={labelClass}>Property title *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Enter a clear property title"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#16A34A]"
                      placeholder="Describe the actual property, condition, layout and important details"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Property type *</label>
                      <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
                        <option value="">Select property type</option>
                        {PROPERTY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Listing type *</label>
                      <select value={listingType} onChange={(e) => setListingType(e.target.value)} className={inputClass}>
                        <option value="">Select listing type</option>
                        {LISTING_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Price (ZMW) *</label>
                      <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="Enter amount in ZMW" />
                    </div>
                    <div>
                      <label className={labelClass}>Deposit (ZMW)</label>
                      <input type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} className={inputClass} placeholder="Leave blank if not applicable" />
                    </div>
                  </div>

                  {listingType === 'RENT' && (
                    <label className="flex items-start gap-3 border border-slate-200 p-4 text-sm text-slate-700">
                      <input type="checkbox" checked={isShortStay} onChange={(e) => setIsShortStay(e.target.checked)} className="mt-1" />
                      <span>
                        <strong className="block text-slate-900">Also available for short stays</strong>
                        Only select this if the property genuinely accepts short-stay bookings.
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Property location</h2>
                <p className="mt-1 text-sm text-slate-500">Use the actual city, area and address or landmark.</p>

                <div className="mt-6 grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>City *</label>
                      <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Enter city" />
                    </div>
                    <div>
                      <label className={labelClass}>Area / neighbourhood</label>
                      <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} placeholder="Enter area or neighbourhood" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Street address / landmark</label>
                    <input value={addressText} onChange={(e) => setAddressText(e.target.value)} className={inputClass} placeholder="Enter the real address or nearest landmark" />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Ng&apos;anda will try to add map coordinates from the location you enter. If geocoding is unavailable, the listing can still be reviewed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Property facts</h2>
                <p className="mt-1 text-sm text-slate-500">Confirm each field instead of relying on automatic assumptions.</p>

                <div className="mt-6 grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Bedrooms {nonResidential ? '(if applicable)' : '*'}</label>
                      <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} placeholder={nonResidential ? 'Optional' : 'Enter number'} />
                    </div>
                    <div>
                      <label className={labelClass}>Bathrooms *</label>
                      <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClass} placeholder="Use 0 if none" />
                    </div>
                    <div>
                      <label className={labelClass}>Size (m²)</label>
                      <input type="number" min="0" step="0.01" value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} className={inputClass} placeholder="Leave blank if unknown" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Parking spaces *</label>
                      <input type="number" min="0" value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} className={inputClass} placeholder="Use 0 if none" />
                    </div>
                    <div>
                      <label className={labelClass}>Water source *</label>
                      <select value={waterSource} onChange={(e) => setWaterSource(e.target.value as WaterSource)} className={inputClass}>
                        <option value="">Select actual source</option>
                        <option value="MUNICIPAL">Municipal supply</option>
                        <option value="BOREHOLE">Borehole</option>
                        <option value="WELL">Well</option>
                        <option value="TANK">Water tank</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Power backup *</label>
                      <select value={powerBackup} onChange={(e) => setPowerBackup(e.target.value as PowerBackup)} className={inputClass}>
                        <option value="">Select actual status</option>
                        <option value="NONE">No backup</option>
                        <option value="SOLAR">Solar</option>
                        <option value="INVERTER">Inverter</option>
                        <option value="GENERATOR">Generator</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      ['Furnished *', furnished, setFurnished],
                      ['Pets allowed *', petsAllowed, setPetsAllowed],
                      ['Internet available *', internetAvailable, setInternetAvailable],
                    ].map(([label, value, setter]: any) => (
                      <div key={label}>
                        <label className={labelClass}>{label}</label>
                        <select value={value} onChange={(e) => setter(e.target.value as YesNo)} className={inputClass}>
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className={labelClass}>Amenities</label>
                    <input value={amenities} onChange={(e) => setAmenities(e.target.value)} className={inputClass} placeholder="Enter only amenities that are actually available, separated by commas" />
                  </div>
                  <div>
                    <label className={labelClass}>Security features</label>
                    <input value={securityFeatures} onChange={(e) => setSecurityFeatures(e.target.value)} className={inputClass} placeholder="Enter confirmed security features, separated by commas" />
                  </div>
                  <div>
                    <label className={labelClass}>Property rules</label>
                    <input value={rules} onChange={(e) => setRules(e.target.value)} className={inputClass} placeholder="Enter real rules or restrictions, separated by commas" />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Real property photos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload photos of the actual property. The first image becomes the main listing photo.
                </p>

                <div className="mt-6 border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    id="property-image-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="property-image-upload" className="cursor-pointer">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-300 bg-white text-slate-500">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4-4 4 4 3-3 5 5M8 8h.01M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#0F2B46]">
                      {uploading ? 'Uploading…' : 'Choose property photos'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">JPG, PNG or other image files · maximum 10MB each</div>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <div key={image.src} className="relative aspect-[4/3] overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={image.src} alt={`Property photo ${index + 1}`} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-[#0F2B46] px-2 py-1 text-xs font-semibold text-white">
                            Main photo
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-white text-sm font-bold text-red-600 shadow"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
                  The property will not become public immediately. After submission it goes to <strong>Pending Review</strong> for admin approval.
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep((current) => Math.max(1, current - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={step === 1}
                className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-[#0F2B46] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || uploading || images.length === 0}
                  className="bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit property for review'}
                </button>
              )}
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
