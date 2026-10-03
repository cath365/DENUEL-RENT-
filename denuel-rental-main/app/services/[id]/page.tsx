'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface ServiceProvider {
  id: string;
  businessName: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  address: string;
  profilePhotoUrl: string;
  logoUrl: string;
  coverPhotoUrl: string;
  priceRange: string;
  hourlyRate: number;
  minimumCharge: number;
  yearsInBusiness: number;
  isVerified: boolean;
  isAvailable: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  servicesOffered: string[];
  serviceAreas: string[];
  languages: string[];
  workingHours: Record<string, string>;
  bio: string;
  portfolio: PortfolioItem[];
  reviews: Review[];
  documents: { type: string; isVerified: boolean }[];
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  projectDate?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

interface Review {
  id: string;
  reviewer: { name: string };
  rating: number;
  review: string;
  priceRating: number;
  qualityRating: number;
  timelinessRating: number;
  createdAt: string;
}

// Enhanced category info with job-specific details
const CATEGORY_INFO: Record<string, {
  label: string;
  icon: string;
  gradient: string;
  bgPattern: string;
  skills: string[];
  certifications: string[];
  tools: string[];
  specialties: string[];
  portfolioLabels: { title: string; subtitle: string };
  trustBadges: string[];
  ctaText: string;
}> = {
  GARDENER: {
    label: 'Gardener / Landscaping',
    icon: '🌿',
    gradient: 'from-green-500 to-emerald-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-emerald-50 to-white',
    skills: ['Lawn Care', 'Plant Selection', 'Irrigation', 'Tree Trimming', 'Soil Analysis', 'Garden Design'],
    certifications: ['Certified Horticulturist', 'Landscape Design', 'Organic Gardening'],
    tools: ['Lawn Mowers', 'Hedge Trimmers', 'Irrigation Systems', 'Soil Testers'],
    specialties: ['Residential Gardens', 'Commercial Landscapes', 'Sustainable Design'],
    portfolioLabels: { title: 'Garden Transformations', subtitle: 'Before & After Projects' },
    trustBadges: ['Eco-Friendly Products', 'Licensed & Insured', 'Satisfaction Guaranteed'],
    ctaText: 'Get a Garden Quote'
  },
  LANDSCAPER: {
    label: 'Landscaper',
    icon: '🏡',
    gradient: 'from-green-600 to-teal-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100 via-green-50 to-white',
    skills: ['Hardscaping', 'Softscaping', 'Drainage Solutions', 'Outdoor Lighting', 'Patio Design', 'Retaining Walls'],
    certifications: ['Certified Landscape Professional', 'Irrigation Specialist', 'Outdoor Living Design'],
    tools: ['Excavators', 'Stone Cutters', 'Lighting Systems', 'CAD Software'],
    specialties: ['Outdoor Living Spaces', 'Water Features', 'Native Plant Gardens'],
    portfolioLabels: { title: 'Landscape Projects', subtitle: 'Outdoor Living Transformations' },
    trustBadges: ['Design Consultation', 'Project Warranty', '3D Visualization'],
    ctaText: 'Design My Landscape'
  },
  PEST_CONTROL: {
    label: 'Pest Control',
    icon: '🐜',
    gradient: 'from-orange-500 to-red-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-red-50 to-white',
    skills: ['Termite Control', 'Rodent Removal', 'Insect Extermination', 'Wildlife Management', 'Fumigation', 'Prevention'],
    certifications: ['Licensed Exterminator', 'Integrated Pest Management', 'Wildlife Control'],
    tools: ['Thermal Cameras', 'Moisture Meters', 'Treatment Equipment', 'Safety Gear'],
    specialties: ['Residential Pest Control', 'Commercial Services', 'Emergency Response'],
    portfolioLabels: { title: 'Pest-Free Results', subtitle: 'Before & After Treatments' },
    trustBadges: ['Eco-Safe Products', 'Licensed & Certified', '90-Day Guarantee'],
    ctaText: 'Schedule Inspection'
  },
  MOVER: {
    label: 'Moving Services',
    icon: '🚚',
    gradient: 'from-blue-500 to-indigo-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white',
    skills: ['Packing & Unpacking', 'Furniture Disassembly', 'Heavy Lifting', 'Long-Distance Moving', 'Storage Solutions', 'Piano Moving'],
    certifications: ['Licensed Mover', 'Certified Packing Specialist', 'Cargo Insurance'],
    tools: ['Moving Trucks', 'Dollies', 'Protective Wrapping', 'Lift Equipment'],
    specialties: ['Residential Moves', 'Office Relocation', 'International Shipping'],
    portfolioLabels: { title: 'Successful Moves', subtitle: 'Happy Customers & Delivered Items' },
    trustBadges: ['Fully Insured', 'On-Time Guarantee', 'No Hidden Fees'],
    ctaText: 'Get Moving Quote'
  },
  CLEANER: {
    label: 'Cleaning Services',
    icon: '🧹',
    gradient: 'from-sky-500 to-blue-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-blue-50 to-white',
    skills: ['Deep Cleaning', 'Carpet Cleaning', 'Window Washing', 'Move-Out Cleaning', 'Sanitization', 'Organizing'],
    certifications: ['Professional Cleaner', 'Green Cleaning Certified', 'OSHA Safety'],
    tools: ['Industrial Vacuums', 'Steam Cleaners', 'Eco-Friendly Products', 'Microfiber Systems'],
    specialties: ['Residential Cleaning', 'Commercial Janitorial', 'Post-Construction'],
    portfolioLabels: { title: 'Spotless Results', subtitle: 'Before & After Transformations' },
    trustBadges: ['Eco-Friendly', 'Background Checked', 'Satisfaction Guaranteed'],
    ctaText: 'Book Cleaning'
  },
  MAID: {
    label: 'Maid / Housekeeper',
    icon: '👩‍🦰',
    gradient: 'from-pink-500 to-rose-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-100 via-rose-50 to-white',
    skills: ['House Cleaning', 'Laundry', 'Ironing', 'Meal Prep', 'Organizing', 'Pet Care'],
    certifications: ['Professional Housekeeper', 'First Aid Certified', 'Childcare Training'],
    tools: ['Cleaning Supplies', 'Organization Systems', 'Kitchen Equipment'],
    specialties: ['Live-In Housekeeping', 'Part-Time Service', 'Event Preparation'],
    portfolioLabels: { title: 'Organized Homes', subtitle: 'Immaculate Spaces' },
    trustBadges: ['Background Verified', 'Bonded & Insured', 'References Available'],
    ctaText: 'Hire Housekeeper'
  },
  PAINTER: {
    label: 'Painting',
    icon: '🎨',
    gradient: 'from-purple-500 to-pink-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 via-pink-50 to-white',
    skills: ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Texture Finishes', 'Color Consulting', 'Staining'],
    certifications: ['Certified Painter', 'Lead-Safe Certified', 'Color Consultant'],
    tools: ['Spray Equipment', 'Scaffolding', 'Premium Paints', 'Surface Prep Tools'],
    specialties: ['Residential Painting', 'Commercial Projects', 'Decorative Finishes'],
    portfolioLabels: { title: 'Color Transformations', subtitle: 'Before & After Paint Jobs' },
    trustBadges: ['Premium Materials', 'Clean Work Guaranteed', '2-Year Warranty'],
    ctaText: 'Get Paint Estimate'
  },
  PLUMBER: {
    label: 'Plumbing',
    icon: '🔧',
    gradient: 'from-cyan-500 to-blue-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100 via-blue-50 to-white',
    skills: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning', 'Water Heater', 'Fixture Installation', 'Emergency Service'],
    certifications: ['Licensed Plumber', 'Master Plumber', 'Gas Line Certified'],
    tools: ['Pipe Cameras', 'Hydro Jetters', 'Leak Detectors', 'Soldering Equipment'],
    specialties: ['Residential Plumbing', 'Commercial Systems', '24/7 Emergency'],
    portfolioLabels: { title: 'Plumbing Projects', subtitle: 'Professional Installations & Repairs' },
    trustBadges: ['Licensed & Bonded', '24/7 Emergency', 'Upfront Pricing'],
    ctaText: 'Call Plumber Now'
  },
  SECURITY: {
    label: 'Security Services',
    icon: '🔒',
    gradient: 'from-gray-700 to-gray-900',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-200 via-slate-100 to-white',
    skills: ['Security Guards', 'CCTV Installation', 'Access Control', 'Patrol Services', 'Event Security', 'Alarm Systems'],
    certifications: ['Security License', 'First Aid', 'Fire Safety', 'Conflict Resolution'],
    tools: ['CCTV Systems', 'Access Panels', 'Communication Radios', 'Patrol Vehicles'],
    specialties: ['Residential Security', 'Commercial Protection', 'Event Management'],
    portfolioLabels: { title: 'Security Solutions', subtitle: 'Protected Properties' },
    trustBadges: ['Licensed Guards', '24/7 Monitoring', 'Rapid Response'],
    ctaText: 'Get Security Quote'
  },
  INTERIOR_DESIGNER: {
    label: 'Interior Design',
    icon: '🛋️',
    gradient: 'from-amber-500 to-orange-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-orange-50 to-white',
    skills: ['Space Planning', 'Color Theory', 'Furniture Selection', '3D Rendering', 'Lighting Design', 'Material Selection'],
    certifications: ['Certified Interior Designer', 'NCIDQ', 'Sustainable Design'],
    tools: ['CAD Software', '3D Visualization', 'Material Samples', 'Project Management'],
    specialties: ['Residential Design', 'Commercial Interiors', 'Renovation Projects'],
    portfolioLabels: { title: 'Design Portfolio', subtitle: 'Stunning Interior Transformations' },
    trustBadges: ['Free Consultation', '3D Preview', 'Budget-Friendly Options'],
    ctaText: 'Start Design Project'
  },
  ELECTRICIAN: {
    label: 'Electrician',
    icon: '⚡',
    gradient: 'from-yellow-500 to-amber-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100 via-amber-50 to-white',
    skills: ['Wiring', 'Panel Upgrades', 'Lighting Installation', 'Outlet Repair', 'EV Chargers', 'Generator Install'],
    certifications: ['Licensed Electrician', 'Master Electrician', 'EV Charging Certified'],
    tools: ['Multimeters', 'Wire Strippers', 'Circuit Testers', 'Conduit Benders'],
    specialties: ['Residential Electrical', 'Commercial Systems', 'Smart Home'],
    portfolioLabels: { title: 'Electrical Work', subtitle: 'Professional Installations' },
    trustBadges: ['Licensed & Insured', 'Code Compliant', 'Safety First'],
    ctaText: 'Schedule Electrician'
  },
  CONTRACTOR: {
    label: 'General Contractor',
    icon: '🏗️',
    gradient: 'from-slate-600 to-gray-700',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-gray-100 to-white',
    skills: ['Renovations', 'Additions', 'Remodeling', 'Project Management', 'Permits', 'Subcontractor Coordination'],
    certifications: ['Licensed Contractor', 'Project Management', 'OSHA Certified'],
    tools: ['Power Tools', 'Construction Equipment', 'Project Software', 'Safety Equipment'],
    specialties: ['Home Renovations', 'Commercial Build-Outs', 'New Construction'],
    portfolioLabels: { title: 'Construction Projects', subtitle: 'Complete Builds & Renovations' },
    trustBadges: ['Licensed & Bonded', 'Permit Handling', 'Project Warranty'],
    ctaText: 'Get Project Quote'
  },
  HOME_INSPECTOR: {
    label: 'Home Inspector',
    icon: '🔍',
    gradient: 'from-emerald-500 to-teal-600',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-teal-50 to-white',
    skills: ['Structural Inspection', 'Electrical Systems', 'Plumbing', 'HVAC', 'Roof Inspection', 'Foundation'],
    certifications: ['Certified Home Inspector', 'InterNACHI', 'Thermal Imaging'],
    tools: ['Thermal Cameras', 'Moisture Meters', 'Electrical Testers', 'Drones'],
    specialties: ['Pre-Purchase Inspection', 'Pre-Listing', 'New Construction'],
    portfolioLabels: { title: 'Inspection Reports', subtitle: 'Detailed Property Assessments' },
    trustBadges: ['Certified Inspector', 'Detailed Reports', 'Same-Day Service'],
    ctaText: 'Book Inspection'
  },
};

export default function ServiceProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('all');
  const [showBeforeAfter, setShowBeforeAfter] = useState<string | null>(null);

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    serviceType: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchProvider();
  }, [params.id]);

  const fetchProvider = async () => {
    try {
      const res = await fetch(`/api/services/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    try {
      const res = await fetch('/api/services/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider?.id,
          serviceType: bookingForm.serviceType,
          scheduledAt: new Date(`${bookingForm.scheduledDate}T${bookingForm.scheduledTime}`),
          notes: bookingForm.notes,
          customerName: bookingForm.name,
          customerPhone: bookingForm.phone,
          customerEmail: bookingForm.email,
        }),
      });

      if (res.ok) {
        alert('Booking request sent successfully! The provider will contact you shortly.');
        setShowBookingModal(false);
        setBookingForm({
          serviceType: '',
          scheduledDate: '',
          scheduledTime: '',
          notes: '',
          name: '',
          phone: '',
          email: '',
        });
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to send booking request');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to send booking request. Please try again.');
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORY_INFO[category] || {
      label: category,
      icon: '🔧',
      gradient: 'from-gray-500 to-gray-700',
      bgPattern: 'bg-gradient-to-br from-gray-100 via-white to-gray-50',
      skills: [],
      certifications: [],
      tools: [],
      specialties: [],
      portfolioLabels: { title: 'Work Portfolio', subtitle: 'Our Projects' },
      trustBadges: ['Professional Service', 'Quality Guaranteed'],
      ctaText: 'Book Service'
    };
  };

  // Get category-specific skill match percentage
  const getSkillMatch = () => {
    const categoryInfo = getCategoryInfo(provider?.category || '');
    const providedServices = provider?.servicesOffered || [];
    const categorySkills = categoryInfo.skills;
    if (categorySkills.length === 0) return 100;
    const matchCount = providedServices.filter(s => 
      categorySkills.some(skill => s.toLowerCase().includes(skill.toLowerCase()))
    ).length;
    return Math.min(100, Math.round((matchCount / categorySkills.length) * 100) + 40);
  };

  const calculateResponseTime = () => {
    // Simulated response time based on availability and rating
    if (provider?.isAvailable && provider.ratingAvg >= 4.5) return "< 1 hour";
    if (provider?.isAvailable) return "< 3 hours";
    return "< 24 hours";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-6">The service provider you're looking for doesn't exist or has been removed.</p>
          <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  const verifiedDocs = provider.documents?.filter(d => d.isVerified).length || 0;
  const categoryInfo = getCategoryInfo(provider.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />

      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.gradient} opacity-90`}></div>
        
        {provider.coverPhotoUrl && (
          <img
            src={provider.coverPhotoUrl}
            alt="Cover"
            className="w-full h-full object-cover absolute inset-0 mix-blend-overlay"
          />
        )}
        
        {/* Animated Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Floating Stats Cards */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 px-4">
          <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl w-full">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-xl text-center transform hover:scale-105 transition">
              <div className="text-2xl md:text-3xl font-bold text-gray-800">{provider.completedJobs}</div>
              <div className="text-xs md:text-sm text-gray-600">Projects Done</div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-xl text-center transform hover:scale-105 transition">
              <div className="flex items-center justify-center gap-1 text-2xl md:text-3xl font-bold text-yellow-500">
                <span>★</span> {provider.ratingAvg.toFixed(1)}
              </div>
              <div className="text-xs md:text-sm text-gray-600">{provider.ratingCount} Reviews</div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-xl text-center transform hover:scale-105 transition">
              <div className="text-2xl md:text-3xl font-bold text-gray-800">{provider.yearsInBusiness || 5}+</div>
              <div className="text-xs md:text-sm text-gray-600">Years Exp.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20 md:-mt-32 relative z-10 pb-16">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 border border-gray-100">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Profile Photo with Animation */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-2xl transform group-hover:scale-105 transition duration-300">
                  {provider.profilePhotoUrl || provider.logoUrl ? (
                    <img
                      src={provider.profilePhotoUrl || provider.logoUrl}
                      alt={provider.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br ${categoryInfo.gradient}`}>
                      <span className="filter drop-shadow-lg">{categoryInfo.icon}</span>
                    </div>
                  )}
                </div>
                {/* Online Status Indicator */}
                {provider.isAvailable && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white rounded-full w-8 h-8 animate-pulse shadow-lg"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{provider.businessName}</h1>
                      {provider.isVerified && (
                        <div className="relative group/badge">
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md flex items-center gap-1">
                            <span className="text-sm">✓</span> VERIFIED
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/badge:block">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                              Identity & Documents Verified
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-2 justify-center md:justify-start">
                      <span className="text-2xl">{categoryInfo.icon}</span>
                      <span className="font-medium text-lg">{categoryInfo.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-500 justify-center md:justify-start flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">📍</span>
                        {provider.city}{provider.area && `, ${provider.area}`}
                      </span>
                      {provider.languages && provider.languages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-lg">🌐</span>
                          {provider.languages.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="group px-5 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <span className="text-xl group-hover:animate-bounce">📞</span>
                      <span>Contact</span>
                    </button>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="group px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <span className="text-xl">📅</span>
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Status Badges */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {provider.isAvailable && (
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-full font-medium shadow-md flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Available Now
                    </span>
                  )}
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                    ⚡ Responds in {calculateResponseTime()}
                  </span>
                  {verifiedDocs > 0 && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                      📄 {verifiedDocs} Docs Verified
                    </span>
                  )}
                </div>

                {/* Price Range with Better Design */}
                {(provider.priceRange || provider.hourlyRate) && (
                  <div className="inline-flex items-center gap-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="text-green-700 font-bold text-lg">
                        {provider.priceRange || `K${provider.hourlyRate}/hour`}
                      </div>
                      {provider.minimumCharge && (
                        <div className="text-green-600 text-sm">Minimum: K{provider.minimumCharge}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Tabs */}
          <div className="border-t bg-gray-50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {[
                { id: 'about', label: 'About', icon: '👤' },
                { id: 'portfolio', label: 'Portfolio', icon: '🎨' },
                { id: 'reviews', label: 'Reviews', icon: '⭐' },
                { id: 'services', label: 'Services', icon: '🔧' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-semibold whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-white border-b-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <>
                {/* Professional Summary Card */}
                <div className={`${categoryInfo.bgPattern} rounded-xl shadow-lg p-6 border`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                      {categoryInfo.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Professional {categoryInfo.label}</h2>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {provider.description || provider.bio || `Experienced ${categoryInfo.label.toLowerCase()} providing quality services in ${provider.city}. Contact us for all your ${categoryInfo.label.toLowerCase()} needs.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center text-white text-xl mb-2`}>
                      📊
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{provider.completedJobs || 0}+</div>
                    <div className="text-sm text-gray-500">Jobs Done</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center text-white text-xl mb-2`}>
                      ⭐
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{provider.ratingAvg?.toFixed(1) || '5.0'}</div>
                    <div className="text-sm text-gray-500">Avg Rating</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center text-white text-xl mb-2`}>
                      📅
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{provider.yearsInBusiness || 5}+</div>
                    <div className="text-sm text-gray-500">Years Exp</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center text-white text-xl mb-2`}>
                      👥
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{provider.ratingCount || 0}</div>
                    <div className="text-sm text-gray-500">Reviews</div>
                  </div>
                </div>

                {/* Services Offered with Category Match */}
                {provider.servicesOffered && provider.servicesOffered.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🔧</span> Services Offered
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {provider.servicesOffered.map((service, idx) => {
                        const isMainSkill = categoryInfo.skills.some(s => 
                          service.toLowerCase().includes(s.toLowerCase())
                        );
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              isMainSkill 
                                ? `bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-md` 
                                : 'bg-gray-50 text-gray-700 border'
                            }`}
                          >
                            <span className={`text-lg ${isMainSkill ? '' : 'text-green-500'}`}>
                              {isMainSkill ? '⭐' : '✓'}
                            </span>
                            <span className="font-medium">{service}</span>
                            {isMainSkill && (
                              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Core Skill</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Service Areas Map Style */}
                {provider.serviceAreas && provider.serviceAreas.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📍</span> Service Coverage Areas
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {provider.serviceAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className={`px-4 py-2 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-default`}
                        >
                          📍 {area}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      💡 Contact for service availability in areas not listed above
                    </p>
                  </div>
                )}

                {/* Working Hours */}
                {provider.workingHours && Object.keys(provider.workingHours).length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🕐</span> Working Hours
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(provider.workingHours).map(([day, hours]) => (
                        <div key={day} className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="font-semibold text-gray-800 capitalize">{day}</div>
                          <div className="text-sm text-gray-600">{hours || 'Closed'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Expertise Highlight */}
                <div className={`bg-gradient-to-r ${categoryInfo.gradient} rounded-xl p-6 text-white`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl filter drop-shadow-lg">{categoryInfo.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold">Expert {categoryInfo.label}</h3>
                      <p className="opacity-90">Specialized skills for your needs</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryInfo.specialties.map((specialty, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-medium">{specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                {/* Portfolio Header with Category-Specific Title */}
                <div className={`rounded-2xl p-8 bg-gradient-to-r ${categoryInfo.gradient} text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-5xl filter drop-shadow-lg">{categoryInfo.icon}</span>
                      <div>
                        <h2 className="text-3xl font-bold">{categoryInfo.portfolioLabels.title}</h2>
                        <p className="opacity-90">{categoryInfo.portfolioLabels.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span>{provider.portfolio?.length || 0} Projects</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⭐</span>
                        <span>{provider.ratingAvg?.toFixed(1) || '5.0'} Avg Rating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>{provider.completedJobs || 0}+ Completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills & Expertise Grid */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💪</span> Skills & Expertise
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryInfo.skills.map((skill, idx) => {
                      const hasSkill = provider.servicesOffered?.some(s => 
                        s.toLowerCase().includes(skill.toLowerCase())
                      );
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                            hasSkill 
                              ? `bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-md transform hover:scale-105` 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span className={`text-lg ${hasSkill ? '' : 'opacity-50'}`}>
                            {hasSkill ? '✓' : '○'}
                          </span>
                          <span className="text-sm font-medium">{skill}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Skill Match Indicator */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Skill Proficiency</span>
                      <span className="text-sm font-bold text-gray-900">{getSkillMatch()}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${categoryInfo.gradient} transition-all duration-1000 rounded-full`}
                        style={{ width: `${getSkillMatch()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Certifications & Tools */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Certifications */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏆</span> Certifications
                    </h3>
                    <div className="space-y-3">
                      {categoryInfo.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{cert}</span>
                            {provider.isVerified && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tools & Equipment */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🛠️</span> Tools & Equipment
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryInfo.tools.map((tool, idx) => (
                        <span 
                          key={idx}
                          className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-sm hover:shadow-md transition-all duration-300 cursor-default`}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    
                    {/* Specialties */}
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Specializations</h4>
                      <div className="space-y-2">
                        {categoryInfo.specialties.map((spec, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-700">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${categoryInfo.gradient}`}></span>
                            <span className="text-sm">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Gallery */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">📸</span> Project Gallery
                    </h3>
                    
                    {/* Filter Tabs */}
                    {provider.portfolio && provider.portfolio.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPortfolioFilter('all')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            portfolioFilter === 'all' 
                              ? `bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-md` 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setPortfolioFilter('recent')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            portfolioFilter === 'recent' 
                              ? `bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-md` 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Recent
                        </button>
                      </div>
                    )}
                  </div>

                  {provider.portfolio && provider.portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {provider.portfolio
                        .filter(item => portfolioFilter === 'all' || (portfolioFilter === 'recent' && item.projectDate))
                        .map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative cursor-pointer"
                          onClick={() => setSelectedImage(item.imageUrl)}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                              <h4 className="font-bold text-white text-sm">{item.title}</h4>
                              {item.description && (
                                <p className="text-white/80 text-xs line-clamp-2 mt-1">{item.description}</p>
                              )}
                              {item.projectDate && (
                                <span className="text-white/60 text-xs mt-2">
                                  📅 {new Date(item.projectDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Project Number Badge */}
                          <div className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-r ${categoryInfo.gradient} text-white flex items-center justify-center text-sm font-bold shadow-lg`}>
                            {index + 1}
                          </div>
                          
                          {/* Category Badge */}
                          {item.category && (
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow">
                              {item.category}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <div className="text-6xl mb-4">{categoryInfo.icon}</div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Portfolio Coming Soon</h4>
                      <p className="text-gray-500 max-w-md mx-auto">
                        This {categoryInfo.label} provider is building their portfolio. 
                        Contact them to see examples of their previous work!
                      </p>
                      <button
                        onClick={() => setShowContactModal(true)}
                        className={`mt-6 px-6 py-3 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                      >
                        Request Portfolio
                      </button>
                    </div>
                  )}
                </div>

                {/* Trust Badges Section */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">✅</span> Why Choose This Provider
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categoryInfo.trustBadges.map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${categoryInfo.gradient} flex items-center justify-center`}>
                          <span className="text-white font-bold">✓</span>
                        </div>
                        <span className="font-medium">{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Section */}
                <div className={`${categoryInfo.bgPattern} rounded-xl p-8 text-center border`}>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Get Started?</h3>
                  <p className="text-gray-600 mb-6">Book {provider.businessName} for your next {categoryInfo.label.toLowerCase()} project</p>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className={`px-8 py-4 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
                  >
                    {categoryInfo.ctaText}
                  </button>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Reviews Summary Header */}
                <div className={`rounded-2xl p-8 bg-gradient-to-r ${categoryInfo.gradient} text-white text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-6xl font-bold mb-2">{provider.ratingAvg?.toFixed(1) || '5.0'}</div>
                    <div className="flex justify-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-2xl ${star <= Math.round(provider.ratingAvg || 5) ? 'text-yellow-300' : 'text-white/30'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-lg opacity-90">Based on {provider.ratingCount || 0} Reviews</div>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>🏆</span>
                        <span>{provider.completedJobs || 0}+ Jobs Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Verified Reviews Only</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Rating Breakdown</h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = provider.reviews?.filter(r => Math.round(r.rating) === rating).length || 0;
                      const percentage = provider.ratingCount > 0 ? (count / provider.ratingCount) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-16">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium text-gray-700">{rating}</span>
                          </div>
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${categoryInfo.gradient} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">💬</span> Customer Reviews ({provider.ratingCount || 0})
                  </h3>
                  {provider.reviews && provider.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {provider.reviews.map((review, idx) => (
                        <div key={review.id} className="relative">
                          {/* Review Card */}
                          <div className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${categoryInfo.gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                                {review.reviewer.name.charAt(0).toUpperCase()}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-semibold text-gray-800">{review.reviewer.name}</span>
                                    {idx === 0 && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Recent</span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                
                                {/* Star Rating */}
                                <div className="flex items-center gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-lg ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="ml-2 text-sm font-medium text-gray-600">{review.rating}/5</span>
                                </div>
                                
                                {/* Review Text */}
                                <p className="text-gray-700 leading-relaxed mb-3">{review.review}</p>
                                
                                {/* Detailed Ratings */}
                                {(review.priceRating || review.qualityRating || review.timelinessRating) && (
                                  <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
                                    {review.qualityRating && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-purple-500">🎯</span>
                                        <span className="text-gray-600">Quality:</span>
                                        <span className="font-medium text-gray-800">{review.qualityRating}/5</span>
                                      </div>
                                    )}
                                    {review.priceRating && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-green-500">💰</span>
                                        <span className="text-gray-600">Value:</span>
                                        <span className="font-medium text-gray-800">{review.priceRating}/5</span>
                                      </div>
                                    )}
                                    {review.timelinessRating && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-blue-500">⏰</span>
                                        <span className="text-gray-600">Timeliness:</span>
                                        <span className="font-medium text-gray-800">{review.timelinessRating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="text-5xl mb-4">⭐</div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">No Reviews Yet</h4>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Be the first to experience our {categoryInfo.label.toLowerCase()} services and share your feedback!
                      </p>
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className={`px-6 py-3 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                      >
                        {categoryInfo.ctaText}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Pricing Hero */}
                <div className={`rounded-2xl p-8 bg-gradient-to-r ${categoryInfo.gradient} text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative z-10 text-center">
                    <span className="text-6xl filter drop-shadow-lg mb-4 block">{categoryInfo.icon}</span>
                    <h2 className="text-3xl font-bold mb-2">{categoryInfo.label} Services</h2>
                    <p className="opacity-90 max-w-md mx-auto">Professional {categoryInfo.label.toLowerCase()} services tailored to your needs</p>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">💰</span> Service Pricing
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Hourly Rate Card */}
                    {provider.hourlyRate && (
                      <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all hover:shadow-lg text-center group">
                        <div className="text-sm text-gray-500 mb-2">Hourly Rate</div>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${categoryInfo.gradient} bg-clip-text text-transparent`}>
                          K{provider.hourlyRate}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">per hour</div>
                        <div className="mt-4 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                          Best for small jobs
                        </div>
                      </div>
                    )}
                    
                    {/* Minimum Charge Card */}
                    {provider.minimumCharge && (
                      <div className={`p-6 border-2 rounded-xl bg-gradient-to-b from-blue-50 to-white border-blue-300 shadow-lg text-center relative`}>
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                          POPULAR
                        </div>
                        <div className="text-sm text-gray-500 mb-2">Minimum Charge</div>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${categoryInfo.gradient} bg-clip-text text-transparent`}>
                          K{provider.minimumCharge}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">starting from</div>
                        <div className="mt-4 text-xs text-gray-500">
                          Most common choice
                        </div>
                      </div>
                    )}
                    
                    {/* Price Range Card */}
                    {provider.priceRange && (
                      <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 transition-all hover:shadow-lg text-center group">
                        <div className="text-sm text-gray-500 mb-2">Price Range</div>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${categoryInfo.gradient} bg-clip-text text-transparent`}>
                          {provider.priceRange}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">varies by project</div>
                        <div className="mt-4 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                          For larger projects
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <span>Prices may vary depending on the scope of work, materials needed, and location. Contact for a detailed, no-obligation quote.</span>
                  </div>
                </div>

                {/* What's Included */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">✨</span> What's Included
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { icon: '📞', title: 'Free Consultation', desc: 'Discuss your project needs' },
                      { icon: '📋', title: 'Written Estimate', desc: 'Detailed breakdown of costs' },
                      { icon: '🛠️', title: 'Professional Tools', desc: 'All equipment provided' },
                      { icon: '🧹', title: 'Clean Up', desc: 'Site cleaned after work' },
                      { icon: '✓', title: 'Quality Guarantee', desc: 'Satisfaction ensured' },
                      { icon: '📱', title: 'Easy Communication', desc: 'Available via call/WhatsApp' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-600">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Process */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">📌</span> How It Works
                  </h3>
                  <div className="relative">
                    {/* Process Steps */}
                    <div className="grid md:grid-cols-4 gap-4">
                      {[
                        { step: 1, title: 'Contact', desc: 'Reach out via phone or booking form' },
                        { step: 2, title: 'Discuss', desc: 'Describe your project requirements' },
                        { step: 3, title: 'Quote', desc: 'Receive a detailed price estimate' },
                        { step: 4, title: 'Schedule', desc: 'Book a convenient time' },
                      ].map((item) => (
                        <div key={item.step} className="relative text-center">
                          <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${categoryInfo.gradient} text-white flex items-center justify-center text-xl font-bold shadow-lg mb-3`}>
                            {item.step}
                          </div>
                          <h4 className="font-semibold text-gray-800">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Book CTA */}
                <div className={`${categoryInfo.bgPattern} rounded-xl p-8 text-center border`}>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Get Your Free Quote Today</h3>
                  <p className="text-gray-600 mb-6">No obligation - just honest pricing for your project</p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="px-6 py-3 border-2 border-gray-800 text-gray-800 rounded-xl font-semibold hover:bg-gray-800 hover:text-white transition-all"
                    >
                      📞 Call for Quote
                    </button>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className={`px-6 py-3 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
                    >
                      📅 {categoryInfo.ctaText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Contact</h3>
              <div className="space-y-3">
                <a
                  href={`tel:${provider.phone}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-xl">📞</span>
                  <span className="text-gray-700">{provider.phone}</span>
                </a>
                <a
                  href={`mailto:${provider.email}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-xl">✉️</span>
                  <span className="text-gray-700 truncate">{provider.email}</span>
                </a>
                <a
                  href={`https://wa.me/${provider.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>

            {/* Book Service */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Need this service?</h3>
              <p className="text-sm text-blue-600 mb-4">
                Book now and get a response within 24 hours.
              </p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Book Service
              </button>
            </div>

            {/* Trust Badges */}
            {provider.isVerified && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Trust & Safety</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✓</span> Identity Verified
                  </div>
                  {verifiedDocs > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span>✓</span> Documents Verified
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✓</span> Background Checked
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Book Service</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="+260..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.serviceType}
                    onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., House Cleaning, Garden Maintenance"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      value={bookingForm.scheduledDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      value={bookingForm.scheduledTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Describe your requirements, location details, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Contact {provider.businessName}</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <a
                href={`tel:${provider.phone}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-medium text-gray-800">Call</p>
                  <p className="text-gray-600">{provider.phone}</p>
                </div>
              </a>

              <a
                href={`mailto:${provider.email}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">✉️</span>
                <div>
                  <p className="font-medium text-gray-800">Email</p>
                  <p className="text-gray-600">{provider.email}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${provider.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              >
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-green-800">WhatsApp</p>
                  <p className="text-green-600">Send a message</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Portfolio"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
