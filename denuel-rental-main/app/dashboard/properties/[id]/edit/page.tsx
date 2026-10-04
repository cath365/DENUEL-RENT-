'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AvailabilityManager from '@/components/AvailabilityManager';
import { csrfFetch } from '@/lib/csrf';

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const PROPERTY_TYPES = [
  ['APARTMENT', 'Apartment'],
  ['HOUSE', 'House'],
  ['DUPLEX', 'Duplex'],
  ['STUDIO', 'Studio'],
  ['ROOM', 'Room'],
  ['OFFICE', 'Office space'],
  ['SHOP', 'Shop'],
  ['WAREHOUSE', 'Warehouse'],
  ['LAND', 'Land / plot'],
  ['COMMERCIAL', 'Commercial property'],
  ['OTHER', 'Other'],
];

const LISTING_TYPES = [
  ['RENT', 'For rent'],
  ['SALE', 'For sale'],
];

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressText, setAddressText] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [internetAvailable, setInternetAvailable] = useState(false);
  const [waterSource, setWaterSource] = useState('');
  const [powerBackup, setPowerBackup] = useState('');
  const [securityFeatures, setSecurityFeatures] = useState('');
  const [amenities, setAmenities] = useState('');
  const [rules, setRules] = useState('');
  const [isShortStay, setIsShortStay] = useState(false);
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [images, setImages] = useState<{ src: string; key?: string }[]>([]);

  const inputClass =
    'h-12 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#16A34A]';
  const labelClass = 'mb-2 block text-sm font-semibold text-slate-800';

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/properties/' + params.id);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.property) {
          throw new Error(data.error || 'Unable to load this property.');
        }

        if (cancelled) return;

        const property = data.property;

        setStatus(property.status || '');
        setRejectionReason(property.rejectionReason || '');
        setTitle(property.title || '');
        setDescription(property.description || '');
        setPropertyType(property.propertyType || '');
        setListingType(
          property.listingType === 'RENT' || property.listingType === 'SALE'
            ? property.listingType
            : ''
        );
        setPrice(property.price != null ? String(property.price) : '');
        setDeposit(property.deposit != null ? String(property.deposit) : '');
        setCity(property.city || '');
        setArea(property.area || '');
        setAddressText(property.addressText || '');
        setBedrooms(property.bedrooms != null ? String(property.bedrooms) : '');
        setBathrooms(property.bathrooms != null ? String(property.bathrooms) : '');
        setSizeSqm(property.sizeSqm != null ? String(property.sizeSqm) : '');
        setParkingSpaces(property.parkingSpaces != null ? String(property.parkingSpaces) : '');
        setFurnished(Boolean(property.furnished));
        setPetsAllowed(Boolean(property.petsAllowed));
        setInternetAvailable(Boolean(property.internetAvailable));
        setWaterSource(property.waterSource || '');
        setPowerBackup(property.powerBackup || '');
        setSecurityFeatures(
          Array.isArray(property.securityFeatures)
            ? property.securityFeatures.join(', ')
            : ''
        );
        setAmenities(
          Array.isArray(property.amenities)
            ? property.amenities.join(', ')
            : ''
        );
        setRules(
          Array.isArray(property.rules)
            ? property.rules.join(', ')
            : ''
        );
        setIsShortStay(Boolean(property.isShortStay));
        setVirtualTourUrl(property.virtualTourUrl || '');
        setImages(
          Array.isArray(property.images)
            ? property.images.map((image: any) => ({ src: image.url }))
            : []
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this property.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files can be added.');
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError('Each image must be less than 10MB.');
          continue;
        }

        const presignResponse = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });
        const presign = await presignResponse.json();

        if (!presignResponse.ok || !presign?.url) {
          throw new Error(presign?.error || 'Unable to prepare the image upload.');
        }

        if (presign.useDirectUpload) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('key', presign.key);

          const uploadResponse = await csrfFetch('/api/uploads/direct', {
            method: 'POST',
            body: formData,
          });
          const uploaded = await uploadResponse.json();

          if (!uploadResponse.ok || !uploaded?.publicUrl) {
            throw new Error(uploaded?.error || 'Image upload failed.');
          }

          setImages((current) => [
            ...current,
            {
              src: uploaded.publicUrl,
              key: uploaded.key || presign.key,
            },
          ]);
          continue;
        }

        const uploadResponse = await fetch(presign.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error('Image upload failed.');
        }

        const verifyResponse = await fetch('/api/uploads/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: presign.key }),
        });
        const verified = await verifyResponse.json();

        if (!verifyResponse.ok || !verified?.publicUrl) {
          throw new Error(verified?.error || 'Unable to verify the uploaded image.');
        }

        setImages((current) => [
          ...current,
          { src: verified.publicUrl, key: presign.key },
        ]);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Image upload failed.'
      );
    } finally {
      setUploading(false);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;

      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function resolveCoordinates() {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return {};

    const location = [addressText.trim(), area.trim(), city.trim(), 'Zambia']
      .filter(Boolean)
      .join(', ');

    if (!location) return {};

    try {
      const response = await fetch(
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
          encodeURIComponent(location) +
          '.json?country=ZM&limit=1&access_token=' +
          encodeURIComponent(token)
      );
      const data = await response.json();

      if (response.ok && data.features?.[0]?.center) {
        const [longitude, latitude] = data.features[0].center;
        return { latitude, longitude };
      }
    } catch {
      // Location text can still be reviewed even if geocoding is unavailable.
    }

    return {};
  }

  function validate() {
    if (!title.trim()) return 'Enter the property title.';
    if (description.trim().length < 20) return 'Add a fuller property description.';
    if (!propertyType) return 'Select the property type.';
    if (!listingType) return 'Select whether the property is for rent or sale.';
    if (!price || Number(price) <= 0) return 'Enter the real asking price.';
    if (!city.trim()) return 'Enter the property city.';
    if (bathrooms === '') return 'Enter the number of bathrooms.';
    if (parkingSpaces === '') return 'Enter the number of parking spaces.';
    if (!waterSource) return 'Select the actual water source.';
    if (!powerBackup) return 'Select the actual power-backup status.';
    if (images.length === 0) return 'Keep or upload at least one real property photo.';
    return '';
  }

  async function saveChanges() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const coordinates = await resolveCoordinates();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        propertyType,
        listingType,
        price: Number(price),
        deposit: deposit ? Number(deposit) : null,
        country: 'Zambia',
        city: city.trim(),
        area: area.trim() || null,
        addressText: addressText.trim() || null,
        ...coordinates,
        bedrooms: bedrooms === '' ? 0 : Number(bedrooms),
        bathrooms: Number(bathrooms),
        sizeSqm: sizeSqm ? Number(sizeSqm) : null,
        furnished,
        parkingSpaces: Number(parkingSpaces),
        petsAllowed,
        internetAvailable,
        waterSource,
        powerBackup,
        securityFeatures: splitCsv(securityFeatures),
        amenities: splitCsv(amenities),
        rules: splitCsv(rules),
        isShortStay: listingType === 'RENT' && isShortStay,
        virtualTourUrl: virtualTourUrl.trim() || null,
        images: images.map((image) => image.src),
      };

      const response = await csrfFetch('/api/properties/' + params.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.property) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Unable to save these changes.'
        );
      }

      router.push('/dashboard/properties?resubmitted=1');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save these changes.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-72 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/properties')}
              className="mb-4 text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← Back to properties
            </button>
            <div className="text-sm font-semibold text-[#16A34A]">Property management</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Edit property
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Update confirmed property information. Saving owner or agent changes submits the listing for a fresh admin review.
            </p>
          </div>

          <span className={`w-fit px-3 py-1.5 text-xs font-semibold ${
            status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700'
              : status === 'REJECTED'
                ? 'bg-red-50 text-red-700'
                : status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
          }`}>
            {status === 'REJECTED' ? 'NEEDS CHANGES' : status}
          </span>
        </div>

        {status === 'REJECTED' && rejectionReason && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <div className="text-sm font-semibold text-red-800">Admin feedback</div>
            <p className="mt-2 text-sm leading-6 text-red-700">{rejectionReason}</p>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
            This listing is currently public. Saving changes will move it back to <strong>Pending Review</strong> until an admin approves the updated information.
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Listing information</h2>

              <div className="mt-5 grid gap-5">
                <div>
                  <label className={labelClass}>Property title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Property type *</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
                      <option value="">Select property type</option>
                      {PROPERTY_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Listing type *</label>
                    <select value={listingType} onChange={(e) => setListingType(e.target.value)} className={inputClass}>
                      <option value="">Select listing type</option>
                      {LISTING_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Price (ZMW) *</label>
                    <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
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
                      <strong className="block text-slate-900">Available for short stays</strong>
                      Keep this selected only if short-stay bookings are genuinely accepted.
                    </span>
                  </label>
                )}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Location</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>City *</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Area / neighbourhood</label>
                  <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Street address / landmark</label>
                  <input value={addressText} onChange={(e) => setAddressText(e.target.value)} className={inputClass} />
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Property facts</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Bedrooms</label>
                  <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bathrooms *</label>
                  <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Size (m²)</label>
                  <input type="number" min="0" step="0.01" value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Parking spaces *</label>
                  <input type="number" min="0" value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Water source *</label>
                  <select value={waterSource} onChange={(e) => setWaterSource(e.target.value)} className={inputClass}>
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
                  <select value={powerBackup} onChange={(e) => setPowerBackup(e.target.value)} className={inputClass}>
                    <option value="">Select actual status</option>
                    <option value="NONE">No backup</option>
                    <option value="SOLAR">Solar</option>
                    <option value="INVERTER">Inverter</option>
                    <option value="GENERATOR">Generator</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Furnished', furnished, setFurnished],
                  ['Pets allowed', petsAllowed, setPetsAllowed],
                  ['Internet available', internetAvailable, setInternetAvailable],
                ].map(([label, checked, setter]: any) => (
                  <label key={label} className="flex items-center gap-3 border border-slate-200 p-4 text-sm text-slate-700">
                    <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className={labelClass}>Amenities</label>
                  <input value={amenities} onChange={(e) => setAmenities(e.target.value)} className={inputClass} placeholder="Confirmed amenities, separated by commas" />
                </div>
                <div>
                  <label className={labelClass}>Security features</label>
                  <input value={securityFeatures} onChange={(e) => setSecurityFeatures(e.target.value)} className={inputClass} placeholder="Confirmed security features, separated by commas" />
                </div>
                <div>
                  <label className={labelClass}>Property rules</label>
                  <input value={rules} onChange={(e) => setRules(e.target.value)} className={inputClass} placeholder="Real rules or restrictions, separated by commas" />
                </div>
                <div>
                  <label className={labelClass}>Virtual tour URL</label>
                  <input value={virtualTourUrl} onChange={(e) => setVirtualTourUrl(e.target.value)} className={inputClass} placeholder="Leave blank if there is no real virtual tour" />
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Property photos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep only photos of the actual property. The first image is the main listing photo.
              </p>

              <div className="mt-5 border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input
                  id="edit-property-images"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <label htmlFor="edit-property-images" className="cursor-pointer text-sm font-semibold text-[#0F2B46]">
                  {uploading ? 'Uploading…' : 'Add more real property photos'}
                </label>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div key={image.src + index} className="relative overflow-hidden border border-slate-200 bg-slate-100">
                    <div className="aspect-[4/3]">
                      <img src={image.src} alt={`Property photo ${index + 1}`} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-white p-2">
                      <div className="text-xs font-medium text-slate-500">
                        {index === 0 ? 'Main photo' : 'Photo ' + (index + 1)}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="border border-slate-200 px-2 py-1 text-xs disabled:opacity-30">←</button>
                        <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="border border-slate-200 px-2 py-1 text-xs disabled:opacity-30">→</button>
                        <button
                          type="button"
                          onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                          className="border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {status === 'APPROVED' && (
              <section className="border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-950">Availability</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage genuine availability dates for this approved property.
                </p>
                <div className="mt-5">
                  <AvailabilityManager propertyId={params.id} />
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/dashboard/properties')}
                className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || uploading || images.length === 0}
                onClick={saveChanges}
                className="bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save & submit for review'}
              </button>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Listing preview</div>

              <div className="mt-4 aspect-[4/3] overflow-hidden bg-slate-100">
                {images[0]?.src ? (
                  <img src={images[0].src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
              </div>

              <h2 className="mt-4 font-semibold text-slate-950">{title || 'Property title'}</h2>
              <p className="mt-1 text-sm text-slate-500">{[area, city].filter(Boolean).join(', ') || 'Location'}</p>
              <div className="mt-3 text-xl font-bold text-[#0F2B46]">
                K{Number(price || 0).toLocaleString()}
                {listingType === 'RENT' ? <span className="text-sm font-medium text-slate-500"> / month</span> : null}
              </div>
            </section>

            <section className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold text-slate-950">What happens after saving?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Owner and agent changes are moved to Pending Review. An admin checks the updated information before the listing becomes or remains public.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
