import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = hashPassword('Admin#1234');
  const landlordPassword = hashPassword('Landlord#1234');
  const agentPassword = hashPassword('Agent#1234');
  const tenantPassword = hashPassword('Tenant#1234');

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@denuel.local' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      name: 'Admin',
      email: 'admin@denuel.local',
      phone: '+260700000000',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@denuel.local' },
    update: {},
    create: {
      name: 'Sample Landlord',
      email: 'landlord@denuel.local',
      phone: '+260700000001',
      password: landlordPassword,
      role: 'LANDLORD',
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@denuel.local' },
    update: {},
    create: {
      name: 'Sarah Agent',
      email: 'agent@denuel.local',
      phone: '+260700000002',
      password: agentPassword,
      role: 'AGENT',
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@denuel.local' },
    update: {},
    create: {
      name: 'Test Tenant',
      email: 'tenant@denuel.local',
      phone: '+260700000010',
      password: tenantPassword,
      role: 'USER',
    },
  });

  // Sample properties
  let property1: any = await prisma.property.findFirst({ 
    where: { title: '3-bedroom family house in Kabulonga' } 
  });
  
  if (!property1) {
    property1 = await prisma.property.create({
      data: {
        title: '3-bedroom family house in Kabulonga',
        description: 'Spacious family house with a garden, borehole water and secure parking. Features modern kitchen, large living area, and beautiful landscaped yard.',
        price: 1500,
        deposit: 1500,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Kabulonga',
        addressText: 'Kabulonga, Lusaka',
        latitude: -15.445,
        longitude: 28.332,
        bedrooms: 3,
        bathrooms: 2,
        furnished: false,
        parkingSpaces: 2,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'INVERTER',
        securityFeatures: ['Wall fence', 'Gate', 'CCTV'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Garden', 'Borehole', 'Parking', 'Swimming Pool'],
        rules: [],
        status: 'APPROVED',
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  let property2: any = await prisma.property.findFirst({ 
    where: { title: '1-bedroom apartment near University of Zambia' } 
  });

  if (!property2) {
    property2 = await prisma.property.create({
      data: {
        title: '1-bedroom apartment near University of Zambia',
        description: 'Modern apartment, ideal for students and staff with reliable water and fast internet.',
        price: 500,
        deposit: 500,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Ridgeway',
        addressText: 'Near UNZA, Lusaka',
        latitude: -15.462,
        longitude: 28.322,
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        parkingSpaces: 1,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'NONE',
        securityFeatures: ['Guard', 'CCTV'],
        isShortStay: true,
        isStudentFriendly: true,
        amenities: ['Furnished', 'WiFi'],
        rules: ['No smoking'],
        status: 'APPROVED',
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // ============ PROPERTIES FOR SALE ============
  
  // Sale Property 1: Luxury Villa in Kabulonga
  let saleProperty1: any = await prisma.property.findFirst({ 
    where: { title: 'Luxury 5-Bedroom Villa in Kabulonga' } 
  });
  
  if (!saleProperty1) {
    saleProperty1 = await prisma.property.create({
      data: {
        title: 'Luxury 5-Bedroom Villa in Kabulonga',
        description: 'Stunning executive villa featuring modern architecture, infinity pool, landscaped gardens, home office, and state-of-the-art security system. Perfect for families seeking prestige and comfort.',
        price: 2500000,
        deposit: 250000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Kabulonga',
        addressText: 'Prime Location, Kabulonga, Lusaka',
        latitude: -15.448,
        longitude: 28.335,
        bedrooms: 5,
        bathrooms: 4,
        sizeSqm: 450,
        furnished: false,
        parkingSpaces: 4,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'GENERATOR',
        securityFeatures: ['Electric Fence', 'CCTV', '24hr Guards', 'Panic Room'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Swimming Pool', 'Garden', 'Home Office', 'Staff Quarters', 'Gym'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'HOUSE',
        yearBuilt: 2020,
        lotSizeSqm: 2000,
        hoaFees: 500,
        isFeatured: true,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', sortOrder: 1 },
            { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', sortOrder: 2 },
          ] 
        },
      },
    });
  }

  // Sale Property 2: Modern Townhouse in Rhodes Park
  let saleProperty2: any = await prisma.property.findFirst({ 
    where: { title: '3-Bedroom Modern Townhouse in Rhodes Park' } 
  });
  
  if (!saleProperty2) {
    saleProperty2 = await prisma.property.create({
      data: {
        title: '3-Bedroom Modern Townhouse in Rhodes Park',
        description: 'Contemporary townhouse in a secure gated community. Features open-plan living, modern kitchen with granite countertops, and private courtyard garden. Walking distance to shops and restaurants.',
        price: 850000,
        deposit: 85000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Rhodes Park',
        addressText: 'Rhodes Park Estate, Lusaka',
        latitude: -15.418,
        longitude: 28.292,
        bedrooms: 3,
        bathrooms: 2,
        sizeSqm: 180,
        furnished: false,
        parkingSpaces: 2,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'SOLAR',
        securityFeatures: ['Gated Community', 'CCTV', 'Intercom'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Courtyard', 'Built-in Wardrobes', 'Modern Kitchen'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'TOWNHOUSE',
        yearBuilt: 2022,
        lotSizeSqm: 350,
        hoaFees: 300,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Sale Property 3: Apartment in Woodlands
  let saleProperty3: any = await prisma.property.findFirst({ 
    where: { title: '2-Bedroom Apartment in Woodlands' } 
  });
  
  if (!saleProperty3) {
    saleProperty3 = await prisma.property.create({
      data: {
        title: '2-Bedroom Apartment in Woodlands',
        description: 'Affordable starter home or investment property. Well-maintained apartment complex with communal pool and gym. Close to Woodlands Mall and schools.',
        price: 420000,
        deposit: 42000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Woodlands',
        addressText: 'Woodlands Extension, Lusaka',
        latitude: -15.422,
        longitude: 28.312,
        bedrooms: 2,
        bathrooms: 1,
        sizeSqm: 85,
        furnished: false,
        parkingSpaces: 1,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'NONE',
        securityFeatures: ['Gated Complex', 'Guard'],
        isShortStay: false,
        isStudentFriendly: true,
        amenities: ['Communal Pool', 'Gym Access', 'Balcony'],
        rules: ['No pets'],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'APARTMENT',
        yearBuilt: 2018,
        lotSizeSqm: 85,
        hoaFees: 150,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Sale Property 4: Land in Ibex Hill
  let saleProperty4: any = await prisma.property.findFirst({ 
    where: { title: 'Prime Plot in Ibex Hill' } 
  });
  
  if (!saleProperty4) {
    saleProperty4 = await prisma.property.create({
      data: {
        title: 'Prime Plot in Ibex Hill',
        description: 'Excellent opportunity to build your dream home! Flat, fully serviced plot with water and electricity connections. Title deed available. Prime location with stunning views.',
        price: 650000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Ibex Hill',
        addressText: 'Ibex Hill, Lusaka',
        latitude: -15.435,
        longitude: 28.345,
        bedrooms: 0,
        bathrooms: 0,
        sizeSqm: 0,
        parkingSpaces: 0,
        petsAllowed: true,
        internetAvailable: false,
        waterSource: 'MUNICIPAL',
        powerBackup: 'NONE',
        securityFeatures: [],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Water Connection', 'Electricity', 'Title Deed'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'LAND',
        lotSizeSqm: 1500,
        isFeatured: true,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // Sale Property 5: Commercial Property
  let saleProperty5: any = await prisma.property.findFirst({ 
    where: { title: 'Commercial Building on Cairo Road' } 
  });
  
  if (!saleProperty5) {
    saleProperty5 = await prisma.property.create({
      data: {
        title: 'Commercial Building on Cairo Road',
        description: 'Prime commercial property in the heart of Lusaka CBD. 3-story building with retail space on ground floor and offices above. High foot traffic location with excellent rental income potential.',
        price: 4500000,
        deposit: 450000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'CBD',
        addressText: 'Cairo Road, Lusaka CBD',
        latitude: -15.417,
        longitude: 28.283,
        bedrooms: 0,
        bathrooms: 6,
        sizeSqm: 800,
        furnished: false,
        parkingSpaces: 10,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'GENERATOR',
        securityFeatures: ['CCTV', '24hr Guards', 'Fire System'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Elevator', 'Conference Room', 'Parking Lot'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'COMMERCIAL',
        yearBuilt: 2015,
        lotSizeSqm: 500,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Sale Property 6: Family Home in Roma
  let saleProperty6: any = await prisma.property.findFirst({ 
    where: { title: '4-Bedroom Family Home in Roma' } 
  });
  
  if (!saleProperty6) {
    saleProperty6 = await prisma.property.create({
      data: {
        title: '4-Bedroom Family Home in Roma',
        description: 'Charming family home in a quiet neighborhood. Features spacious living areas, mature garden, servant quarters, and double garage. Close to schools and shopping centers.',
        price: 1200000,
        deposit: 120000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Roma',
        addressText: 'Roma Township, Lusaka',
        latitude: -15.432,
        longitude: 28.298,
        bedrooms: 4,
        bathrooms: 3,
        sizeSqm: 280,
        furnished: false,
        parkingSpaces: 2,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'INVERTER',
        securityFeatures: ['Wall Fence', 'Electric Gate', 'Guard Dog'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Garden', 'Servant Quarters', 'Double Garage', 'Borehole'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'HOUSE',
        yearBuilt: 2008,
        lotSizeSqm: 1200,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // ============ ZILLOW-STYLE SEED DATA ============

  // Create Neighborhoods
  const existingKabulonga = await prisma.neighborhood.findFirst({ where: { name: 'Kabulonga' } });
  const kabulonga = existingKabulonga || await prisma.neighborhood.create({
    data: {
      name: 'Kabulonga',
      city: 'Lusaka',
      country: 'Zambia',
      description: 'One of Lusaka\'s most prestigious residential areas, known for its tree-lined streets, large homes, and excellent security.',
      walkScore: 45,
      transitScore: 30,
      bikeScore: 55,
      safetyScore: 85,
      medianPrice: 850000,
      medianRent: 25000,
      population: 15000,
      averageAge: 38,
      medianIncome: 120000,
    },
  });

  const existingRhodespark = await prisma.neighborhood.findFirst({ where: { name: 'Rhodes Park' } });
  const rhodespark = existingRhodespark || await prisma.neighborhood.create({
    data: {
      name: 'Rhodes Park',
      city: 'Lusaka',
      country: 'Zambia',
      description: 'A vibrant residential area with a mix of old colonial homes and modern apartments, close to the city center.',
      walkScore: 65,
      transitScore: 50,
      bikeScore: 60,
      safetyScore: 75,
      medianPrice: 550000,
      medianRent: 15000,
      population: 22000,
      averageAge: 32,
      medianIncome: 85000,
    },
  });

  const existingWoodlands = await prisma.neighborhood.findFirst({ where: { name: 'Woodlands' } });
  const woodlands = existingWoodlands || await prisma.neighborhood.create({
    data: {
      name: 'Woodlands',
      city: 'Lusaka',
      country: 'Zambia',
      description: 'Family-friendly neighborhood with good schools, shopping centers, and recreational facilities.',
      walkScore: 55,
      transitScore: 40,
      bikeScore: 50,
      safetyScore: 80,
      medianPrice: 650000,
      medianRent: 18000,
      population: 28000,
      averageAge: 35,
      medianIncome: 95000,
    },
  });

  // Create Schools (only if not exists)
  const existingSchool = await prisma.school.findFirst({ where: { name: 'American International School of Lusaka' } });
  if (!existingSchool) {
    await prisma.school.createMany({
      data: [
        {
          name: 'American International School of Lusaka',
          type: 'SECONDARY',
          rating: 9,
          studentCount: 850,
          isPrivate: true,
          latitude: -15.4100,
          longitude: 28.3200,
          neighborhoodId: kabulonga.id,
        },
        {
          name: 'Lusaka International Community School',
          type: 'SECONDARY',
          rating: 8,
          studentCount: 600,
          isPrivate: true,
          latitude: -15.4080,
          longitude: 28.3230,
          neighborhoodId: kabulonga.id,
        },
        {
          name: 'Rhodes Park Primary School',
          type: 'PRIMARY',
          rating: 7,
          studentCount: 1200,
          isPrivate: false,
          latitude: -15.4155,
          longitude: 28.2905,
          neighborhoodId: rhodespark.id,
        },
        {
          name: 'Woodlands Secondary School',
          type: 'SECONDARY',
          rating: 6,
          studentCount: 1500,
          isPrivate: false,
          latitude: -15.4205,
          longitude: 28.3105,
          neighborhoodId: woodlands.id,
        },
      ],
    });
  }

  // Create Agent Profile
  const existingAgentProfile = await prisma.agentProfile.findUnique({ where: { userId: agent.id } });
  const agentProfile = existingAgentProfile || await prisma.agentProfile.create({
    data: {
      userId: agent.id,
      licenseNumber: 'ZRE-2024-001',
      specialties: ['Residential', 'Luxury Homes', 'Investment Properties'],
      areasServed: ['Kabulonga', 'Rhodes Park', 'Woodlands', 'Ibex Hill'],
      yearsExperience: 8,
      bio: 'Sarah is a top-performing real estate agent in Lusaka with over 8 years of experience. She specializes in luxury residential properties and has helped hundreds of families find their dream homes.',
      totalSales: 150,
      totalRentals: 320,
      ratingAvg: 4.8,
      ratingCount: 89,
      responseTimeHours: 0.25,
      languages: ['English', 'Nyanja', 'Bemba'],
      facebookUrl: 'https://facebook.com/sarahagent',
      linkedinUrl: 'https://linkedin.com/in/sarahagent',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      isVerified: true,
    },
  });

  // Create Agent Reviews
  const existingReview = await prisma.agentReview.findFirst({ where: { agentId: agentProfile.id } });
  if (!existingReview) {
    await prisma.agentReview.createMany({
      data: [
        {
          agentId: agentProfile.id,
          reviewerId: tenant.id,
          rating: 5,
          title: 'Excellent Service',
          review: 'Sarah was absolutely fantastic! She helped us find the perfect home in Kabulonga within two weeks. Very professional and responsive.',
          wouldRecommend: true,
        },
        {
          agentId: agentProfile.id,
          reviewerId: landlord.id,
          rating: 5,
          title: 'Great Agent',
          review: 'Excellent agent. She found great tenants for my property and handled everything professionally.',
          wouldRecommend: true,
        },
      ],
    });
  }

  // Create Mortgage Lenders
  const existingLender = await prisma.mortgageLender.findFirst({ where: { name: 'Zambia National Building Society' } });
  if (!existingLender) {
    await prisma.mortgageLender.createMany({
      data: [
        {
          name: 'Zambia National Building Society',
          logoUrl: 'https://example.com/znbs-logo.png',
          currentRate: 18.5,
          minDownPayment: 10,
          loanTypes: ['Fixed Rate', 'Variable Rate', 'Construction Loan'],
          phone: '+260211234567',
          website: 'https://www.znbs.co.zm',
          isPartner: true,
          isActive: true,
        },
        {
          name: 'Stanbic Bank Zambia',
          logoUrl: 'https://example.com/stanbic-logo.png',
          currentRate: 19.0,
          minDownPayment: 15,
          loanTypes: ['Fixed Rate', 'Adjustable Rate'],
          phone: '+260211789012',
          website: 'https://www.stanbicbank.co.zm',
          isPartner: true,
          isActive: true,
        },
        {
          name: 'First National Bank Zambia',
          logoUrl: 'https://example.com/fnb-logo.png',
          currentRate: 18.0,
          minDownPayment: 20,
          loanTypes: ['Fixed Rate', 'Variable Rate', 'Bridge Loan'],
          phone: '+260211345678',
          website: 'https://www.fnbzambia.co.zm',
          isPartner: false,
          isActive: true,
        },
      ],
    });
  }

  // Create Service Providers
  const existingMover = await prisma.serviceProvider.findFirst({ where: { businessName: 'Lusaka Express Movers' } });
  const mover = existingMover || await prisma.serviceProvider.create({
    data: {
      userId: admin.id,
      businessName: 'Lusaka Express Movers',
      category: 'MOVER',
      description: 'Professional moving services for homes and offices. We handle local and long-distance moves with care.',
      logoUrl: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800',
      phone: '+260971111111',
      email: 'info@lusakamovers.zm',
      website: 'https://lusakamovers.zm',
      address: '45 Industrial Road, Lusaka',
      city: 'Lusaka',
      servicesOffered: ['Local Moving', 'Long Distance Moving', 'Packing', 'Storage'],
      priceRange: 'K500 - K5000',
      ratingAvg: 4.7,
      ratingCount: 156,
      isVerified: true,
      yearsInBusiness: 12,
    },
  });

  const existingCleaner = await prisma.serviceProvider.findFirst({ where: { businessName: 'Sparkle Clean Services' } });
  const cleaner = existingCleaner || await prisma.serviceProvider.create({
    data: {
      userId: landlord.id,
      businessName: 'Sparkle Clean Services',
      category: 'CLEANER',
      description: 'Expert cleaning services for move-in/move-out, deep cleaning, and regular maintenance.',
      logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
      phone: '+260972222222',
      email: 'hello@sparkleclean.zm',
      website: 'https://sparkleclean.zm',
      address: '78 Cairo Road, Lusaka',
      city: 'Lusaka',
      servicesOffered: ['Deep Cleaning', 'Move-In/Move-Out', 'Regular Maintenance', 'Window Cleaning'],
      priceRange: 'K200 - K2000',
      ratingAvg: 4.9,
      ratingCount: 234,
      isVerified: true,
      yearsInBusiness: 8,
    },
  });

  const existingPlumber = await prisma.serviceProvider.findFirst({ where: { businessName: 'FixIt Plumbing & Electrical' } });
  if (!existingPlumber) {
    await prisma.serviceProvider.create({
      data: {
        userId: tenant.id,
        businessName: 'FixIt Plumbing & Electrical',
        category: 'PLUMBER',
        description: '24/7 emergency plumbing and electrical services. Licensed technicians with guaranteed work.',
        logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
        phone: '+260973333333',
        email: 'support@fixitplumbing.zm',
        website: 'https://fixitplumbing.zm',
        address: '22 Independence Avenue, Lusaka',
        city: 'Lusaka',
        servicesOffered: ['Emergency Repairs', 'Pipe Installation', 'Leak Detection', 'Water Heater'],
        priceRange: 'K150 - K3000',
        ratingAvg: 4.5,
        ratingCount: 89,
        isVerified: true,
        yearsInBusiness: 15,
      },
    });
  }

  // Create Service Reviews
  const existingServiceReview = await prisma.serviceReview.findFirst({ where: { providerId: mover.id } });
  if (!existingServiceReview) {
    await prisma.serviceReview.createMany({
      data: [
        {
          providerId: mover.id,
          reviewerId: tenant.id,
          rating: 5,
          review: 'The team was professional, punctual, and handled all our belongings with care. Highly recommend!',
          serviceDate: new Date('2024-11-15'),
        },
        {
          providerId: cleaner.id,
          reviewerId: landlord.id,
          rating: 5,
          review: 'Did an amazing deep clean after my previous tenants moved out. The place looked brand new!',
          serviceDate: new Date('2024-12-01'),
        },
      ],
    });
  }

  // Create Guides
  const existingRentingGuide = await prisma.guide.findFirst({ where: { slug: 'renting-guide-zambia' } });
  const rentingGuide = existingRentingGuide || await prisma.guide.create({
    data: {
      title: 'Complete Guide to Renting in Zambia',
      slug: 'renting-guide-zambia',
      excerpt: 'Everything you need to know about renting a property in Zambia - from finding listings to signing your lease.',
      content: `
# Complete Guide to Renting in Zambia

## Introduction
Finding the right rental property in Zambia requires understanding the local market and knowing what to look for.

## Step 1: Determine Your Budget
Before you start looking, calculate how much you can afford. A general rule is that rent should not exceed 30% of your monthly income.

## Step 2: Choose Your Location
Consider factors like:
- Proximity to work or school
- Safety of the neighborhood
- Access to amenities
- Transportation options

## Step 3: Search for Properties
Use DENUEL to search for properties that match your criteria.

## Step 4: Schedule Viewings
Never rent a property without seeing it in person.

## Step 5: Understand the Lease
Before signing, make sure you understand all terms and conditions.

## Step 6: Move In
Complete a thorough move-in inspection and document any existing damage.
      `,
      category: 'RENTING',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      readTime: 8,
      isPublished: true,
      viewCount: 1250,
    },
  });

  const existingBuyingGuide = await prisma.guide.findFirst({ where: { slug: 'first-time-buyer-guide' } });
  const buyingGuide = existingBuyingGuide || await prisma.guide.create({
    data: {
      title: 'First-Time Home Buyer\'s Guide for Zambia',
      slug: 'first-time-buyer-guide',
      excerpt: 'A comprehensive guide for first-time home buyers in Zambia, covering everything from financing to closing.',
      content: `
# First-Time Home Buyer's Guide for Zambia

## Is Buying Right for You?
Consider the pros and cons of buying vs renting in your current situation.

## Step 1: Check Your Financial Health
Review your credit, calculate debt-to-income ratio, save for down payment.

## Step 2: Get Pre-Approved for a Mortgage
Visit multiple lenders to compare rates and terms.

## Step 3: Find a Real Estate Agent
A good agent can help you find suitable properties and negotiate.

## Step 4: Start House Hunting
Make a list of must-haves vs nice-to-haves.

## Step 5: Make an Offer
Your agent will help you prepare a competitive offer.

## Step 6: Complete Due Diligence
Property inspection, title search, and valuation.

## Step 7: Close the Deal
Finalize your mortgage, sign documents, and get your keys!
      `,
      category: 'BUYING',
      coverImage: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800',
      readTime: 12,
      isPublished: true,
      viewCount: 890,
    },
  });

  const existingMovingGuide = await prisma.guide.findFirst({ where: { slug: 'moving-checklist' } });
  if (!existingMovingGuide) {
    await prisma.guide.create({
      data: {
        title: 'Ultimate Moving Checklist',
        slug: 'moving-checklist',
        excerpt: 'Your complete checklist for a stress-free move to your new home.',
        content: `
# Ultimate Moving Checklist

## 8 Weeks Before Moving
- Create a moving budget
- Research moving companies
- Start decluttering

## 6 Weeks Before Moving
- Book your moving company
- Start packing non-essentials
- Notify your landlord (if renting)

## 4 Weeks Before Moving
- Change your address
- Transfer utilities
- Arrange school transfers

## Moving Day
- Supervise movers
- Check inventory
- Document any damage
        `,
        category: 'MOVING',
        coverImage: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800',
        readTime: 5,
        isPublished: true,
        viewCount: 567,
      },
    });
  }

  // Create Checklists
  const existingRentingChecklist = await prisma.checklist.findFirst({ where: { slug: 'renting-checklist' } });
  const rentingChecklist = existingRentingChecklist || await prisma.checklist.create({
    data: {
      slug: 'renting-checklist',
      title: 'Renting Checklist',
      description: 'Complete checklist for renting a property',
      category: 'RENTING',
      items: [
        { id: '1', text: 'Determine your budget', order: 1 },
        { id: '2', text: 'Research neighborhoods', order: 2 },
        { id: '3', text: 'Search for properties on DENUEL', order: 3 },
        { id: '4', text: 'Schedule property viewings', order: 4 },
        { id: '5', text: 'Prepare required documents', order: 5 },
        { id: '6', text: 'Review and sign lease agreement', order: 6 },
        { id: '7', text: 'Pay deposit and first month rent', order: 7 },
        { id: '8', text: 'Complete move-in inspection', order: 8 },
      ],
    },
  });

  const existingBuyingChecklist = await prisma.checklist.findFirst({ where: { slug: 'home-buying-checklist' } });
  if (!existingBuyingChecklist) {
    await prisma.checklist.create({
      data: {
        slug: 'home-buying-checklist',
        title: 'Home Buying Checklist',
        description: 'Complete checklist for buying a home',
        category: 'BUYING',
        items: [
          { id: '1', text: 'Check your credit score', order: 1 },
          { id: '2', text: 'Save for down payment', order: 2 },
          { id: '3', text: 'Get pre-approved for mortgage', order: 3 },
          { id: '4', text: 'Find a real estate agent', order: 4 },
          { id: '5', text: 'Start house hunting', order: 5 },
          { id: '6', text: 'Make an offer', order: 6 },
          { id: '7', text: 'Get property inspection', order: 7 },
          { id: '8', text: 'Finalize mortgage', order: 8 },
          { id: '9', text: 'Close the deal', order: 9 },
        ],
      },
    });
  }

  // Create User Checklist Progress
  const existingUserChecklist = await prisma.userChecklist.findFirst({ 
    where: { userId: tenant.id, checklistId: rentingChecklist.id } 
  });
  if (!existingUserChecklist) {
    await prisma.userChecklist.create({
      data: {
        userId: tenant.id,
        checklistId: rentingChecklist.id,
        progress: { completedItems: ['1', '2', '3'] },
      },
    });
  }

  // ========================================
  // ADDITIONAL SERVICE PROVIDERS
  // ========================================

  // Create service provider users
  const providerPassword = hashPassword('Provider#1234');
  
  const gardenerUser = await prisma.user.upsert({
    where: { email: 'gardener@denuel.local' },
    update: {},
    create: {
      name: 'Joseph Banda',
      email: 'gardener@denuel.local',
      phone: '+260971234567',
      password: providerPassword,
      role: 'USER',
    },
  });

  const painterUser = await prisma.user.upsert({
    where: { email: 'painter@denuel.local' },
    update: {},
    create: {
      name: 'David Mumba',
      email: 'painter@denuel.local',
      phone: '+260974234567',
      password: providerPassword,
      role: 'USER',
    },
  });

  const securityUser = await prisma.user.upsert({
    where: { email: 'security@denuel.local' },
    update: {},
    create: {
      name: 'Security Plus Ltd',
      email: 'security@denuel.local',
      phone: '+260975234567',
      password: providerPassword,
      role: 'USER',
    },
  });

  // Create Service Provider profiles
  const existingGardener = await prisma.serviceProvider.findUnique({ where: { userId: gardenerUser.id } });
  if (!existingGardener) {
    await prisma.serviceProvider.create({
      data: {
        userId: gardenerUser.id,
        businessName: 'Joseph\'s Garden Services',
        category: 'GARDENER',
        description: 'Professional gardening and landscaping services with over 10 years of experience. I specialize in lawn maintenance, flower beds, tree trimming, and complete garden makeovers. Available for weekly, bi-weekly, or one-time services.',
        phone: '+260971234567',
        email: 'gardener@denuel.local',
        city: 'Lusaka',
        area: 'Kabulonga',
        yearsInBusiness: 10,
        hourlyRate: 50,
        minimumCharge: 150,
        priceRange: 'K150 - K500',
        serviceAreas: ['Kabulonga', 'Rhodes Park', 'Woodlands', 'Ibex Hill', 'Roma'],
        servicesOffered: ['Lawn mowing', 'Tree trimming', 'Flower bed maintenance', 'Garden design', 'Hedge trimming', 'Weed control'],
        isVerified: true,
        isActive: true,
        isAvailable: true,
        ratingAvg: 4.8,
        ratingCount: 45,
        completedJobs: 156,
      },
    });
  }

  const existingPainter = await prisma.serviceProvider.findUnique({ where: { userId: painterUser.id } });
  if (!existingPainter) {
    await prisma.serviceProvider.create({
      data: {
        userId: painterUser.id,
        businessName: 'Pro Paint Masters',
        category: 'PAINTER',
        description: 'Professional painting services for residential and commercial properties. Interior and exterior painting, wallpaper installation, and decorative finishes. We use only quality paints and materials.',
        phone: '+260974234567',
        email: 'painter@denuel.local',
        city: 'Lusaka',
        area: 'Chelston',
        yearsInBusiness: 8,
        hourlyRate: 100,
        minimumCharge: 300,
        priceRange: 'K300 - K5000',
        serviceAreas: ['Lusaka', 'Chilanga', 'Kafue'],
        servicesOffered: ['Interior painting', 'Exterior painting', 'Wallpaper installation', 'Texture painting', 'Spray painting', 'Color consultation'],
        isVerified: true,
        isActive: true,
        isAvailable: true,
        ratingAvg: 4.6,
        ratingCount: 34,
        completedJobs: 98,
      },
    });
  }

  const existingSecurity = await prisma.serviceProvider.findUnique({ where: { userId: securityUser.id } });
  if (!existingSecurity) {
    await prisma.serviceProvider.create({
      data: {
        userId: securityUser.id,
        businessName: 'Security Plus Ltd',
        category: 'SECURITY',
        description: 'Professional security services including residential guards, commercial security, event security, and security consultation. All our guards are trained, licensed, and vetted.',
        phone: '+260975234567',
        email: 'security@denuel.local',
        city: 'Lusaka',
        area: 'Industrial Area',
        yearsInBusiness: 12,
        hourlyRate: 35,
        minimumCharge: 2500,
        priceRange: 'K2500 - K8000/month',
        serviceAreas: ['All Lusaka Province'],
        servicesOffered: ['Residential guards', 'Commercial security', 'Event security', 'Security audits', 'CCTV monitoring', 'Alarm response'],
        isVerified: true,
        isActive: true,
        isAvailable: true,
        ratingAvg: 4.5,
        ratingCount: 28,
        completedJobs: 156,
      },
    });
  }

  // Add a few more unverified providers for testing
  const pestUser = await prisma.user.upsert({
    where: { email: 'pest@denuel.local' },
    update: {},
    create: {
      name: 'Bug Busters Zambia',
      email: 'pest@denuel.local',
      phone: '+260977234567',
      password: providerPassword,
      role: 'USER',
    },
  });

  const existingPest = await prisma.serviceProvider.findUnique({ where: { userId: pestUser.id } });
  if (!existingPest) {
    await prisma.serviceProvider.create({
      data: {
        userId: pestUser.id,
        businessName: 'Bug Busters Zambia',
        category: 'PEST_CONTROL',
        description: 'Complete pest control solutions for homes and businesses. We handle cockroaches, ants, termites, rodents, and more. Environmentally friendly options available.',
        phone: '+260977234567',
        email: 'pest@denuel.local',
        city: 'Lusaka',
        area: 'Northmead',
        yearsInBusiness: 3,
        hourlyRate: 200,
        minimumCharge: 400,
        priceRange: 'K400 - K3000',
        serviceAreas: ['Lusaka'],
        servicesOffered: ['Cockroach control', 'Termite treatment', 'Rodent control', 'Ant treatment', 'Fumigation', 'Prevention treatments'],
        isVerified: false, // Not verified yet - for testing
        isActive: true,
        isAvailable: true,
        ratingAvg: 0,
        ratingCount: 0,
        completedJobs: 0,
      },
    });
  }

  const maidUser = await prisma.user.upsert({
    where: { email: 'maid@denuel.local' },
    update: {},
    create: {
      name: 'Grace Tembo',
      email: 'maid@denuel.local',
      phone: '+260978234567',
      password: providerPassword,
      role: 'USER',
    },
  });

  const existingMaid = await prisma.serviceProvider.findUnique({ where: { userId: maidUser.id } });
  if (!existingMaid) {
    await prisma.serviceProvider.create({
      data: {
        userId: maidUser.id,
        businessName: 'Grace\'s Housekeeping',
        category: 'MAID',
        description: 'Experienced housekeeper and nanny available for full-time or part-time work. Excellent references available. Trained in first aid and child care.',
        phone: '+260978234567',
        email: 'maid@denuel.local',
        city: 'Lusaka',
        area: 'Kabwata',
        yearsInBusiness: 6,
        hourlyRate: 25,
        minimumCharge: 100,
        priceRange: 'K2000 - K4000/month',
        serviceAreas: ['Kabulonga', 'Rhodes Park', 'Woodlands', 'Roma'],
        servicesOffered: ['Housekeeping', 'Cooking', 'Laundry', 'Child care', 'Elderly care', 'Shopping'],
        isVerified: false, // Not verified yet - for testing
        isActive: true,
        isAvailable: true,
        ratingAvg: 0,
        ratingCount: 0,
        completedJobs: 0,
      },
    });
  }

  // ============ COMMERCIAL PROPERTIES ============
  
  // Commercial Property 1: Office Space for Rent
  let officeRent: any = await prisma.property.findFirst({ 
    where: { title: 'Modern Office Space in Downtown Lusaka' } 
  });
  
  if (!officeRent) {
    officeRent = await prisma.property.create({
      data: {
        title: 'Modern Office Space in Downtown Lusaka',
        description: 'Professional office space in the heart of Lusaka CBD. Features include 24/7 security, high-speed internet, backup power, parking, and reception area. Perfect for startups, agencies, and corporate offices.',
        price: 3500,
        deposit: 7000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Central Business District',
        addressText: 'Cairo Road, Lusaka CBD',
        latitude: -15.416,
        longitude: 28.285,
        bedrooms: 0,
        bathrooms: 2,
        sizeSqm: 120,
        furnished: false,
        parkingSpaces: 5,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'GENERATOR',
        securityFeatures: ['24hr Security', 'CCTV', 'Access Control'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Reception', 'Meeting Rooms', 'Kitchen', 'High-Speed Internet', 'Elevator'],
        rules: ['Business hours: 6am-10pm', 'No residential use'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'COMMERCIAL',
        isFeatured: true,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Commercial Property 2: Retail Shop for Rent
  let shopRent: any = await prisma.property.findFirst({ 
    where: { title: 'Prime Retail Shop at East Park Mall' } 
  });
  
  if (!shopRent) {
    shopRent = await prisma.property.create({
      data: {
        title: 'Prime Retail Shop at East Park Mall',
        description: 'High-traffic retail space in popular East Park Mall. Ground floor location with excellent visibility. Ideal for fashion boutiques, electronics, cosmetics, or food outlets. Includes storage room and dedicated parking.',
        price: 2800,
        deposit: 5600,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'East Park',
        addressText: 'East Park Mall, Great East Road, Lusaka',
        latitude: -15.430,
        longitude: 28.330,
        bedrooms: 0,
        bathrooms: 1,
        sizeSqm: 80,
        furnished: false,
        parkingSpaces: 3,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'SOLAR',
        securityFeatures: ['Mall Security', 'CCTV', 'Fire System'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['High Foot Traffic', 'Storage Room', 'Display Windows', 'AC'],
        rules: ['Mall operating hours apply', 'No loud music'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'COMMERCIAL',
        isFeatured: true,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Commercial Property 3: Coworking Space for Rent
  let coworkingRent: any = await prisma.property.findFirst({ 
    where: { title: 'Coworking Space in Kabulonga' } 
  });
  
  if (!coworkingRent) {
    coworkingRent = await prisma.property.create({
      data: {
        title: 'Coworking Space in Kabulonga',
        description: 'Modern coworking facility with hot desks, private offices, meeting rooms, and event space. Features super-fast fiber internet, complimentary coffee, printing services, and a vibrant community of entrepreneurs and professionals.',
        price: 800,
        deposit: 1600,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Kabulonga',
        addressText: 'Addis Ababa Drive, Kabulonga',
        latitude: -15.442,
        longitude: 28.328,
        bedrooms: 0,
        bathrooms: 2,
        sizeSqm: 200,
        furnished: true,
        parkingSpaces: 10,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'SOLAR',
        securityFeatures: ['Security Guard', 'Access Cards', 'CCTV'],
        isShortStay: true,
        isStudentFriendly: true,
        amenities: ['High-Speed Internet', 'Meeting Rooms', 'Printing', 'Kitchen', 'Event Space', 'Coffee Bar'],
        rules: ['24/7 access for private office holders', 'Respect quiet zones'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'COMMERCIAL',
        isFeatured: false,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Commercial Property 4: Warehouse for Rent
  let warehouseRent: any = await prisma.property.findFirst({ 
    where: { title: 'Industrial Warehouse in Makeni' } 
  });
  
  if (!warehouseRent) {
    warehouseRent = await prisma.property.create({
      data: {
        title: 'Industrial Warehouse in Makeni',
        description: 'Spacious warehouse facility ideal for storage, distribution, or light manufacturing. Features loading bay, high ceilings, security fencing, and easy access to main roads. Includes small office area and staff facilities.',
        price: 4500,
        deposit: 9000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Makeni',
        addressText: 'Makeni Industrial Area, Lusaka',
        latitude: -15.385,
        longitude: 28.315,
        bedrooms: 0,
        bathrooms: 2,
        sizeSqm: 500,
        furnished: false,
        parkingSpaces: 15,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'GENERATOR',
        securityFeatures: ['Electric Fence', 'Guards', 'CCTV'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Loading Bay', 'Office Area', 'High Ceilings', 'Staff Toilets', 'Easy Road Access'],
        rules: ['No hazardous materials', 'Insurance required'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'COMMERCIAL',
        isFeatured: false,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // Commercial Property 5: Restaurant Space for Sale
  let restaurantSale: any = await prisma.property.findFirst({ 
    where: { title: 'Restaurant Space at Manda Hill' } 
  });
  
  if (!restaurantSale) {
    restaurantSale = await prisma.property.create({
      data: {
        title: 'Restaurant Space at Manda Hill',
        description: 'Fully equipped restaurant space in premium Manda Hill location. Includes commercial kitchen, dining area, bar section, and outdoor seating. Perfect turnkey opportunity for restaurateurs. High foot traffic guaranteed.',
        price: 1200000,
        deposit: 120000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Manda Hill',
        addressText: 'Manda Hill Shopping Centre, Lusaka',
        latitude: -15.398,
        longitude: 28.307,
        bedrooms: 0,
        bathrooms: 3,
        sizeSqm: 180,
        furnished: true,
        parkingSpaces: 8,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'SOLAR',
        securityFeatures: ['Mall Security', 'CCTV', 'Fire Suppression'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Commercial Kitchen', 'Bar', 'Outdoor Seating', 'Storage', 'Grease Trap'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'COMMERCIAL',
        yearBuilt: 2018,
        isFeatured: true,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Commercial Property 6: Office Building for Sale
  let officeSale: any = await prisma.property.findFirst({ 
    where: { title: 'Commercial Office Building in Woodlands' } 
  });
  
  if (!officeSale) {
    officeSale = await prisma.property.create({
      data: {
        title: 'Commercial Office Building in Woodlands',
        description: 'Three-story commercial building in prime Woodlands location. Currently generating rental income from multiple tenants. Features include elevator, backup power, ample parking, and modern amenities. Excellent investment opportunity.',
        price: 4500000,
        deposit: 450000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Woodlands',
        addressText: 'Los Angeles Boulevard, Woodlands',
        latitude: -15.438,
        longitude: 28.325,
        bedrooms: 0,
        bathrooms: 6,
        sizeSqm: 800,
        furnished: false,
        parkingSpaces: 25,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'GENERATOR',
        securityFeatures: ['24hr Security', 'CCTV', 'Access Control', 'Alarm System'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Elevator', 'Conference Rooms', 'Kitchen', 'Generator', 'Reception'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'COMMERCIAL',
        yearBuilt: 2015,
        lotSizeSqm: 1500,
        isFeatured: true,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  // Commercial Property 7: Shopping Complex for Sale
  let shoppingComplexSale: any = await prisma.property.findFirst({ 
    where: { title: 'Mini Shopping Complex in Chelston' } 
  });
  
  if (!shoppingComplexSale) {
    shoppingComplexSale = await prisma.property.create({
      data: {
        title: 'Mini Shopping Complex in Chelston',
        description: 'Prime investment property featuring 12 retail units, all currently tenanted. Located in high-traffic Chelston area with excellent returns. Includes dedicated parking, security, and modern facilities. Stable income stream.',
        price: 3800000,
        deposit: 380000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Chelston',
        addressText: 'Great East Road, Chelston',
        latitude: -15.425,
        longitude: 28.340,
        bedrooms: 0,
        bathrooms: 4,
        sizeSqm: 600,
        furnished: false,
        parkingSpaces: 40,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'SOLAR',
        securityFeatures: ['Security Guards', 'CCTV', 'Electric Fence', 'Boom Gate'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['12 Retail Units', 'Ample Parking', 'Security', 'Backup Power'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'COMMERCIAL',
        yearBuilt: 2017,
        lotSizeSqm: 2500,
        hoaFees: 2000,
        isFeatured: true,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1555529902-5261145633bf?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // Mixed-Use Property 1: Shop with Flat Above for Sale
  let mixedUseSale: any = await prisma.property.findFirst({ 
    where: { title: 'Commercial Shop with 2-Bedroom Flat Above' } 
  });
  
  if (!mixedUseSale) {
    mixedUseSale = await prisma.property.create({
      data: {
        title: 'Commercial Shop with 2-Bedroom Flat Above',
        description: 'Versatile property perfect for live-and-work setup. Ground floor shop ideal for retail or office, upper floor features a comfortable 2-bedroom flat. Located on busy Kamloops Road with high visibility.',
        price: 850000,
        deposit: 85000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Kamwala',
        addressText: 'Kamloops Road, Kamwala',
        latitude: -15.428,
        longitude: 28.295,
        bedrooms: 2,
        bathrooms: 2,
        sizeSqm: 150,
        furnished: false,
        parkingSpaces: 3,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'INVERTER',
        securityFeatures: ['Burglar Bars', 'Security Door'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Separate Entrance', 'Shop Front', 'Residential Flat'],
        rules: [],
        status: 'APPROVED',
        listingType: 'BOTH',
        propertyType: 'COMMERCIAL',
        yearBuilt: 2010,
        lotSizeSqm: 400,
        isFeatured: false,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // Commercial Property 8: Medical Suite for Rent
  let medicalRent: any = await prisma.property.findFirst({ 
    where: { title: 'Medical Office Suite in Rhodes Park' } 
  });
  
  if (!medicalRent) {
    medicalRent = await prisma.property.create({
      data: {
        title: 'Medical Office Suite in Rhodes Park',
        description: 'Professional medical office space suitable for doctors, dentists, physiotherapists, or wellness practitioners. Features waiting area, consultation rooms, treatment room, and staff facilities. Ground floor accessibility.',
        price: 2500,
        deposit: 5000,
        country: 'Zambia',
        city: 'Lusaka',
        area: 'Rhodes Park',
        addressText: 'Twin Palm Road, Rhodes Park',
        latitude: -15.405,
        longitude: 28.318,
        bedrooms: 0,
        bathrooms: 2,
        sizeSqm: 100,
        furnished: false,
        parkingSpaces: 6,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'INVERTER',
        securityFeatures: ['Security Guard', 'CCTV'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Waiting Area', 'Consultation Rooms', 'Staff Room', 'Disability Access'],
        rules: ['Medical use only', 'Proper waste disposal required'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'COMMERCIAL',
        isFeatured: false,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // More Residential Properties for Diversity
  
  // Studio Apartment for Rent in Kitwe
  let studioKitwe: any = await prisma.property.findFirst({ 
    where: { title: 'Cozy Studio Apartment in Kitwe CBD' } 
  });
  
  if (!studioKitwe) {
    studioKitwe = await prisma.property.create({
      data: {
        title: 'Cozy Studio Apartment in Kitwe CBD',
        description: 'Modern studio apartment perfect for young professionals. Open-plan living with kitchenette, ensuite bathroom, and balcony. Walking distance to shops, restaurants, and business district.',
        price: 1800,
        deposit: 1800,
        country: 'Zambia',
        city: 'Kitwe',
        area: 'CBD',
        addressText: 'President Avenue, Kitwe',
        latitude: -12.810,
        longitude: 28.215,
        bedrooms: 0,
        bathrooms: 1,
        sizeSqm: 35,
        furnished: true,
        parkingSpaces: 1,
        petsAllowed: false,
        internetAvailable: true,
        waterSource: 'MUNICIPAL',
        powerBackup: 'NONE',
        securityFeatures: ['Security Guard', 'Secure Entrance'],
        isShortStay: true,
        isStudentFriendly: true,
        amenities: ['Furnished', 'Balcony', 'Gym Access', 'WiFi'],
        rules: ['No smoking', 'No loud noise after 10pm'],
        status: 'APPROVED',
        listingType: 'RENT',
        propertyType: 'STUDIO',
        isFeatured: false,
        ownerId: agent.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', sortOrder: 0 },
          ] 
        },
      },
    });
  }

  // House for Sale in Ndola
  let houseNdola: any = await prisma.property.findFirst({ 
    where: { title: '4-Bedroom House in Ndola Northrise' } 
  });
  
  if (!houseNdola) {
    houseNdola = await prisma.property.create({
      data: {
        title: '4-Bedroom House in Ndola Northrise',
        description: 'Beautiful family home in sought-after Northrise area. Features spacious rooms, modern kitchen, large garden, borehole, and double garage. Quiet neighborhood with good schools nearby.',
        price: 1200000,
        deposit: 120000,
        country: 'Zambia',
        city: 'Ndola',
        area: 'Northrise',
        addressText: 'Northrise, Ndola',
        latitude: -12.978,
        longitude: 28.650,
        bedrooms: 4,
        bathrooms: 3,
        sizeSqm: 250,
        furnished: false,
        parkingSpaces: 3,
        petsAllowed: true,
        internetAvailable: true,
        waterSource: 'BOREHOLE',
        powerBackup: 'SOLAR',
        securityFeatures: ['Wall Fence', 'Electric Gate', 'Alarm'],
        isShortStay: false,
        isStudentFriendly: false,
        amenities: ['Garden', 'Borehole', 'Solar', 'Garage', 'Staff Quarter'],
        rules: [],
        status: 'APPROVED',
        listingType: 'SALE',
        propertyType: 'HOUSE',
        yearBuilt: 2016,
        lotSizeSqm: 1200,
        isFeatured: false,
        ownerId: landlord.id,
        images: { 
          create: [
            { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', sortOrder: 1 },
          ] 
        },
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('Users:', { admin: admin.id, landlord: landlord.id, agent: agent.id, tenant: tenant.id });
  console.log('Properties created: Residential (rentals & sales) + Commercial (offices, shops, coworking, warehouses, restaurants) + Mixed-use');

  console.log('Neighborhoods:', { kabulonga: kabulonga.id, rhodespark: rhodespark.id, woodlands: woodlands.id });
  console.log('Agent Profile:', agentProfile.id);
  console.log('Service Providers: 8 providers created (6 verified, 2 pending)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
