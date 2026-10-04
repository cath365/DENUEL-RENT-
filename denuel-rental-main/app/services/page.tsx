import Link from 'next/link';
import Header from '@/components/Header';
import ServicesMarketplace from '@/components/ServicesMarketplace';

export const metadata = {
  title: 'Property Services | DENUEL',
  description: 'Find property service providers across Zambia.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Property services</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Find cleaners, movers, electricians, plumbers, security providers and other professionals for your property.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/services/register" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Join as a provider</Link>
              <Link href="/services/dashboard" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Provider dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ServicesMarketplace />
      </main>
    </div>
  );
}
