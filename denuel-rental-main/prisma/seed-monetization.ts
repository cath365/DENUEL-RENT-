import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMonetization() {
  console.log('🚀 Seeding monetization data...');

  // Create Subscription Plans
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'free-plan' },
    update: {},
    create: {
      id: 'free-plan',
      name: 'Free',
      description: 'Basic listing features - perfect to get started',
      price: 0,
      currency: 'ZMW',
      maxListings: 1,
      maxPhotos: 5,
      maxBoosts: 0,
      hasFeaturedBadge: false,
      hasPrioritySupport: false,
      hasAnalytics: false,
      hasAutoBoost: false,
      freeInquiries: 5,
      isActive: true,
      sortOrder: 0,
    },
  });

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'basic-plan' },
    update: {},
    create: {
      id: 'basic-plan',
      name: 'Basic',
      description: 'More listings and photos for growing landlords',
      price: 150,
      currency: 'ZMW',
      maxListings: 5,
      maxPhotos: 10,
      maxBoosts: 2,
      hasFeaturedBadge: false,
      hasPrioritySupport: false,
      hasAnalytics: true,
      hasAutoBoost: false,
      freeInquiries: 20,
      isActive: true,
      sortOrder: 1,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'premium-plan' },
    update: {},
    create: {
      id: 'premium-plan',
      name: 'Premium',
      description: 'Unlimited listings with featured badge and priority placement',
      price: 300,
      currency: 'ZMW',
      maxListings: -1, // unlimited
      maxPhotos: 20,
      maxBoosts: 10,
      hasFeaturedBadge: true,
      hasPrioritySupport: true,
      hasAnalytics: true,
      hasAutoBoost: true,
      freeInquiries: -1, // unlimited
      isActive: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'enterprise-plan' },
    update: {},
    create: {
      id: 'enterprise-plan',
      name: 'Enterprise',
      description: 'For agencies and property management companies',
      price: 800,
      currency: 'ZMW',
      maxListings: -1,
      maxPhotos: 30,
      maxBoosts: -1, // unlimited
      hasFeaturedBadge: true,
      hasPrioritySupport: true,
      hasAnalytics: true,
      hasAutoBoost: true,
      freeInquiries: -1,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log('✅ Subscription plans created:');
  console.log('   - Free: K0/month');
  console.log('   - Basic: K150/month');
  console.log('   - Premium: K300/month');
  console.log('   - Enterprise: K800/month');

  // Update System Settings with monetization config
  await prisma.systemSettings.upsert({
    where: { id: 'main' },
    update: {
      featuredListingPrice: 50,
      commissionRate: 15.0,
      contactPhone: '+260973914432',
      whatsappNumber: '+260973914432',
    },
    create: {
      id: 'main',
      siteName: 'DENUEL',
      commissionRate: 15.0,
      featuredListingPrice: 50,
      contactPhone: '+260973914432',
      whatsappNumber: '+260973914432',
    },
  });

  console.log('✅ System settings updated with pricing');
  console.log('   - Featured listing: K50/week');
  console.log('   - Platform commission: 15%');
  console.log('   - Contact: +260 973 914 432');
  console.log('   - Alternative: +260 779 690 132');
}

seedMonetization()
  .catch((e) => {
    console.error('❌ Error seeding monetization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
