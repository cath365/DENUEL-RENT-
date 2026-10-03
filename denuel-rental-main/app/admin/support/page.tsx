"use client";

import { useState, useEffect } from "react";
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
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    role: string;
  };
}

interface Stats {
  total: number;
  unread: number;
  pending: number;
  resolved: number;
}

const categoryLabels: Record<MessageCategory, string> = {
  ADS_INQUIRY: "Ads & Advertising",
  FEATURE_REQUEST: "Feature Request",
  TECHNICAL_SUPPORT: "Technical Support",
  BILLING: "Billing & Payments",
  GENERAL: "General Inquiry",
  COMPLAINT: "Complaint",
};

const categoryEmoji: Record<MessageCategory, string> = {
  ADS_INQUIRY: "💰",
  FEATURE_REQUEST: "✨",
  TECHNICAL_SUPPORT: "🛠️",
  BILLING: "💳",
  GENERAL: "💬",
  COMPLAINT: "⚠️",
};

export default function AdminSupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    unread: 0,
    pending: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "pending" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await csrfFetch("/api/admin/support");
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async (
    messageId: string,
    updates: { isRead?: boolean; isResolved?: boolean; adminNotes?: string }
  ) => {
    setIsUpdating(true);
    try {
      const response = await csrfFetch("/api/admin/support", {
        method: "PATCH",
        body: JSON.stringify({
          messageId,
          ...updates,
        }),
      });

      if (response.ok) {
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error("Failed to update message:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await csrfFetch(`/api/admin/support?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const openMessageModal = (message: SupportMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || "");
    // Mark as read when opened
    if (!message.isRead) {
      handleUpdateMessage(message.id, { isRead: true });
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "unread" && msg.isRead) return false;
    if (filter === "pending" && msg.isResolved) return false;
    if (filter === "resolved" && !msg.isResolved) return false;
    if (categoryFilter !== "all" && msg.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Messages
          </h1>
          <p className="text-gray-600">
            Manage user inquiries, ads requests, and support tickets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-4xl">📩</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-3xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {["all", "unread", "pending", "resolved"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">No messages found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <tr
                    key={message.id}
                    className={`hover:bg-gray-50 ${!message.isRead ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {message.user.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">{message.user.email}</div>
                        {message.user.phone && (
                          <div className="text-sm text-gray-500">{message.user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {categoryEmoji[message.category]}
                        {categoryLabels[message.category]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                        {message.subject}
                      </div>
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {message.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          message.isResolved
                            ? "bg-green-100 text-green-800"
                            : message.isRead
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {message.isResolved ? "✓ Resolved" : message.isRead ? "Read" : "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openMessageModal(message)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{categoryEmoji[selectedMessage.category]}</span>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100">
                        {categoryLabels[selectedMessage.category]}
                      </span>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedMessage.isResolved
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {selectedMessage.isResolved ? "✓ Resolved" : "Pending"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMessage.subject}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600 text-3xl"
                  >
                    ×
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">From:</h3>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {selectedMessage.user.name || "Unknown User"}
                    </p>
                    <p className="text-gray-600">{selectedMessage.user.email}</p>
                    {selectedMessage.user.phone && (
                      <p className="text-gray-600">{selectedMessage.user.phone}</p>
                    )}
                    {selectedMessage.contactInfo && (
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Contact Info:</span> {selectedMessage.contactInfo}
                      </p>
                    )}
                    <p className="text-gray-500 mt-2">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Message:</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Notes:</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes or response..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleUpdateMessage(selectedMessage.id, {
                        adminNotes,
                        isResolved: true,
                      })
                    }
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Mark as Resolved"}
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateMessage(selectedMessage.id, {
                        adminNotes,
                      })
                    }
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Notes"}
                  </button>
                  {selectedMessage.isResolved && (
                    <button
                      onClick={() =>
                        handleUpdateMessage(selectedMessage.id, {
                          isResolved: false,
                        })
                      }
                      disabled={isUpdating}
                      className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
