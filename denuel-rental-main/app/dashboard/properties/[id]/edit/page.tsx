"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../../components/Header';
import AvailabilityManager from '../../../../../components/AvailabilityManager';
import { csrfFetch } from '../../../../../lib/csrf';

function splitCsv(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<{ src: string; key?: string }[]>([]);
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

  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/properties/${params.id}`);
      const json = await res.json();
      const p = json.property;
      setTitle(p.title || '');
      setDescription(p.description || '');
      setPrice(String(p.price ?? ''));
      setDeposit(p.deposit != null ? String(p.deposit) : '');
      setCity(p.city || '');
      setArea(p.area || '');
      setAddressText(p.addressText || '');
      setBedrooms(p.bedrooms ?? 1);
      setBathrooms(p.bathrooms ?? 1);
      setSizeSqm(p.sizeSqm != null ? String(p.sizeSqm) : '');
      setFurnished(!!p.furnished);
      setParkingSpaces(p.parkingSpaces ?? 0);
      setPetsAllowed(!!p.petsAllowed);
      setInternetAvailable(!!p.internetAvailable);
      setWaterSource((p.waterSource as any) || 'MUNICIPAL');
      setPowerBackup((p.powerBackup as any) || 'NONE');
      setSecurityFeatures(Array.isArray(p.securityFeatures) ? p.securityFeatures.join(', ') : '');
      setAmenities(Array.isArray(p.amenities) ? p.amenities.join(', ') : '');
      setRules(Array.isArray(p.rules) ? p.rules.join(', ') : '');
      setIsShortStay(!!p.isShortStay);
      setIsStudentFriendly(!!p.isStudentFriendly);
      setVirtualTourUrl(p.virtualTourUrl || '');
      setImages((p.images || []).map((img: any) => ({ src: img.url })));
      setLoading(false);
    })();
  }, [params.id]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const presignJson = await presignRes.json();
      const put = await fetch(presignJson.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) continue;
      const verifyRes = await fetch('/api/uploads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: presignJson.key }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson?.publicUrl) continue;
      setImages((s) => [...s, { src: verifyJson.publicUrl, key: presignJson.key }]);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        price: Number(price),
        deposit: deposit ? Number(deposit) : undefined,
        city,
        area,
        addressText,
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
        virtualTourUrl,
        images: images.map((i) => i.src),
      };
      const res = await csrfFetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.property) {
        router.push('/dashboard/properties');
      } else {
        alert(json?.error || 'Error saving');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <h2 className="text-2xl font-semibold mb-4">Edit Property</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <input className="w-full p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea
            className="w-full p-2 border rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="w-full p-2 border rounded" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (ZMW)" />
            <input className="w-full p-2 border rounded" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Deposit (optional)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="w-full p-2 border rounded" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <input className="w-full p-2 border rounded" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (optional)" />
            <input className="w-full p-2 border rounded" value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder="Address / Landmark (optional)" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className="p-2 border rounded" placeholder="Bedrooms" />
            <input type="number" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className="p-2 border rounded" placeholder="Bathrooms" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="w-full p-2 border rounded" value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} placeholder="Size (sqm, optional)" />
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
            <label className="block text-sm">Upload images</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-1" />
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={img.src + idx} className="w-24 h-24 border rounded overflow-hidden relative">
                  <img src={img.src} className="w-full h-full object-cover" alt="" />
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
                      className="bg-white rounded-full p-1 text-xs"
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
                      className="bg-white rounded-full p-1 text-xs"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (img.key) await fetch('/api/uploads/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: img.key }) });
                      setImages((s) => s.filter((x) => x.src !== img.src));
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <AvailabilityManager propertyId={params.id} />
          </div>

          <div className="mt-4">
            <button disabled={saving} onClick={save} className="bg-brand-500 text-white px-4 py-2 rounded">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <aside className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <div className="text-sm text-muted">Preview</div>
          <div className="mt-4">
            <div className="font-semibold">{title}</div>
            <div className="text-muted">{[area, city].filter(Boolean).join(', ') || city}</div>
            <div className="mt-2">K{Number(price || 0).toLocaleString()}</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

