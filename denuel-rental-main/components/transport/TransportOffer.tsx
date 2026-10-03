"use client";
import React, { useEffect, useState } from 'react';
import { useRealtime } from '../realtime/RealtimeProvider';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function TransportOffer() {
  const rt = useRealtime();
  const [offer, setOffer] = useState<any|null>(null);
  const [show, setShow] = useState(false);

  useEffect(()=>{
    const channel = `tenant:${(window as any).__DENUEL_USER_ID || 'guest'}`;
    rt.join(channel);
    // open a listener on the global WS through window (simple approach)
    const onMessage = (ev:any)=>{
      try {
        const data = JSON.parse(ev?.data || '{}');
        if (data.event === 'booking_confirmed') {
          setOffer(data.data);
          setShow(true);
        }
      } catch(e){
        console.warn('Invalid transport offer message', e);
      }
    };
    (window as any).addEventListener('message', onMessage);
    return () => {
      (window as any).removeEventListener('message', onMessage);
      try { rt.leave(channel); } catch (e) { /* ignore */ }
    };
  },[rt]);

  async function estimate() {
    if (!offer) return;
    const res = await axios.post('/api/transport/estimate', { pickupLat: offer.pickupLat || 0, pickupLng: offer.pickupLng || 0, dropoffLat: offer.dropoffLat, dropoffLng: offer.dropoffLng, vehicleType: 'VAN' });
    setOffer((o:any)=>({ ...o, estimate: res.data }));
  }

  async function requestTransport() {
    if (!offer) return;
    await axios.post('/api/transport/request', { propertyId: offer.propertyId, pickupLat: offer.pickupLat || 0, pickupLng: offer.pickupLng || 0, dropoffLat: offer.dropoffLat, dropoffLng: offer.dropoffLng, vehicleType: 'VAN' });
    setShow(false);
  }

  if (!show || !offer) return null;

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="fixed bottom-6 right-6 w-96 bg-white rounded shadow p-4">
      <h3 className="font-bold">Need transport to move?</h3>
      <p className="text-sm text-gray-600">Dropoff: {offer.dropoffLat?.toFixed?.(3)},{offer.dropoffLng?.toFixed?.(3)}</p>
      <div className="mt-2">
        <button className="px-3 py-1 bg-blue-600 text-white rounded mr-2" onClick={estimate}>Show estimate</button>
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={requestTransport}>Request transport</button>
      </div>
      {offer.estimate && (
        <pre className="mt-3 text-xs bg-gray-50 p-2 rounded">{JSON.stringify(offer.estimate, null, 2)}</pre>
      )}
    </motion.div>
  );
}
