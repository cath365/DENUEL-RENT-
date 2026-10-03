"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  avatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  propertyTitle: string | null;
  status: string;
  featured: boolean;
  order: number;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/testimonials?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.testimonials);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "feature" | "unfeature" | "delete") => {
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this testimonial?")) return;
        const response = await fetch(`/api/admin/testimonials?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchTestimonials();
        }
      } else {
        const updateData: any = { id };
        
        if (action === "approve") {
          updateData.status = "APPROVED";
        } else if (action === "reject") {
          updateData.status = "REJECTED";
        } else if (action === "feature") {
          updateData.featured = true;
        } else if (action === "unfeature") {
          updateData.featured = false;
        }

        const response = await fetch("/api/admin/testimonials", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          fetchTestimonials();
        }
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const viewDetails = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowModal(true);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials Management</h1>
          <p className="text-gray-600 mt-2">
            Review and approve testimonials for "What Our Renters Say" section
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-3xl font-bold text-blue-600">{stats.featured}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-4">No testimonials found</p>
              <p className="text-sm text-gray-500">
                Testimonials will appear here when users submit them
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name / Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Content Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                            {testimonial.avatar ? (
                              <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              testimonial.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {testimonial.name}
                            </p>
                            <div className="flex items-center gap-1 text-yellow-400">
                              {Array.from({ length: testimonial.rating }).map((_, i) => (
                                <span key={i}>⭐</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {testimonial.content}
                        </p>
                        {testimonial.propertyTitle && (
                          <p className="text-xs text-gray-500 mt-1">
                            Property: {testimonial.propertyTitle}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            testimonial.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : testimonial.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {testimonial.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {testimonial.featured ? (
                          <span className="text-2xl">⭐</span>
                        ) : (
                          <span className="text-gray-300">☆</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewDetails(testimonial)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                          {testimonial.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleAction(testimonial.id, "approve")}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(testimonial.id, "reject")}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {testimonial.status === "APPROVED" && (
                            <button
                              onClick={() =>
                                handleAction(
                                  testimonial.id,
                                  testimonial.featured ? "unfeature" : "feature"
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                            >
                              {testimonial.featured ? "Unfeature" : "Feature"}
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(testimonial.id, "delete")}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 About Testimonials</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Testimonials are submitted by users and require admin approval</li>
            <li>• Approved testimonials can be marked as "Featured" to show on the homepage</li>
            <li>• Featured testimonials appear in the "What Our Renters Say" section</li>
            <li>• You can edit display order by clicking on a testimonial</li>
            <li>• Only 5-star ratings are recommended for featuring</li>
          </ul>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Testimonial Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    {selectedTestimonial.avatar ? (
                      <img
                        src={selectedTestimonial.avatar}
                        alt={selectedTestimonial.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedTestimonial.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedTestimonial.name}</h3>
                    <p className="text-gray-600">
                      {selectedTestimonial.role} {selectedTestimonial.location && `• ${selectedTestimonial.location}`}
                    </p>
                    <div className="flex items-center gap-1 text-yellow-400 text-xl">
                      {Array.from({ length: selectedTestimonial.rating }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedTestimonial.title && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Title</h4>
                    <p className="text-gray-900">{selectedTestimonial.title}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Review</h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTestimonial.content}</p>
                </div>

                {selectedTestimonial.propertyTitle && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Property</h4>
                    <p className="text-gray-900">{selectedTestimonial.propertyTitle}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Status</h4>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedTestimonial.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : selectedTestimonial.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {selectedTestimonial.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Featured</h4>
                    <p className="text-gray-900">{selectedTestimonial.featured ? "Yes ⭐" : "No"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Submitted</h4>
                    <p className="text-gray-900">
                      {new Date(selectedTestimonial.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedTestimonial.user && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">User Account</h4>
                      <p className="text-gray-900 text-sm">{selectedTestimonial.user.email}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedTestimonial.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          handleAction(selectedTestimonial.id, "approve");
                          setShowModal(false);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleAction(selectedTestimonial.id, "reject");
                          setShowModal(false);
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedTestimonial.status === "APPROVED" && (
                    <button
                      onClick={() => {
                        handleAction(
                          selectedTestimonial.id,
                          selectedTestimonial.featured ? "unfeature" : "feature"
                        );
                        setShowModal(false);
                      }}
                      className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700"
                    >
                      {selectedTestimonial.featured ? "Remove from Featured" : "Mark as Featured"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
