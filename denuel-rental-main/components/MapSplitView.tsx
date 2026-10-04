"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { motion } from 'framer-motion';
import Link from 'next/link';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapSplitView({ properties, listingType = 'RENT' }: { properties: any[]; listingType?: 'RENT' | 'SALE' }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const [bboxChanged, setBboxChanged] = useState(false);
  const [visibleItems, setVisibleItems] = useState<any[]>(properties || []);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !mapboxgl.accessToken) return;
    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [28.281, -15.416],
      zoom: 11,
    });

    mapInstance.current.addControl(new mapboxgl.NavigationControl());

    mapInstance.current.on('load', () => {
      setMapLoaded(true);
    });

    mapInstance.current.on('moveend', () => {
      setBboxChanged(true);
    });

    // click handler for clusters and points
    mapInstance.current.on('click', (e: any) => {
      const features = mapInstance.current.queryRenderedFeatures(e.point, { layers: ['unclustered-point', 'clusters'] });
      if (!features || features.length === 0) return;
      const f = features[0];
      if (f.layer.id === 'clusters') {
        const clusterId = f.properties.cluster_id;
        (mapInstance.current.getSource('properties') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          mapInstance.current.easeTo({ center: f.geometry.coordinates, zoom });
        });
      } else if (f.layer.id === 'unclustered-point') {
        const props = f.properties && JSON.parse(f.properties.payload || '{}');
        // fly to and open a popup
        mapInstance.current.flyTo({ center: [props.longitude, props.latitude], zoom: 14 });
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = String(props.title || 'Property');
        const price = document.createElement('div');
        price.textContent = `K${Number(props.price || 0).toLocaleString()}`;
        popup.append(title, price);

        new mapboxgl.Popup()
          .setLngLat([props.longitude, props.latitude])
          .setDOMContent(popup)
          .addTo(mapInstance.current);
      }
    });

    return () => mapInstance.current?.remove();
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    const mappable = (properties || []).filter((p: any) => typeof p.longitude === 'number' && typeof p.latitude === 'number');
    const geojson = {
      type: 'FeatureCollection',
      features: mappable.map((p: any) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: { payload: JSON.stringify(p) }
      }))
    };

    if (mapInstance.current.getSource('properties')) {
      (mapInstance.current.getSource('properties') as any).setData(geojson);
    } else {
      mapInstance.current.addSource('properties', { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });

      mapInstance.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#f97316',
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30]
        }
      });

      mapInstance.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 }
      });

      mapInstance.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: { 'circle-color': '#ef4444', 'circle-radius': 7 }
      });
    }

    setVisibleItems(properties);
  }, [properties, mapLoaded]);

  async function searchThisArea() {
    if (!mapInstance.current) return;
    const bounds = mapInstance.current.getBounds();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    const res = await fetch(`/api/search?listingType=${listingType}&minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}&page=1&pageSize=100`);
    if (!res.ok) return;
    const json = await res.json();
    setVisibleItems(Array.isArray(json.items) ? json.items : []);
    // update source
    const source = mapInstance.current.getSource('properties');
    if (source) {
      const geojson = { type: 'FeatureCollection', features: (json.items||[]).map((p: any) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }, properties: { payload: JSON.stringify(p) } })) };
      source.setData(geojson);
    }
    setBboxChanged(false);
  }

  if (!mapboxgl.accessToken) {
    return (
      <div className="border border-slate-200 bg-slate-50 p-8 text-center">
        <h3 className="font-semibold text-slate-950">Map view is unavailable</h3>
        <p className="mt-2 text-sm text-slate-600">Use the property list while map access is being configured.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 relative">
        <div className="h-[600px] rounded shadow overflow-hidden" ref={mapRef} />
        {bboxChanged && (
          <div className="absolute top-4 left-4 z-30">
            <button onClick={searchThisArea} className="bg-white px-4 py-2 rounded shadow">Search this area</button>
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <div className="space-y-4">
          {/* listing list will be placed here in usage */}
          {visibleItems.length ? visibleItems.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
              <Link href={'/property/' + p.id} className="block border border-slate-200 bg-white p-4 transition hover:border-slate-400">
                <div className="font-semibold text-slate-950">{p.title}</div>
                <div className="mt-1 text-sm text-slate-500">{[p.area, p.city].filter(Boolean).join(', ') || p.city || 'Zambia'}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">K{p.price?.toLocaleString()}</div>
              </Link>
            </motion.div>
          )) : (
            <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No properties with map coordinates are available in this area.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
