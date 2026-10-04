import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import RetryButton from '../components/RetryButton';
import prisma from '../lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DENUEL | Property in Zambia',
  description: 'Find homes, land and commercial property to rent or buy across Zambia.',
};

const cities = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Solwezi', 'Kabwe'];
const areas = ['Kabulonga', 'Ibex Hill', 'Roma', 'Woodlands', 'Chalala', 'New Kasama', 'Meanwood', 'Makeni', 'Salama Park'];

function Arrow() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export default async function Home() {
  let rentals: any[] = [];
  let sales: any[] = [];
  let counts = { properties: 0, rentals: 0, sales: 0, agents: 0 };
  let cityCounts: Record<string, number> = {};
  let error: string | null = null;

  try {
    const [r, s, properties, rentalCount, saleCount, agents, grouped] = await Promise.all([
      prisma.property.findMany({
        where: { status: 'APPROVED', listingType: { in: ['RENT', 'BOTH'] } },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true } },
        },
        take: 8,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.property.findMany({
        where: { status: 'APPROVED', listingType: { in: ['SALE', 'BOTH'] } },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true } },
        },
        take: 4,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.property.count({ where: { status: 'APPROVED' } }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['RENT', 'BOTH'] } } }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['SALE', 'BOTH'] } } }),
      prisma.user.count({ where: { role: { in: ['AGENT', 'LANDLORD'] } } }),
      prisma.property.groupBy({
        by: ['city'],
        where: { status: 'APPROVED' },
        _count: { _all: true },
      }),
    ]);

    rentals = r;
    sales = s;
    counts = { properties, rentals: rentalCount, sales: saleCount, agents };
    cityCounts = Object.fromEntries(
      grouped.map((g: any) => [g.city.toLowerCase(), g._count._all])
    );
  } catch (e) {
    console.error('Homepage data error', e);
    error = 'Live property data is temporarily unavailable.';
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold text-blue-700">Property across Zambia</p>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[58px]">
                Find your next home, plot or business space.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Search homes for rent, property for sale, land and commercial spaces by city, area and budget.
              </p>
            </div>

            <div className="mt-8 max-w-5xl border border-slate-300 bg-white shadow-sm">
              <SearchBar />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>Popular:</span>
              {['Lusaka', 'Ibex Hill', 'Kabulonga', 'Chalala', 'Kitwe'].map((place) => (
                <Link
                  key={place}
                  href={'/rent?q=' + encodeURIComponent(place)}
                  className="font-medium text-slate-700 underline-offset-4 hover:underline"
                >
                  {place}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0">
            {[
              ['Rent', 'Homes and apartments', '/rent'],
              ['Buy', 'Property for sale', '/buy'],
              ['Land', 'Plots and development land', '/land'],
              ['Commercial', 'Offices, shops and warehouses', '/commercial'],
            ].map(([title, text, href]) => (
              <Link key={title} href={href} className="group px-4 py-6 first:pl-0 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{title}</div>
                    <div className="mt-1 text-sm text-slate-500">{text}</div>
                  </div>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-950">
                    <Arrow />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Browse by city</h2>
              <p className="mt-2 text-sm text-slate-500">Start with the places people search most.</p>
            </div>
            <Link href="/rent" className="hidden items-center gap-2 text-sm font-semibold text-blue-700 sm:flex">
              All listings <Arrow />
            </Link>
          </div>

          <div className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city}
                href={'/rent?q=' + encodeURIComponent(city)}
                className="group border-b border-r border-slate-200 p-5 transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-950">{city}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {cityCounts[city.toLowerCase()]
                        ? cityCounts[city.toLowerCase()] + ' available listings'
                        : 'Explore property'}
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-950">
                    <Arrow />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {areas.map((area) => (
              <Link
                key={area}
                href={'/rent?q=' + encodeURIComponent(area)}
                className="border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                {area}
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Homes for rent</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {counts.rentals ? counts.rentals + ' approved rental listings' : 'Latest approved rentals'}
                </p>
              </div>
              <Link href="/rent" className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                View all <Arrow />
              </Link>
            </div>

            {error ? (
              <div className="mt-7 border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                {error}
                <div className="mt-3">
                  <RetryButton />
                </div>
              </div>
            ) : rentals.length ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {rentals.map((property) => (
                  <ListingCard key={property.id} property={property} listingType="RENT" />
                ))}
              </div>
            ) : (
              <div className="mt-7 border border-slate-200 bg-white p-8 text-sm text-slate-600">
                No rental listings are available yet.{' '}
                <Link href="/dashboard/properties/new" className="font-semibold text-blue-700">
                  List a property
                </Link>
                .
              </div>
            )}
          </div>
        </section>

        {sales.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Property for sale</h2>
                <p className="mt-2 text-sm text-slate-500">Recently approved sale listings.</p>
              </div>
              <Link href="/buy" className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                View all <Arrow />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sales.map((property) => (
                <ListingCard key={property.id} property={property} listingType="SALE" />
              ))}
            </div>
          </section>
        )}

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-3">
            {[
              ['Renters', 'Save properties, manage applications and keep track of rent.', '/renter-hub'],
              ['Property owners', 'List property and manage leases, maintenance and payments.', '/landlord'],
              ['Agents & services', 'Connect with property professionals and home service providers.', '/agents'],
            ].map(([title, text, href]) => (
              <Link
                key={title}
                href={href}
                className="group border-b border-slate-200 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
              >
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{text}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Open <Arrow />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-4 py-12 text-white sm:px-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Have a property to list?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Add your property, manage enquiries and keep your listings in one place.
              </p>
            </div>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex w-fit items-center justify-center bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              List a property
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
            <span>{counts.properties.toLocaleString()} approved properties</span>
            <span>{counts.rentals.toLocaleString()} rentals</span>
            <span>{counts.sales.toLocaleString()} for sale</span>
            <span>{counts.agents.toLocaleString()} landlords and agents</span>
          </div>
        </section>
      </main>
    </div>
  );
}
