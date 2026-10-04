import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import ListingCard from '../../../components/ListingCard';
import FavoriteButton from '../../../components/FavoriteButton';
import MessageForm from '../../../components/MessageForm';
import ReportListing from '../../../components/ReportListing';
import ViewingScheduler from '../../../components/ViewingScheduler';
import PropertyLocationMap from '../../../components/PropertyLocationMap';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

function formatLocation(property: any) {
  return [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || 'Zambia';
}

function whatsappLink(phone: string, title: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;
  const message = encodeURIComponent(`Hello, I'm interested in "${title}" on DENUEL. Is it still available?`);
  return `https://wa.me/${digits}?text=${message}`;
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  let property: any = null;

  try {
    property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            companyName: true,
            profileImage: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            isIdVerified: true,
            isBusinessVerified: true,
            trustScore: true,
            createdAt: true,
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        floorPlans: { orderBy: { floor: 'asc' } },
        viewingSlots: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  } catch (error) {
    console.error('Property detail query failed', error);
  }

  if (!property) notFound();

  const location = formatLocation(property);
  const images = property.images || [];
  const mainImage =
    images[0]?.url ||
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect fill="%23e2e8f0" width="1200" height="800"/%3E%3Ctext fill="%2364748b" font-family="Arial" font-size="38" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo property image%3C/text%3E%3C/svg%3E';

  const gallery = images.slice(1, 5);
  const isRental = ['RENT', 'BOTH'].includes(property.listingType);
  const whatsapp = property.owner?.phone ? whatsappLink(property.owner.phone, property.title) : null;

  let related: any[] = [];
  try {
    related = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: 'APPROVED',
        city: property.city,
        ...(property.propertyType ? { propertyType: property.propertyType } : {}),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        owner: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    });
  } catch (error) {
    console.error('Related properties query failed', error);
  }

  const facts = [
    ['Bedrooms', property.bedrooms ?? '—'],
    ['Bathrooms', property.bathrooms ?? '—'],
    ['Floor area', property.sizeSqm ? `${property.sizeSqm.toLocaleString()} m²` : 'Not specified'],
    ['Parking', property.parkingSpaces ?? 0],
    ['Property type', humanize(property.propertyType)],
    ['Listing type', humanize(property.listingType)],
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">Home</Link>
          <span>/</span>
          <Link href={isRental ? '/rent' : '/buy'} className="hover:text-slate-950">
            {isRental ? 'Rent' : 'Buy'}
          </Link>
          <span>/</span>
          <span className="text-slate-700">{property.city}</span>
        </nav>

        <section className="grid gap-2 lg:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-[16/9]">
            <Image
              src={mainImage}
              alt={property.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:grid-rows-2">
            {gallery.slice(0, 2).map((image: any) => (
              <div key={image.id} className="relative min-h-[150px] overflow-hidden bg-slate-100">
                <Image src={image.url} alt="" fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
              </div>
            ))}
            {gallery.length === 0 && (
              <>
                <div className="hidden bg-slate-100 lg:block" />
                <div className="hidden bg-slate-100 lg:block" />
              </>
            )}
          </div>
        </section>

        {images.length > 3 && (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.slice(3, 7).map((image: any) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image src={image.url} alt="" fill sizes="25vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="border-b border-slate-200 pb-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="border border-slate-300 px-2.5 py-1">
                      {humanize(property.listingType)}
                    </span>
                    {property.status === 'APPROVED' && (
                      <span className="border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-emerald-800">
                        Approved listing
                      </span>
                    )}
                  </div>

                  <h1 className="max-w-3xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                    {property.title}
                  </h1>
                  <p className="mt-2 text-base text-slate-600">{location}</p>
                </div>

                <div className="shrink-0 sm:text-right">
                  <div className="text-3xl font-bold tracking-[-0.03em]">
                    K{property.price.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {isRental ? 'per month' : 'asking price'}
                  </div>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-y-5 sm:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="mt-1 font-semibold text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <section className="border-b border-slate-200 py-8">
              <h2 className="text-xl font-bold">About this property</h2>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">
                {property.description}
              </div>
            </section>

            <section className="border-b border-slate-200 py-8">
              <h2 className="text-xl font-bold">Utilities and living essentials</h2>
              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  ['Water source', humanize(property.waterSource)],
                  ['Power backup', humanize(property.powerBackup)],
                  ['Internet', property.internetAvailable ? 'Available' : 'Not confirmed'],
                  ['Furnished', property.furnished ? 'Yes' : 'No'],
                  ['Pets allowed', property.petsAllowed ? 'Yes' : 'No'],
                  ['Student friendly', property.isStudentFriendly ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>

              {Array.isArray(property.securityFeatures) && property.securityFeatures.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-900">Security features</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {property.securityFeatures.join(', ')}
                  </p>
                </div>
              )}
            </section>

            {isRental && (
              <section className="border-b border-slate-200 py-8">
                <h2 className="text-xl font-bold">Cost summary</h2>
                <div className="mt-5 max-w-xl divide-y divide-slate-200 border border-slate-200">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-600">Monthly rent</span>
                    <strong>K{property.price.toLocaleString()}</strong>
                  </div>
                  {property.hoaFees ? (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-600">Service / HOA fee</span>
                      <strong>K{property.hoaFees.toLocaleString()}</strong>
                    </div>
                  ) : null}
                  {property.deposit ? (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-600">Deposit</span>
                      <strong>K{property.deposit.toLocaleString()}</strong>
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Utilities and other charges are not included unless specifically stated by the property owner.
                </p>
              </section>
            )}

            {property.floorPlans?.length > 0 && (
              <section className="border-b border-slate-200 py-8">
                <h2 className="text-xl font-bold">Floor plans</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {property.floorPlans.map((plan: any) => (
                    <div key={plan.id} className="border border-slate-200 p-3">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <Image src={plan.imageUrl} alt={plan.name || 'Floor plan'} fill sizes="50vw" className="object-contain" />
                      </div>
                      {plan.name && <div className="mt-3 text-sm font-semibold">{plan.name}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border-b border-slate-200 py-8">
              <h2 className="text-xl font-bold">Location</h2>
              <p className="mb-4 mt-2 text-sm text-slate-500">{location}</p>
              <PropertyLocationMap
                latitude={property.latitude}
                longitude={property.longitude}
                label={property.title}
              />
            </section>

            <section className="py-8">
              <h2 className="text-xl font-bold">Listed by</h2>
              <div className="mt-5 flex items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  {property.owner?.profileImage ? (
                    <Image src={property.owner.profileImage} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                      {(property.owner?.name || 'O').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-950">
                    {property.owner?.companyName || property.owner?.name || 'Property owner'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    {property.owner?.isPhoneVerified && <span>Phone verified</span>}
                    {property.owner?.isIdVerified && <span>ID verified</span>}
                    {property.owner?.isBusinessVerified && <span>Business verified</span>}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:relative">
            <div className="border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <div className="text-sm text-slate-500">Interested in this property?</div>
              <div className="mt-1 text-2xl font-bold">K{property.price.toLocaleString()}</div>
              <div className="mt-1 text-sm text-slate-500">
                {isRental ? 'per month' : 'asking price'}
              </div>

              <div className="mt-5 grid gap-2">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
                  >
                    WhatsApp owner
                  </a>
                )}

                <FavoriteButton propertyId={property.id} />

                {property.viewingSlots?.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="mb-3 text-sm font-semibold text-slate-900">Schedule a viewing</div>
                    <ViewingScheduler propertyId={property.id} propertyTitle={property.title} />
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="mb-3 text-sm font-semibold text-slate-900">Send an enquiry</div>
                <MessageForm receiverId={property.ownerId} propertyId={property.id} />
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <ReportListing propertyId={property.id} />
              </div>
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.025em]">Similar properties in {property.city}</h2>
                <p className="mt-2 text-sm text-slate-500">Other approved listings you may want to compare.</p>
              </div>
              <Link href={isRental ? '/rent' : '/buy'} className="text-sm font-semibold text-blue-700">
                View more
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ListingCard
                  key={item.id}
                  property={item}
                  listingType={item.listingType === 'RENT' ? 'RENT' : 'SALE'}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
