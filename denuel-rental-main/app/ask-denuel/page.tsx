'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

function inferQuery(input: string) {
  const text = input.toLowerCase();
  const p = new URLSearchParams();
  let path = text.includes('buy') || text.includes('for sale') ? '/buy' : '/rent';
  if (text.includes('land') || text.includes('plot') || text.includes('farm')) path = '/land';
  if (text.includes('commercial') || text.includes('office') || text.includes('warehouse') || text.includes('shop')) path = '/commercial';
  const bed = text.match(/(\d+)\s*[- ]?bed/); if (bed) p.set('bedrooms', bed[1]);
  const money = text.match(/(?:under|below|max(?:imum)?|budget(?: of)?)\s*k?\s*([\d,]+)/); if (money) p.set('priceMax', money[1].replace(/,/g, ''));
  if (text.includes('furnished')) p.set('furnished', 'true');
  if (text.includes('pet')) p.set('petsAllowed', 'true');
  const known = ['ibex hill','kabulonga','roma','woodlands','chalala','new kasama','meanwood','makeni','salama park','lusaka','kitwe','ndola','livingstone','solwezi','kabwe'];
  const location = known.find(x => text.includes(x)); if (location) p.set('q', location.replace(/\b\w/g, c => c.toUpperCase()));
  return `${path}${p.toString() ? `?${p}` : ''}`;
}

export default function AskDenuelPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const examples = ['3-bedroom house in Ibex Hill under K10,000 with parking', 'Land for sale in Lusaka below K250,000', 'Furnished apartment in Kabulonga under K8,000', 'Commercial office in Lusaka'];
  const go = () => query.trim() && router.push(inferQuery(query));
  return <div className="min-h-screen bg-slate-950"><Header /><main className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><div className="mx-auto max-w-3xl text-center text-white"><div className="inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-300">Smart property search</div><h1 className="mt-6 text-4xl font-black sm:text-6xl">Tell DENUEL what you need.</h1><p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">Use normal language. We translate your request into property filters so you can search faster.</p></div><div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-white p-4 shadow-2xl"><textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } }} rows={4} placeholder="Example: Find me a 3-bedroom house in Ibex Hill under K10,000 with parking..." className="w-full resize-none rounded-2xl border-0 bg-slate-50 p-5 text-lg outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"/><button onClick={go} className="mt-3 w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-700">Find matching properties</button></div><div className="mx-auto mt-8 max-w-3xl"><p className="mb-3 text-sm font-semibold text-slate-400">Try an example</p><div className="flex flex-wrap gap-2">{examples.map(e => <button key={e} onClick={() => setQuery(e)} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">{e}</button>)}</div><p className="mt-8 text-xs leading-5 text-slate-500">Smart search currently translates your request into DENUEL filters. It does not invent property data; results come from live approved listings.</p></div></main></div>;
}
