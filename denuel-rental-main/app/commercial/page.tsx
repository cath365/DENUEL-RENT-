import Header from '../../components/Header';
import ListingCard from '../../components/ListingCard';
import prisma from '../../lib/prisma';

export const metadata = { title: 'Commercial Property in Zambia | DENUEL', description: 'Find offices, shops, warehouses and commercial property across Zambia.' };

export default async function CommercialPage({ searchParams }: { searchParams?: { q?: string; priceMin?: string; priceMax?: string } }) {
  const q = searchParams?.q?.trim();
  const min = Number(searchParams?.priceMin || 0) || 0;
  const max = Number(searchParams?.priceMax || 0) || undefined;
  const properties = await prisma.property.findMany({
    where: { status: 'APPROVED', propertyType: 'COMMERCIAL', price: { gte: min, ...(max ? { lte: max } : {}) }, ...(q ? { OR: [{ city: { contains: q } }, { area: { contains: q } }, { title: { contains: q } }] } : {}) },
    include: { images: { orderBy: { sortOrder: 'asc' } }, owner: { select: { id: true, name: true, phone: true } } }, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }], take: 60
  });
  return <div className="min-h-screen bg-slate-50"><Header /><section className="bg-slate-950 py-14 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-300">Commercial</p><h1 className="mt-2 text-4xl font-black">Property built for business.</h1><p className="mt-3 max-w-2xl text-slate-300">Find offices, shops, warehouses and commercial spaces for rent or purchase across Zambia.</p></div></section><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><h2 className="text-2xl font-black">Commercial listings</h2><p className="mt-1 mb-7 text-sm text-slate-600">{properties.length} approved listings found</p>{properties.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{properties.map(p => <ListingCard key={p.id} property={p} listingType={p.listingType === 'RENT' ? 'RENT' : 'SALE'} />)}</div> : <div className="rounded-3xl bg-white p-12 text-center text-slate-600">No approved commercial listings match this search yet.</div>}</section></div>;
}
