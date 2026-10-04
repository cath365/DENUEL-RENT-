"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../../components/Header';
import AvailabilityManager from '../../../../../components/AvailabilityManager';
import { csrfFetch } from '../../../../../lib/csrf';

const PROPERTY_TYPES = [
  ['APARTMENT', 'Apartment'],
  ['HOUSE', 'House'],
  ['DUPLEX', 'Duplex'],
  ['STUDIO', 'Studio'],
  ['ROOM', 'Room'],
  ['OFFICE', 'Office space'],
  ['SHOP', 'Shop'],
  ['WAREHOUSE', 'Warehouse'],
  ['LAND', 'Land'],
  ['OTHER', 'Other'],
] as const;

const LISTING_TYPES = [
  ['RENT', 'For rent'],
  ['SALE', 'For sale'],
  ['BOTH', 'Rent or sale'],
] as const;

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function statusLabel(status: string) {
  if (status === 'APPROVED') return 'Live';
  if (status === 'PENDING') return 'Pending review';
  if (status === 'REJECTED') return 'Needs changes';
  if (status === 'DRAFT') return 'Draft';
  return status || 'Unknown';
}

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const [images, setImages] = useState<{ src: string; key?: string }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [listingType, setListingType] = useState<'RENT' | 'SALE' | 'BOTH'>('RENT');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressText, setAddressText] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sizeSqm, setSizeSqm] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [parkingSpaces, setParkingSpaces] = useState(0);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [internetAvailable, setInternetAvailable] = useState(false);
  const [waterSource, setWaterSource] = useState<'MUNICIPAL' | 'BOREHOLE' | 'WELL' | 'TANK' | 'OTHER'>('MUNICIPAL');
  const [powerBackup, setPowerBackup] = useState<'NONE' | 'SOLAR' | 'INVERTER' | 'GENERATOR' | 'OTHER'>('NONE');
  const [securityFeatures, setSecurityFeatures] = useState('');
  const [amenities, setAmenities] = useState('');
  const [rules, setRules] = useState('');
  const [isShortStay, setIsShortStay] = useState(false);
  const [isStudentFriendly, setIsStudentFriendly] = useState(false);
  const [virtualTourUrl, setVirtualTourUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/properties/${params.id}`, { credentials: 'same-origin' });
        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!res.ok || !data?.property) {
          throw new Error(data?.error || text || 'Unable to load this property.');
        }

        if (cancelled) return;
        const property = data.property;

        setStatus(property.status || '');
        setTitle(property.title || '');
        setDescription(property.description || '');
        setPropertyType(property.propertyType || 'APARTMENT');
        setListingType((property.listingType as 'RENT' | 'SALE' | 'BOTH') || 'RENT');
        setPrice(String(property.price ?? ''));
        setDeposit(property.deposit != null ? String(property.deposit) : '');
        setCity(property.city || '');
        setArea(property.area || '');
        setAddressText(property.addressText || '');
        setBedrooms(property.bedrooms ?? 1);
        setBathrooms(property.bathrooms ?? 1);
        setSizeSqm(property.sizeSqm != null ? String(property.sizeSqm) : '');
        setFurnished(Boolean(property.furnished));
        setParkingSpaces(property.parkingSpaces ?? 0);
        setPetsAllowed(Boolean(property.petsAllowed));
        setInternetAvailable(Boolean(property.internetAvailable));
        setWaterSource((property.waterSource as any) || 'MUNICIPAL');
        setPowerBackup((property.powerBackup as any) || 'NONE');
        setSecurityFeatures(Array.isArray(property.securityFeatures) ? property.securityFeatures.join(', ') : '');
        setAmenities(Array.isArray(property.amenities) ? property.amenities.join(', ') : '');
        setRules(Array.isArray(property.rules) ? property.rules.join(', ') : '');
        setIsShortStay(Boolean(property.isShortStay));
        setIsStudentFriendly(Boolean(property.isStudentFriendly));
        setVirtualTourUrl(property.virtualTourUrl || '');
        setImages((property.images || []).map((image: any) => ({ src: image.url })));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load this property.');
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
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          setError('Each image must be less than 10MB.');
          continue;
        }

        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        const presignText = await presignRes.text();
        let presignData: any = {};
        try {
          presignData = presignText ? JSON.parse(presignText) : {};
        } catch {
          presignData = {};
        }

        if (presignRes.status === 401) {
          router.push(`/auth/login?redirect=/dashboard/properties/${params.id}/edit&reason=session`);
          return;
        }

        if (!presignRes.ok) {
          setError(presignData?.error || presignText || 'Unable to prepare the image upload.');
          continue;
        }

        if (presignData.useDirectUpload) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('key', presignData.key);

          const uploadRes = await fetch('/api/uploads/direct', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData,
          });
          const uploadText = await uploadRes.text();
          let uploadData: any = {};
          try {
            uploadData = uploadText ? JSON.parse(uploadText) : {};
          } catch {
            uploadData = {};
          }

          if (uploadRes.status === 401) {
            router.push(`/auth/login?redirect=/dashboard/properties/${params.id}/edit&reason=session`);
            return;
          }

          if (uploadRes.ok && uploadData?.publicUrl) {
            setImages((current) => [...current, { src: uploadData.publicUrl, key: uploadData.key }]);
          } else {
            setError(uploadData?.error || uploadText || `Unable to upload ${file.name}.`);
          }
          continue;
        }

        if (!presignData.url) {
          setError('Upload URL was not returned.');
          continue;
        }

        const putRes = await fetch(presignData.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!putRes.ok) {
          setError(`Unable to upload ${file.name}.`);
          continue;
        }

        const verifyRes = await fetch('/api/uploads/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: presignData.key }),
        });
        const verifyText = await verifyRes.text();
        let verifyData: any = {};
        try {
          verifyData = verifyText ? JSON.parse(verifyText) : {};
        } catch {
          verifyData = {};
        }

        if (verifyRes.ok && verifyData?.publicUrl) {
          setImages((current) => [...current, { src: verifyData.publicUrl, key: presignData.key }]);
        } else {
          setError(verifyData?.error || verifyText || `Unable to verify ${file.name}.`);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError('');

    if (title.trim().length < 3 || description.trim().length < 10 || !city.trim() || Number(price) <= 0) {
      setError('Complete the required title, description, city and price fields before saving.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        propertyType,
        listingType,
        price: Number(price),
        deposit: deposit ? Number(deposit) : undefined,
        city: city.trim(),
        area: area.trim() || null,
        addressText: addressText.trim() || null,
        bedrooms,
        bathrooms,
        sizeSqm: sizeSqm ? Number(sizeSqm) : null,
        furnished,
        parkingSpaces,
        petsAllowed,
        internetAvailable,
        waterSource,
        powerBackup,
        securityFeatures: splitCsv(securityFeatures),
        amenities: splitCsv(amenities),
        rules: splitCsv(rules),
        isShortStay,
        isStudentFriendly,
        virtualTourUrl: virtualTourUrl.trim() || null,
        images: images.map((image) => image.src),
      };

      const res = await csrfFetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/dashboard/properties/${params.id}/edit&reason=session`);
        return;
      }

      if (!res.ok || !data?.property) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : text || 'Unable to save property changes.'
        );
      }

      router.push('/dashboard/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save property changes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-8 w-52 animate-pulse bg-slate-200" />
          <div className="mt-6 h-96 animate-pulse bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <button type="button" onClick={() => router.push('/dashboard/properties')} className="text-sm font-medium text-slate-500 hover:text-slate-950">
              ← Back to properties
            </button>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em]">Edit property</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>Current status: <strong className="text-slate-800">{statusLabel(status)}</strong></span>
              {(status === 'APPROVED' || status === 'REJECTED') && (
                <span>Saving changes will send this listing back for review.</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex w-fit items-center justify-center bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Listing details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                  Property title
                  <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                  Description
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={10} rows={5} className="mt-2 w-full border border-slate-300 p-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Property type
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3">
                    {PROPERTY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Listing type
                  <select value={listingType} onChange={(e) => setListingType(e.target.value as any)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3">
                    {LISTING_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Price (ZMW)
                  <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Deposit (ZMW)
                  <input type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Location</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  City
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Area
                  <input value={area} onChange={(e) => setArea(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Address / landmark
                  <input value={addressText} onChange={(e) => setAddressText(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Property features</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Bedrooms
                  <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Bathrooms
                  <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Size (m²)
                  <input type="number" min="1" value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Parking spaces
                  <input type="number" min="0" value={parkingSpaces} onChange={(e) => setParkingSpaces(Number(e.target.value))} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Water source
                  <select value={waterSource} onChange={(e) => setWaterSource(e.target.value as any)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3">
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="BOREHOLE">Borehole</option>
                    <option value="WELL">Well</option>
                    <option value="TANK">Tank</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Power backup
                  <select value={powerBackup} onChange={(e) => setPowerBackup(e.target.value as any)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3">
                    <option value="NONE">None</option>
                    <option value="SOLAR">Solar</option>
                    <option value="INVERTER">Inverter</option>
                    <option value="GENERATOR">Generator</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['Furnished', furnished, setFurnished],
                  ['Pets allowed', petsAllowed, setPetsAllowed],
                  ['Internet available', internetAvailable, setInternetAvailable],
                  ['Student friendly', isStudentFriendly, setIsStudentFriendly],
                  ['Short-stay allowed', isShortStay, setIsShortStay],
                ].map(([label, checked, setter]: any) => (
                  <label key={label} className="flex items-center gap-3 border border-slate-200 p-3 text-sm text-slate-700">
                    <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Amenities
                  <input value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="Pool, gym, borehole..." className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Security features
                  <input value={securityFeatures} onChange={(e) => setSecurityFeatures(e.target.value)} placeholder="CCTV, electric fence, guard..." className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  House rules
                  <input value={rules} onChange={(e) => setRules(e.target.value)} placeholder="No smoking, quiet hours..." className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Virtual tour URL
                  <input value={virtualTourUrl} onChange={(e) => setVirtualTourUrl(e.target.value)} placeholder="https://..." className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold">Photos</h2>
                <p className="mt-1 text-sm text-slate-500">The first image is used as the main property photo.</p>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => handleFiles(e.target.files)}
                className="mt-5 block w-full border border-slate-300 bg-white p-3 text-sm"
              />
              {uploading && <div className="mt-2 text-sm text-slate-500">Uploading photos…</div>}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div key={image.src + index} className="relative overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={image.src} className="aspect-[4/3] w-full object-cover" alt="" />
                    {index === 0 && <span className="absolute left-2 top-2 bg-slate-950 px-2 py-1 text-xs font-semibold text-white">Main photo</span>}
                    <div className="grid grid-cols-3 border-t border-slate-200 bg-white">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => setImages((current) => {
                          const next = [...current];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          return next;
                        })}
                        className="p-2 text-sm disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => setImages((current) => {
                          const next = [...current];
                          [next[index + 1], next[index]] = [next[index], next[index + 1]];
                          return next;
                        })}
                        className="border-x border-slate-200 p-2 text-sm disabled:opacity-30"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                        className="p-2 text-sm font-medium text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <AvailabilityManager propertyId={params.id} />
          </div>

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <section className="border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</div>
              {images[0]?.src && <img src={images[0].src} alt="" className="mt-4 aspect-[16/10] w-full object-cover" />}
              <div className="mt-4 font-semibold">{title || 'Property title'}</div>
              <div className="mt-1 text-sm text-slate-500">{[area, city].filter(Boolean).join(', ') || 'Location'}</div>
              <div className="mt-3 text-2xl font-bold">K{Number(price || 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-slate-500">{listingType === 'SALE' ? 'For sale' : isShortStay ? 'Short stay' : listingType === 'BOTH' ? 'Rent or sale' : 'For rent'}</div>
            </section>

            <section className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold">Review policy</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Changes to a live or rejected listing are sent back to pending review before they appear publicly.
              </p>
            </section>

            <button
              type="button"
              onClick={save}
              disabled={saving || uploading}
              className="w-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving changes…' : 'Save changes'}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
