import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import RetryButton from '../components/RetryButton';
import PersonalizedDiscovery from '../components/PersonalizedDiscovery';
import prisma from '../lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DENUEL | Zambia Property & Living Platform',
  description: 'Find, verify, rent, buy and manage property across Zambia. Explore homes, land, commercial property, agents, services and market insights.',
};

const cities = [
  ['Lusaka', 'Capital living, rentals, land and commercial property'],
  ['Kitwe', 'Copperbelt homes and investment property'],
  ['Ndola', 'Residential and commercial opportunities'],
  ['Livingstone', 'Homes, land and hospitality opportunities'],
  ['Solwezi', 'Growing residential and business market'],
  ['Kabwe', 'Homes, plots and affordable property options'],
];

const areas = ['Kabulonga', 'Ibex Hill', 'Roma', 'Woodlands', 'Chalala', 'New Kasama', 'Meanwood', 'Makeni', 'Salama Park'];

function Arrow() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>;
}

export default async function Home() {
  let rentals: any[] = [];
  let sales: any[] = [];
  let counts = { properties: 0, rentals: 0, sales: 0, agents: 0 };
  let cityCounts: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [r, s, properties, rentalCount, saleCount, agents, grouped] = await Promise.all([
      prisma.property.findMany({ where: { status: 'APPROVED', listingType: { in: ['RENT', 'BOTH'] } }, include: { images: { orderBy: { sortOrder: 'asc' } }, owner: { select: { id: true, name: true, phone: true } } }, take: 8, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] }),
      prisma.property.findMany({ where: { status: 'APPROVED', listingType: { in: ['SALE', 'BOTH'] } }, include: { images: { orderBy: { sortOrder: 'asc' } }, owner: { select: { id: true, name: true, phone: true } } }, take: 4, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] }),
      prisma.property.count({ where: { status: 'APPROVED' } }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['RENT', 'BOTH'] } } }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['SALE', 'BOTH'] } } }),
      prisma.user.count({ where: { role: { in: ['AGENT', 'LANDLORD'] } } }),
      prisma.property.groupBy({ by: ['city'], where: { status: 'APPROVED' }, _count: { _all: true } }),
    ]);
    rentals = r; sales = s; counts = { properties, rentals: rentalCount, sales: saleCount, agents };
    cityCounts = Object.fromEntries(grouped.map((g: any) => [g.city.toLowerCase(), g._count._all]));
  } catch (e) {
    console.error('Homepage data error', e);
    error = 'Live property data is temporarily unavailable.';
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,.2),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">Built for property decisions in Zambia</div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Find a place that works for <span className="text-blue-400">your life.</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Buy, rent, sell and manage property across Zambia with verified listings, local market tools and one connected property platform.</p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl"><SearchBar /></div>
          <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <span>✓ ZMW pricing</span><span>✓ Zambia-focused locations</span><span>✓ Property verification tools</span><span>✓ WhatsApp-ready contact</span>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Find', 'Rent, buy, land & commercial', '/rent'],
            ['Verify', 'Listings, people & documents', '/safety-tips'],
            ['Transact', 'Viewings, applications & rent', '/renter-hub'],
            ['Manage', 'Landlord, tenant & agent tools', '/landlord'],
          ].map(([title, text, href]) => <Link key={title} href={href} className="group bg-white px-6 py-7 hover:bg-slate-50"><div className="flex items-center justify-between"><div><div className="font-bold text-slate-950">{title}</div><div className="mt-1 text-sm text-slate-500">{text}</div></div><Arrow /></div></Link>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Discover Zambia</p><h2 className="mt-2 text-3xl font-black tracking-tight">Explore property by city</h2><p className="mt-2 text-slate-600">Start broad, then narrow your search by area, budget and property type.</p></div><Link href="/rent" className="inline-flex items-center gap-2 font-semibold text-blue-600">View all listings <Arrow /></Link></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(([city, text], i) => <Link href={`/rent?q=${encodeURIComponent(city)}`} key={city} className={`group relative min-h-[190px] overflow-hidden rounded-3xl p-6 ${i === 0 ? 'bg-blue-600 text-white lg:col-span-2' : 'bg-slate-100 text-slate-950'}`}><div className="relative z-10 flex h-full flex-col justify-between"><div><div className="text-2xl font-black">{city}</div><p className={`mt-2 max-w-md text-sm ${i === 0 ? 'text-blue-100' : 'text-slate-600'}`}>{text}</p></div><div className="mt-8 flex items-center gap-2 text-sm font-semibold">{cityCounts[city.toLowerCase()] ? `${cityCounts[city.toLowerCase()]} live listings` : 'Explore properties'} <Arrow /></div></div><div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10 transition group-hover:scale-125" /></Link>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">{areas.map(area => <Link href={`/rent?q=${encodeURIComponent(area)}`} key={area} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600">{area}</Link>)}</div>
      </section>

      <PersonalizedDiscovery />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-950 p-8 text-white lg:col-span-2"><div className="max-w-xl"><div className="inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">Ask DENUEL</div><h2 className="mt-5 text-3xl font-black">Search the way you naturally speak.</h2><p className="mt-3 text-slate-300">Try requests like “3-bedroom house in Ibex Hill under K10,000 with solar and parking.” DENUEL turns your needs into property filters.</p><Link href="/ask-denuel" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Try smart search <Arrow /></Link></div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8"><div className="text-sm font-bold text-emerald-600">Market intelligence</div><h3 className="mt-2 text-2xl font-black">Make decisions with context.</h3><p className="mt-3 text-sm leading-6 text-slate-600">Compare prices, review valuation data and understand neighbourhood trends before you commit.</p><Link href="/market" className="mt-6 inline-flex items-center gap-2 font-semibold text-slate-950">Open market insights <Arrow /></Link></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Rent</p><h2 className="mt-2 text-3xl font-black">Latest rental opportunities</h2><p className="mt-2 text-slate-600">{counts.rentals ? `${counts.rentals} approved rental listings available.` : 'Browse approved rental listings.'}</p></div><Link href="/rent" className="hidden items-center gap-2 font-semibold text-blue-600 sm:flex">See all <Arrow /></Link></div>
        {error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}<div className="mt-3"><RetryButton /></div></div> : rentals.length ? <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{rentals.map(p => <ListingCard key={p.id} property={p} listingType="RENT" />)}</div> : <div className="mt-8 rounded-3xl bg-slate-50 p-10 text-center text-slate-600">No approved rentals are available yet. <Link href="/dashboard/properties/new" className="font-semibold text-blue-600">List a property</Link>.</div>}
      </section>

      {sales.length > 0 && <section className="border-y border-slate-200 bg-slate-50 py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-600">Buy</p><h2 className="mt-2 text-3xl font-black">Property for sale</h2></div><Link href="/buy" className="inline-flex items-center gap-2 font-semibold text-emerald-700">See all <Arrow /></Link></div><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{sales.map(p => <ListingCard key={p.id} property={p} listingType="SALE" />)}</div></div></section>}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">One property platform</p><h2 className="mt-2 text-3xl font-black">Stay useful after the property search.</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">DENUEL connects discovery with viewings, applications, lease tools, payments, maintenance and property services.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Renter Hub', 'Saved homes, applications, rent payments, documents and support.', '/renter-hub', '01'],
            ['Landlord Manager', 'Leases, rent collection, maintenance, expenses and tenant screening.', '/landlord', '02'],
            ['Agent Network', 'Find property professionals, listings, reviews and local expertise.', '/agents', '03'],
            ['Home Services', 'Connect with service providers for repairs, moving and property care.', '/services', '04'],
          ].map(([title, text, href, number]) => <Link href={href} key={title} className="group rounded-3xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-xl"><div className="text-xs font-black text-slate-400">{number}</div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-600">Open <Arrow /></div></Link>)}
        </div>
      </section>

      <section className="bg-blue-600 py-16 text-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.3fr_.7fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-200">For owners & professionals</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">List, verify and manage property from one place.</h2><p className="mt-4 max-w-2xl text-blue-100">Publish property, receive inquiries, manage clients, track rent, handle maintenance and access property analytics without leaving DENUEL.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><Link href="/dashboard/properties/new" className="rounded-xl bg-white px-5 py-3 text-center font-bold text-blue-700">List a property</Link><Link href="/landlord" className="rounded-xl border border-white/30 px-5 py-3 text-center font-bold text-white">Open landlord tools</Link></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><div className="grid gap-4 rounded-3xl bg-slate-950 p-8 text-white sm:grid-cols-2 lg:grid-cols-4"><div><div className="text-3xl font-black">{counts.properties.toLocaleString()}</div><div className="mt-1 text-sm text-slate-400">Approved properties</div></div><div><div className="text-3xl font-black">{counts.rentals.toLocaleString()}</div><div className="mt-1 text-sm text-slate-400">Rental opportunities</div></div><div><div className="text-3xl font-black">{counts.sales.toLocaleString()}</div><div className="mt-1 text-sm text-slate-400">Properties for sale</div></div><div><div className="text-3xl font-black">{counts.agents.toLocaleString()}</div><div className="mt-1 text-sm text-slate-400">Landlords & agents registered</div></div></div></section>
    </div>
  );
}
