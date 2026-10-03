"use client";
import React, { useState } from 'react';
import { csrfFetch } from '../lib/csrf';

function splitCsv(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface ImageData {
  src: string;
  key?: string;
  is360: boolean;
  roomName: string;
}

export default function CreatePropertyForm({ onCreated }: { onCreated?: () => void }) {
  const [listingType, setListingType] = useState<'RENT' | 'SALE' | 'BOTH'>('RENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          setMessage('Each image must be less than 10MB');
          continue;
        }
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const presignJson = await presignRes.json();
        if (!presignJson?.url) {
          setMessage('Upload error: unable to get presigned url');
          continue;
        }

        // Check if using direct upload (local storage) or S3
        if (presignJson.useDirectUpload) {
          // Direct upload to server
          const formData = new FormData();
          formData.append('file', file);
          formData.append('key', presignJson.key);
          
          const uploadRes = await fetch('/api/uploads/direct', {
            method: 'POST',
            body: formData,
          });
          const uploadJson = await uploadRes.json();
          
          if (uploadJson?.publicUrl) {
            setImages((s) => [...s, { src: uploadJson.publicUrl, key: uploadJson.key, is360: false, roomName: '' }]);
          } else {
            setMessage('Upload failed for ' + file.name);
          }
        } else {
          // S3 presigned URL upload
          const put = await fetch(presignJson.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          if (!put.ok) {
            setMessage('Upload failed for ' + file.name);
            continue;
          }
          const verifyRes = await fetch('/api/uploads/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: presignJson.key }),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyJson?.publicUrl) {
            await fetch('/api/uploads/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: presignJson.key }),
            });
            setMessage('Upload failed validation for ' + file.name);
            continue;
          }
          setImages((s) => [...s, { src: verifyJson.publicUrl, key: presignJson.key, is360: false, roomName: '' }]);
        }
      }
    } catch (e: any) {
      setMessage(e?.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const payload = {
      listingType,
      title,
      description,
      price: Number(price),
      deposit: deposit ? Number(deposit) : undefined,
      city,
      area: area.trim() ? area.trim() : undefined,
      addressText: addressText.trim() ? addressText.trim() : undefined,
      bedrooms,
      bathrooms,
      sizeSqm: sizeSqm ? Number(sizeSqm) : undefined,
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
      virtualTourUrl: virtualTourUrl.trim() ? virtualTourUrl.trim() : undefined,
      images: images.map((i) => ({
        url: i.src,
        is360: i.is360,
        roomName: i.roomName.trim() || undefined,
      })),
    };

    const res = await csrfFetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json?.property) {
      setMessage('Property created and published!');
      setListingType('RENT');
      setTitle('');
      setDescription('');
      setPrice('');
      setDeposit('');
      setCity('');
      setArea('');
      setAddressText('');
      setBedrooms(1);
      setBathrooms(1);
      setSizeSqm('');
      setFurnished(false);
      setParkingSpaces(0);
      setPetsAllowed(false);
      setInternetAvailable(false);
      setWaterSource('MUNICIPAL');
      setPowerBackup('NONE');
      setSecurityFeatures('');
      setAmenities('');
      setRules('');
      setIsShortStay(false);
      setIsStudentFriendly(false);
      setVirtualTourUrl('');
      setImages([]);
      onCreated?.();
    } else {
      setMessage(json?.error || 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded shadow">
      {message && <div className="text-sm">{message}</div>}

      {/* Listing Type Selector */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Listing Type</label>
        <select 
          value={listingType} 
          onChange={(e) => setListingType(e.target.value as 'RENT' | 'SALE' | 'BOTH')} 
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="RENT">For Rent</option>
          <option value="SALE">For Sale</option>
          <option value="BOTH">Both (Rent & Sale)</option>
        </select>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" placeholder="Title" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" placeholder="Description" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" placeholder="Price (ZMW)" />
        <input value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full p-2 border rounded" placeholder="Deposit (optional)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2 border rounded" placeholder="City (e.g. Lusaka)" />
        <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full p-2 border rounded" placeholder="Area (optional)" />
        <input value={addressText} onChange={(e) => setAddressText(e.target.value)} className="w-full p-2 border rounded" placeholder="Address / Landmark (optional)" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className="p-2 border rounded" placeholder="Bedrooms" />
        <input type="number" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className="p-2 border rounded" placeholder="Bathrooms" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} className="w-full p-2 border rounded" placeholder="Size (sqm, optional)" />
        <input
          type="number"
          value={parkingSpaces}
          onChange={(e) => setParkingSpaces(Number(e.target.value))}
          className="w-full p-2 border rounded"
          placeholder="Parking spaces"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} /> Furnished
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} /> Pets allowed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={internetAvailable} onChange={(e) => setInternetAvailable(e.target.checked)} /> Internet available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isStudentFriendly} onChange={(e) => setIsStudentFriendly(e.target.checked)} /> Student-friendly
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isShortStay} onChange={(e) => setIsShortStay(e.target.checked)} /> Short-stay allowed
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select value={waterSource} onChange={(e) => setWaterSource(e.target.value as any)} className="w-full p-2 border rounded">
          <option value="MUNICIPAL">Water: Municipal</option>
          <option value="BOREHOLE">Water: Borehole</option>
          <option value="WELL">Water: Well</option>
          <option value="TANK">Water: Tank</option>
          <option value="OTHER">Water: Other</option>
        </select>
        <select value={powerBackup} onChange={(e) => setPowerBackup(e.target.value as any)} className="w-full p-2 border rounded">
          <option value="NONE">Power backup: None</option>
          <option value="SOLAR">Power backup: Solar</option>
          <option value="INVERTER">Power backup: Inverter</option>
          <option value="GENERATOR">Power backup: Generator</option>
          <option value="OTHER">Power backup: Other</option>
        </select>
      </div>

      <input
        value={securityFeatures}
        onChange={(e) => setSecurityFeatures(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Security features (comma-separated)"
      />
      <input value={amenities} onChange={(e) => setAmenities(e.target.value)} className="w-full p-2 border rounded" placeholder="Amenities (comma-separated)" />
      <input value={rules} onChange={(e) => setRules(e.target.value)} className="w-full p-2 border rounded" placeholder="Rules (comma-separated)" />
      <input
        value={virtualTourUrl}
        onChange={(e) => setVirtualTourUrl(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Virtual tour URL (optional)"
      />

      <div>
        <label className="block text-sm font-medium mb-2">Upload images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-1" />
        {uploading && <div className="text-sm text-muted">Uploading...</div>}
        
        {/* Regular Images */}
        {images.filter(img => !img.is360).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Regular Images</h4>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => !img.is360 && (
                <div key={img.src + idx} className="w-32 border rounded overflow-hidden relative bg-gray-50">
                  <img src={img.src} className="w-full h-20 object-cover" alt="" />
                  <div className="p-2 space-y-1">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={img.is360}
                        onChange={(e) => setImages(s => s.map((x, i) => i === idx ? { ...x, is360: e.target.checked } : x))}
                        className="w-3 h-3"
                      />
                      <span className="text-blue-600 font-medium">360° View</span>
                    </label>
                  </div>
                  <div className="absolute left-1 top-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setImages((s) => {
                          const copy = [...s];
                          if (idx > 0) [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                          return copy;
                        })
                      }
                      className="bg-white rounded-full p-1 text-xs shadow"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImages((s) => {
                          const copy = [...s];
                          if (idx < copy.length - 1) [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                          return copy;
                        })
                      }
                      className="bg-white rounded-full p-1 text-xs shadow"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (img.key) {
                        const res = await fetch('/api/uploads/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ key: img.key }),
                        });
                        const json = await res.json();
                        if (!json?.ok) setMessage('Unable to delete image (server)');
                      }
                      setImages((s) => s.filter((x) => x.src !== img.src));
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs shadow hover:bg-red-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 360° Panorama Images */}
        {images.filter(img => img.is360).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              360° Panoramic Views
            </h4>
            <div className="flex gap-3 flex-wrap">
              {images.map((img, idx) => img.is360 && (
                <div key={img.src + idx} className="w-48 border-2 border-blue-300 rounded-lg overflow-hidden relative bg-blue-50">
                  <div className="relative">
                    <img src={img.src} className="w-full h-24 object-cover" alt="" />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      360°
                    </div>
                  </div>
                  <div className="p-2 space-y-2">
                    <input
                      type="text"
                      value={img.roomName}
                      onChange={(e) => setImages(s => s.map((x, i) => i === idx ? { ...x, roomName: e.target.value } : x))}
                      placeholder="Room name (e.g. Living Room)"
                      className="w-full text-xs p-1.5 border rounded"
                    />
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={img.is360}
                        onChange={(e) => setImages(s => s.map((x, i) => i === idx ? { ...x, is360: e.target.checked } : x))}
                        className="w-3 h-3"
                      />
                      <span className="text-blue-600">360° View</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (img.key) {
                        const res = await fetch('/api/uploads/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ key: img.key }),
                        });
                        const json = await res.json();
                        if (!json?.ok) setMessage('Unable to delete image (server)');
                      }
                      setImages((s) => s.filter((x) => x.src !== img.src));
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs shadow hover:bg-red-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button disabled={uploading} className="bg-brand-500 text-white px-4 py-2 rounded">
        Create Property
      </button>
    </form>
  );
}
