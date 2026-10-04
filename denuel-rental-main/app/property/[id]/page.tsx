import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import ListingCard from '@/components/ListingCard';
import FavoriteButton from '@/components/FavoriteButton';
import MessageForm from '@/components/MessageForm';
import ReportListing from '@/components/ReportListing';
import ViewingScheduler from '@/components/ViewingScheduler';
import PropertyLocationMap from '@/components/PropertyLocationMap';
import PropertyApplicationButton from '@/components/PropertyApplicationButton';
import prisma from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatLocation(property: any) {
  return [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || 'Zambia';
}

function whatsappLink(phone: string, title: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;

  const message = encodeURIComponent(
    `Hello, I'm interested in "${title}" on Ng'anda. Is it still available?`
  );

  return `https://wa.me/${digits}?text=${message}`;
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function listFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function formatPrice(property: any) {
  const amount = 'K' + Number(property.price || 0).toLocaleString();

  if (property.listingType === 'RENT') {
    return { amount, suffix: 'per month' };
  }

  if (property.listingType === 'SALE') {
    return { amount, suffix: 'asking price' };
  }

  return { amount, suffix: 'price supplied by lister' };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  let viewer: any = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('denuel_token')?.value;
    if (token) viewer = await getUserFromToken(token);
  } catch {
    viewer = null;
  }

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
            role: true,
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
      },
    });
  } catch (error) {
    console.error('Property detail query failed', error);
  }

  if (!property) notFound();

  const canPreviewPrivate =
    viewer &&
    (viewer.id === property.ownerId || viewer.role === 'ADMIN');

  if (property.status !== 'APPROVED' && !canPreviewPrivate) {
    notFound();
  }

  const isOwner = viewer?.id === property.ownerId;
  const isAdmin = viewer?.role === 'ADMIN';
  const isPrivatePreview = property.status !== 'APPROVED';
  const isRental = property.listingType === 'RENT';
  const isSale = property.listingType === 'SALE';

  const location = formatLocation(property);
  const images = Array.isArray(property.images) ? property.images : [];
  const amenities = listFromJson(property.amenities);
  const rules = listFromJson(property.rules);
  const securityFeatures = listFromJson(property.securityFeatures);
  const price = formatPrice(property);

  const mainImage =
    images[0]?.url ||
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect fill="%23f1f5f9" width="1200" height="800"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="36" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo property image%3C/text%3E%3C/svg%3E';

  const whatsapp =
    property.owner?.phone && property.status === 'APPROVED'
      ? whatsappLink(property.owner.phone, property.title)
      : null;

  let related: any[] = [];

  if (property.status === 'APPROVED') {
    try {
      related = await prisma.property.findMany({
        where: {
          id: { not: property.id },
          status: 'APPROVED',
          city: property.city,
          listingType: property.listingType,
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
  }

  const facts = [
    ['Bedrooms', property.bedrooms ?? '—'],
    ['Bathrooms', property.bathrooms ?? '—'],
    ['Floor area', property.sizeSqm ? `${Number(property.sizeSqm).toLocaleString()} m²` : 'Not supplied'],
    ['Parking', property.parkingSpaces ?? 0],
    ['Property type', humanize(property.propertyType)],
    ['Listing type', humanize(property.listingType)],
  ];

  const verificationChecks = [
    property.owner?.isPhoneVerified ? 'Phone verified' : null,
    property.owner?.isEmailVerified ? 'Email verified' : null,
    property.owner?.isIdVerified ? 'ID verified' : null,
    property.owner?.isBusinessVerified ? 'Business verified' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {isPrivatePreview && (
          <div className="mb-6 border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">
              Private preview · {property.status === 'REJECTED' ? 'Needs changes' : humanize(property.status)}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This property is not visible to the public. Only the owner and administrators can open this preview.
            </p>
            {property.status === 'REJECTED' && property.rejectionReason && (
              <p className="mt-2 text-sm leading-6 text-red-700">
                <strong>Admin feedback:</strong> {property.rejectionReason}
              </p>
            )}
          </div>
        )}

        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[#0F2B46]">Home</Link>
          <span>/</span>
          <Link href={isRental ? '/rent' : '/buy'} className="hover:text-[#0F2B46]">
            {isRental ? 'Rent' : isSale ? 'Buy' : 'Properties'}
          </Link>
          <span>/</span>
          <span className="text-slate-700">{property.city}</span>
        </nav>

        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="grid gap-1 lg:grid-cols-[2fr_1fr]">
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

            <div className="grid grid-cols-2 gap-1 lg:grid-cols-1 lg:grid-rows-2">
              {images.slice(1, 3).map((image: any, index: number) => (
                <div key={image.id || image.url || index} className="relative min-h-[150px] overflow-hidden bg-slate-100">
                  <Image
                    src={image.url}
                    alt={image.roomName || ''}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}

              {images.length < 2 && <div className="hidden bg-slate-100 lg:block" />}
              {images.length < 3 && <div className="hidden bg-slate-100 lg:block" />}
            </div>
          </div>

          {images.length > 3 && (
            <div className="grid grid-cols-2 gap-1 border-t border-white sm:grid-cols-4">
              {images.slice(3, 7).map((image: any, index: number) => (
                <div key={image.id || image.url || index} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={image.url}
                    alt={image.roomName || ''}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>{images.length} real {images.length === 1 ? 'photo' : 'photos'} supplied</span>
            {property.virtualTourUrl && (
              <a
                href={property.virtualTourUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#16A34A]"
              >
                Open virtual tour ↗
              </a>
            )}
          </div>
        </section>

        <section className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-0">
            <section className="border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="border border-slate-300 px-2.5 py-1 text-slate-600">
                      {humanize(property.listingType)}
                    </span>
                    {property.status === 'APPROVED' && (
                      <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        Approved listing
                      </span>
                    )}
                    {property.isShortStay && (
                      <span className="border border-slate-300 px-2.5 py-1 text-slate-600">
                        Short stay available
                      </span>
                    )}
                  </div>

                  <h1 className="max-w-3xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                    {property.title}
                  </h1>
                  <p className="mt-2 text-base text-slate-600">{location}</p>
                  {property.addressText && (
                    <p className="mt-1 text-sm text-slate-500">{property.addressText}</p>
                  )}
                </div>

                <div className="shrink-0 sm:text-right">
                  <div className="text-3xl font-bold tracking-[-0.03em] text-[#0F2B46]">
                    {price.amount}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{price.suffix}</div>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div key={String(label)} className="border-b border-r border-slate-200 p-4">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-bold">Description</h2>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">
                {property.description}
              </div>
            </section>

            {(amenities.length > 0 || rules.length > 0) && (
              <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
                <div className="grid gap-8 sm:grid-cols-2">
                  {amenities.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold">Amenities</h2>
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {amenities.map((amenity) => (
                          <li key={amenity} className="border-b border-slate-100 pb-2">{amenity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rules.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold">Property rules</h2>
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {rules.map((rule) => (
                          <li key={rule} className="border-b border-slate-100 pb-2">{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-bold">Utilities and essentials</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                These details are supplied by the property lister.
              </p>

              <div className="mt-5 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {[
                  ['Water source', humanize(property.waterSource)],
                  ['Power backup', humanize(property.powerBackup)],
                  ['Internet', property.internetAvailable ? 'Available' : 'Not available'],
                  ['Furnished', property.furnished ? 'Yes' : 'No'],
                  ['Pets allowed', property.petsAllowed ? 'Yes' : 'No'],
                  ['Student friendly', property.isStudentFriendly ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-start justify-between gap-5 border-b border-slate-100 py-3">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>

              {securityFeatures.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-900">Security features</div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {securityFeatures.map((feature) => (
                      <li key={feature} className="border-b border-slate-100 pb-2 text-sm text-slate-600">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {(property.deposit != null || property.hoaFees != null) && (
              <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
                <h2 className="text-xl font-bold">{isRental ? 'Cost summary' : 'Additional costs'}</h2>
                <div className="mt-5 max-w-xl divide-y divide-slate-200 border border-slate-200">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-600">{isRental ? 'Monthly rent' : 'Asking price'}</span>
                    <strong>{price.amount}</strong>
                  </div>

                  {property.deposit != null && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-600">Deposit</span>
                      <strong>K{Number(property.deposit).toLocaleString()}</strong>
                    </div>
                  )}

                  {property.hoaFees != null && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-600">Service / HOA fee</span>
                      <strong>K{Number(property.hoaFees).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Only costs explicitly supplied with the listing are shown here. Utilities and other charges may be separate.
                </p>
              </section>
            )}

            {property.floorPlans?.length > 0 && (
              <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
                <h2 className="text-xl font-bold">Floor plans</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {property.floorPlans.map((plan: any) => (
                    <div key={plan.id} className="border border-slate-200 p-3">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <Image
                          src={plan.imageUrl}
                          alt={plan.name || 'Floor plan'}
                          fill
                          sizes="50vw"
                          className="object-contain"
                        />
                      </div>
                      {plan.name && <div className="mt-3 text-sm font-semibold">{plan.name}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-bold">Location</h2>
              <p className="mt-2 text-sm text-slate-500">{location}</p>
              {property.addressText && (
                <p className="mt-1 text-sm text-slate-500">{property.addressText}</p>
              )}
              <div className="mt-5">
                <PropertyLocationMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  label={property.title}
                />
              </div>
            </section>

            <section className="border-x border-b border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-bold">Listed by</h2>

              <div className="mt-5 flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  {property.owner?.profileImage ? (
                    <Image
                      src={property.owner.profileImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                      {(property.owner?.companyName || property.owner?.name || 'O')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-950">
                    {property.owner?.companyName || property.owner?.name || 'Property owner'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {property.owner?.companyName && property.owner?.name
                      ? `Contact: ${property.owner.name} · `
                      : ''}
                    {humanize(property.owner?.role)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Member since {new Date(property.owner.createdAt).toLocaleDateString('en-ZM', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>

                  {verificationChecks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {verificationChecks.map((check) => (
                        <span
                          key={check}
                          className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                          {check}
                        </span>
                      ))}
                    </div>
                  )}

                  {Number(property.owner?.trustScore || 0) > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Account trust score: {Math.round(Number(property.owner.trustScore))}/100
                    </p>
                  )}

                  <p className="mt-3 max-w-xl text-xs leading-5 text-slate-500">
                    Verification checks apply to the lister account. They do not replace your own property inspection or due diligence.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:relative">
            <div className="border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <div className="text-sm text-slate-500">
                {isPrivatePreview ? 'Private listing preview' : 'Interested in this property?'}
              </div>
              <div className="mt-1 text-2xl font-bold text-[#0F2B46]">{price.amount}</div>
              <div className="mt-1 text-sm text-slate-500">{price.suffix}</div>

              {!isOwner && !isAdmin && property.status === 'APPROVED' ? (
                <div className="mt-5 grid gap-2">
                  {isRental && <PropertyApplicationButton propertyId={property.id} />}

                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white"
                    >
                      WhatsApp lister
                    </a>
                  )}

                  {property.owner?.phone && (
                    <a
                      href={'tel:' + property.owner.phone}
                      className="flex items-center justify-center border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                    >
                      Call lister
                    </a>
                  )}

                  <FavoriteButton propertyId={property.id} />

                  <div className="mt-3 border-t border-slate-200 pt-4">
                    <div className="mb-3 text-sm font-semibold text-slate-900">Request a viewing</div>
                    <ViewingScheduler propertyId={property.id} propertyTitle={property.title} />
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-5">
                    <div className="mb-3 text-sm font-semibold text-slate-900">Send an enquiry</div>
                    <MessageForm receiverId={property.ownerId} propertyId={property.id} />
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <ReportListing propertyId={property.id} />
                  </div>
                </div>
              ) : (
                <div className="mt-5 border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {isOwner
                    ? 'You are viewing your own property.'
                    : isAdmin
                      ? 'You are viewing this property as an administrator.'
                      : 'This listing is not public yet.'}
                </div>
              )}
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.025em]">
                  Similar approved properties in {property.city}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Real approved listings with the same property type and listing purpose.
                </p>
              </div>

              <Link
                href={isRental ? '/rent' : '/buy'}
                className="text-sm font-semibold text-[#16A34A]"
              >
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
