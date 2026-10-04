'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  label: string;
};

export default function PropertyLocationMap({ latitude, longitude, label }: Props) {
  const mapNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapNode.current || typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    new mapboxgl.Marker({ color: '#2563eb' })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(label))
      .addTo(map);

    return () => map.remove();
  }, [latitude, longitude, label]);

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <div className="flex h-64 items-center justify-center border border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
        Map coordinates have not been added for this property.
      </div>
    );
  }

  return <div ref={mapNode} className="h-72 w-full border border-slate-200 bg-slate-100" />;
}
