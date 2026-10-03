import React from 'react';
import Header from '../../components/Header';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../lib/auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('denuel_token')?.value;
  let user = null;
  if (token) {
    try {
      user = await requireAuth(new Request('http://localhost', { headers: { cookie: `denuel_token=${token}` } }));
    } catch (e) {
      // not authenticated - token might be expired
      console.log('Auth failed:', e);
    }
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Please log in to access your dashboard</h2>
          <Link href="/auth/login?redirect=/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </main>
    );
  }

  // Role-based dashboard
  if (user.role === 'ADMIN') {
    const totals = {
      properties: await prisma.property.count(),
      users: await prisma.user.count(),
      applications: await prisma.application.count(),
      bookings: await prisma.booking.count(),
      revenue: await prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amountZmw: true }
      })
    };
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    const pendingProperties = await prisma.property.count({
      where: { status: 'PENDING' }
    });
    const reportedListings = await prisma.listingReport.count({
      where: { status: 'PENDING' }
    });

    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <Link href="/admin/settings" className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
            System Settings
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Properties</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totals.properties}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Users</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totals.users}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Applications</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totals.applications}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Bookings</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totals.bookings}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Revenue</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">K{totals.revenue._sum.amountZmw || 0}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Recent User Registrations</h3>
            <div className="space-y-3">
              {recentUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-medium">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email} • {user.role}</p>
                    <p className="text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/admin/users/${user.id}`} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors">
                    View
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/admin/users" className="text-blue-600 hover:underline text-sm mt-3 inline-block">View all users →</Link>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">System Alerts</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">Pending Property Approvals</h4>
                    <p className="text-sm text-yellow-700">{pendingProperties} properties waiting for review</p>
                  </div>
                  <Link href="/admin/properties/pending" className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm hover:bg-yellow-700 transition-colors">
                    Review
                  </Link>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-800">Reported Listings</h4>
                    <p className="text-sm text-red-700">{reportedListings} reports need attention</p>
                  </div>
                  <Link href="/admin/reports" className="bg-red-600 text-white px-3 py-1 rounded-full text-sm hover:bg-red-700 transition-colors">
                    Review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/users" className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors text-center">
              <div className="text-sm font-medium">User Management</div>
            </Link>
            <Link href="/admin/properties" className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors text-center">
              <div className="text-sm font-medium">Property Oversight</div>
            </Link>
            <Link href="/admin/analytics" className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors text-center">
              <div className="text-sm font-medium">Analytics Dashboard</div>
            </Link>
            <Link href="/admin/reports" className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors text-center">
              <div className="text-sm font-medium">Reports & Moderation</div>
            </Link>
            <Link href="/admin/financial" className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors text-center">
              <div className="text-sm font-medium">Financial Reports</div>
            </Link>
            <Link href="/admin/settings" className="bg-teal-600 text-white p-4 rounded-xl hover:bg-teal-700 transition-colors text-center">
              <div className="text-sm font-medium">System Settings</div>
            </Link>
            <Link href="/admin/marketing" className="bg-pink-600 text-white p-4 rounded-xl hover:bg-pink-700 transition-colors text-center">
              <div className="text-sm font-medium">Marketing Tools</div>
            </Link>
            <Link href="/admin/support" className="bg-gray-600 text-white p-4 rounded-xl hover:bg-gray-700 transition-colors text-center">
              <div className="text-sm font-medium">Support Center</div>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (user.role === 'LANDLORD') {
    const properties = await prisma.property.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { applications: true } } }
    });
    const totalApplications = await prisma.application.count({
      where: { property: { ownerId: user.id } }
    });
    const approvedApplications = await prisma.application.count({
      where: { property: { ownerId: user.id }, status: 'APPROVED' }
    });
    const pendingApplications = await prisma.application.count({
      where: { property: { ownerId: user.id }, status: 'PENDING' }
    });
    const totalRevenue = await prisma.booking.aggregate({
      where: { property: { ownerId: user.id }, status: 'CONFIRMED' },
      _sum: { amountZmw: true }
    });

    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Landlord Dashboard</h2>
          <Link 
            href="/dashboard/properties/new" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Property
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Properties</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{properties.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Applications</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totalApplications}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Approved Tenants</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{approvedApplications}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Total Revenue</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">K{totalRevenue._sum.amountZmw || 0}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">My Properties</h3>
            {properties.length === 0 ? (
              <p className="text-gray-600">No properties listed yet. <Link href="/dashboard/properties/new" className="text-blue-600 hover:underline">Add your first property</Link></p>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 5).map(property => (
                  <div key={property.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-medium">{property.title}</h4>
                      <p className="text-sm text-gray-600">{property.city}{property.area ? `, ${property.area}` : ''} • K{property.price}/month</p>
                      <p className="text-sm text-gray-600">{property._count.applications} applications</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/properties/${property.id}/edit`} className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm hover:bg-gray-700 transition-colors">
                        Edit
                      </Link>
                      <Link href={`/dashboard/properties/${property.id}/applications`} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors">
                        View Apps
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {properties.length > 5 && (
              <Link href="/dashboard/properties" className="text-blue-600 hover:underline text-sm mt-3 inline-block">View all properties →</Link>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/properties/new" className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors text-center">
                <div className="text-sm font-medium">Add Property</div>
              </Link>
              <Link href="/dashboard/applications" className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors text-center">
                <div className="text-sm font-medium">Review Applications</div>
              </Link>
              <Link href="/dashboard/reports" className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors text-center">
                <div className="text-sm font-medium">Financial Reports</div>
              </Link>
              <Link href="/dashboard/analytics" className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors text-center">
                <div className="text-sm font-medium">Property Analytics</div>
              </Link>
              <Link href="/dashboard/messages" className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors text-center">
                <div className="text-sm font-medium">Messages</div>
              </Link>
              <Link href="/dashboard/settings" className="bg-teal-600 text-white p-4 rounded-xl hover:bg-teal-700 transition-colors text-center">
                <div className="text-sm font-medium">Account Settings</div>
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Application Status Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">{pendingApplications}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{approvedApplications}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-600">{totalApplications - approvedApplications - pendingApplications}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (user.role === 'AGENT') {
    const properties = await prisma.property.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { applications: true } } }
    });
    const totalInquiries = await prisma.message.count({
      where: { receiverId: user.id }
    });
    const activeClients = 0; // TODO: Implement agent-client relationship
    const commissionEarned = await prisma.booking.aggregate({
      where: { property: { ownerId: user.id }, status: 'CONFIRMED' },
      _sum: { amountZmw: true }
    });
    const recentInquiries = await prisma.message.findMany({
      where: { receiverId: user.id },
      include: { sender: { select: { name: true, email: true } }, thread: { include: { property: { select: { title: true, city: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Agent Dashboard</h2>
          <Link href="/dashboard/clients" className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
            Manage Clients
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Managed Properties</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{properties.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Client Inquiries</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{totalInquiries}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Active Clients</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{activeClients}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm font-medium">Commission Earned</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">K{commissionEarned._sum.amountZmw || 0}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Recent Client Inquiries</h3>
            {recentInquiries.length === 0 ? (
              <p className="text-gray-600">No recent inquiries. Start marketing your properties!</p>
            ) : (
              <div className="space-y-3">
                {recentInquiries.map(inquiry => (
                  <div key={inquiry.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{inquiry.sender.name}</h4>
                        <p className="text-sm text-gray-600">{inquiry.thread?.property?.title || 'Property Inquiry'} • {inquiry.thread?.property?.city || ''}</p>
                        <p className="text-sm text-gray-600">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        !inquiry.isRead ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {!inquiry.isRead ? 'NEW' : 'READ'}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{inquiry.body}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/inquiries" className="text-blue-600 hover:underline text-sm mt-3 inline-block">View all inquiries →</Link>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/properties/new" className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors text-center">
                <div className="text-sm font-medium">List Property</div>
              </Link>
              <Link href="/dashboard/clients" className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors text-center">
                <div className="text-sm font-medium">Manage Clients</div>
              </Link>
              <Link href="/dashboard/marketing" className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors text-center">
                <div className="text-sm font-medium">Marketing Tools</div>
              </Link>
              <Link href="/dashboard/commission" className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors text-center">
                <div className="text-sm font-medium">Commission Tracker</div>
              </Link>
              <Link href="/dashboard/messages" className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors text-center">
                <div className="text-sm font-medium">Client Messages</div>
              </Link>
              <Link href="/dashboard/analytics" className="bg-teal-600 text-white p-4 rounded-xl hover:bg-teal-700 transition-colors text-center">
                <div className="text-sm font-medium">Performance Analytics</div>
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Agent Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/training" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <h4 className="font-medium mb-2">Training & Resources</h4>
              <p className="text-sm text-gray-600">Improve your selling skills</p>
            </Link>
            <Link href="/dashboard/market-reports" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <h4 className="font-medium mb-2">Market Reports</h4>
              <p className="text-sm text-gray-600">Stay updated on market trends</p>
            </Link>
            <Link href="/dashboard/support" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <h4 className="font-medium mb-2">Support Center</h4>
              <p className="text-sm text-gray-600">Get help when you need it</p>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Default USER (Tenant) dashboard
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { property: { select: { title: true, city: true } } },
    orderBy: { appliedAt: 'desc' },
    take: 5
  });
  const favorites = await prisma.favorite.count({ where: { userId: user.id } });
  const notifications = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  const savedSearches = await prisma.savedSearch.count({ where: { userId: user.id } });

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Tenant Dashboard</h2>
        <Link href="/profile" className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
          Edit Profile
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-600 text-sm font-medium">My Applications</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{applications.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-600 text-sm font-medium">Saved Properties</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{favorites}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-600 text-sm font-medium">Saved Searches</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{savedSearches}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-600 text-sm font-medium">Unread Notifications</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{notifications}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Recent Applications</h3>
          {applications.length === 0 ? (
            <p className="text-gray-600">No applications yet. <Link href="/rent" className="text-blue-600 hover:underline">Browse properties</Link></p>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-medium">{app.property.title}</h4>
                    <p className="text-sm text-gray-600">{app.property.city} • {app.status} • {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/renter-hub" className="text-blue-600 hover:underline text-sm mt-3 inline-block">View all applications →</Link>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/rent" className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors text-center">
              <div className="text-sm font-medium">Find Properties</div>
            </Link>
            <Link href="/favorites" className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors text-center">
              <div className="text-sm font-medium">My Favorites</div>
            </Link>
            <Link href="/saved-searches" className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors text-center">
              <div className="text-sm font-medium">Saved Searches</div>
            </Link>
            <Link href="/rent-payment" className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors text-center">
              <div className="text-sm font-medium">Pay Rent</div>
            </Link>
            <Link href="/business-tools/budget-calculator" className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors text-center">
              <div className="text-sm font-medium">Budget Calculator</div>
            </Link>
            <Link href="/renters-insurance" className="bg-teal-600 text-white p-4 rounded-xl hover:bg-teal-700 transition-colors text-center">
              <div className="text-sm font-medium">Get Insurance</div>
            </Link>
            <Link href="/driver/apply" className="bg-yellow-600 text-white p-4 rounded-xl hover:bg-yellow-700 transition-colors text-center">
              <div className="text-sm font-medium">Become a Driver</div>
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Tenant Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/renters-guide" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <h4 className="font-medium mb-2">Renter&apos;s Guide</h4>
            <p className="text-sm text-gray-600">Tips for successful renting</p>
          </Link>
          <Link href="/research" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <h4 className="font-medium mb-2">Market Research</h4>
            <p className="text-sm text-gray-600">Rental trends and insights</p>
          </Link>
          <Link href="/notifications" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <h4 className="font-medium mb-2">Notifications</h4>
            <p className="text-sm text-gray-600">Stay updated on your applications</p>
          </Link>
        </div>
      </div>
    </main>
  );
}