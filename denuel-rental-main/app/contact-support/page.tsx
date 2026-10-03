"use client";

import React, { useState, useEffect } from "react";
import { csrfFetch } from "@/lib/csrf";

type MessageCategory =
  | "ADS_INQUIRY"
  | "FEATURE_REQUEST"
  | "TECHNICAL_SUPPORT"
  | "BILLING"
  | "GENERAL"
  | "COMPLAINT";

interface SupportMessage {
  id: string;
  category: MessageCategory;
  subject: string;
  message: string;
  contactInfo?: string;
  isRead: boolean;
  isResolved: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<MessageCategory, string> = {
  ADS_INQUIRY: "Ads & Advertising",
  FEATURE_REQUEST: "Feature Request",
  TECHNICAL_SUPPORT: "Technical Support",
  BILLING: "Billing & Payments",
  GENERAL: "General Inquiry",
  COMPLAINT: "Complaint",
};

export default function ContactSupportPage() {
  const [category, setCategory] = useState<MessageCategory>("GENERAL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await csrfFetch("/api/support");
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSubmitSuccess(false);

    try {
      const response = await csrfFetch("/api/support", {
        method: "POST",
        body: JSON.stringify({
          category,
          subject,
          message,
          contactInfo: contactInfo || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitSuccess(true);
      setSubject("");
      setMessage("");
      setContactInfo("");
      setCategory("GENERAL");
      
      // Refresh messages list
      fetchMessages();

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Support
          </h1>
          <p className="text-lg text-gray-600">
            Need help with ads, have a feature request, or want to discuss something? We're here for you!
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>📞 0973914432</span>
            <span>•</span>
            <span>📱 0779690132</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Send a Message
            </h2>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                ✓ Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MessageCategory)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Brief description of your inquiry"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="Describe your inquiry, feature request, or issue in detail..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Info (Optional)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number or email for callback"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Previous Messages */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Messages
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                      msg.isResolved
                        ? "border-green-500"
                        : msg.isRead
                        ? "border-blue-500"
                        : "border-orange-500"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {categoryLabels[msg.category]}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          msg.isResolved
                            ? "bg-green-100 text-green-800"
                            : msg.isRead
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {msg.isResolved ? "✓ Resolved" : msg.isRead ? "Read" : "New"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {msg.subject}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {msg.message}
                    </p>
                    {msg.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          Admin Response:
                        </p>
                        <p className="text-sm text-blue-800">{msg.adminNotes}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(msg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Advertising Inquiries
            </h3>
            <p className="text-sm text-gray-600">
              Want to advertise your business? Contact us for premium ad placements!
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Feature Requests
            </h3>
            <p className="text-sm text-gray-600">
              Have an idea? We'd love to hear your suggestions for new features!
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-3">🛠️</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Technical Support
            </h3>
            <p className="text-sm text-gray-600">
              Facing issues? Our support team is ready to help you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
