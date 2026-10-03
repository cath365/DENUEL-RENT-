import Header from '../../components/Header';
import ListingCard from '../../components/ListingCard';
import prisma from '../../lib/prisma';

export const metadata = { title: 'Land for Sale & Rent in Zambia | DENUEL', description: 'Discover plots, farms and development land across Zambia.' };

export default async function LandPage({ searchParams }: { searchParams?: { q?: string; priceMin?: string; priceMax?: string } }) {
  const q = searchParams?.q?.trim();
  const min = Number(searchParams?.priceMin || 0) || 0;
  const max = Number(searchParams?.priceMax || 0) || undefined;
  const properties = await prisma.property.findMany({
    where: {
      status: 'APPROVED', propertyType: 'LAND', price: { gte: min, ...(max ? { lte: max } : {}) },
      ...(q ? { OR: [{ city: { contains: q, mode: 'insensitive' } }, { area: { contains: q, mode: 'insensitive' } }, { title: { contains: q, mode: 'insensitive' } }] } : {})
    },
    include: { images: { orderBy: { sortOrder: 'asc' } }, owner: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }], take: 60
  });
  return <div className="min-h-screen bg-slate-50"><Header /><section className="bg-slate-950 py-14 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-300">Land</p><h1 className="mt-2 text-4xl font-black">Find land for your next move.</h1><p className="mt-3 max-w-2xl text-slate-300">Explore residential plots, farms and development land across Zambia. Verify documents and ownership before paying any deposit.</p></div></section><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><div className="mb-7 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black">Available land</h2><p className="mt-1 text-sm text-slate-600">{properties.length} approved listings found</p></div></div>{properties.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{properties.map(p => <ListingCard key={p.id} property={p} listingType={p.listingType === 'RENT' ? 'RENT' : 'SALE'} />)}</div> : <div className="rounded-3xl bg-white p-12 text-center text-slate-600">No approved land listings match this search yet.</div>}</section></div>;
}
