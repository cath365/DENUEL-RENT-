"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
  timestamp: string;
  metadata?: any;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/activity?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, string> = {
      "user.created": "👤",
      "user.updated": "✏️",
      "user.deleted": "❌",
      "property.created": "🏠",
      "property.updated": "✏️",
      "property.approved": "✅",
      "property.rejected": "❌",
      "property.deleted": "🗑️",
      "testimonial.approved": "⭐",
      "testimonial.rejected": "❌",
      "verification.approved": "✅",
      "verification.rejected": "❌",
      "support.message": "💬",
      "login": "🔐",
      "logout": "🚪",
      "settings.updated": "⚙️",
    };
    return iconMap[action] || "📝";
  };

  const getActionColor = (action: string) => {
    if (action.includes("approved") || action.includes("created")) return "text-green-600";
    if (action.includes("rejected") || action.includes("deleted")) return "text-red-600";
    if (action.includes("updated")) return "text-blue-600";
    return "text-gray-600";
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
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">
            Monitor all platform activities and user actions
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">🚧</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Activity Logging System Coming Soon!
              </h2>
              <p className="text-gray-700 mb-4">
                We're building a comprehensive activity monitoring system:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">📊 Activity Tracking</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Real-time user action logging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Property create/update/delete tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Admin action audit trail</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Login/logout activity monitoring</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">🔍 Advanced Features</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Filter by user, action type, date range</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Export activity reports (CSV/PDF)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Suspicious activity alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>IP address and device tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-300">
                <p className="text-sm font-semibold text-gray-900 mb-1">💡 Why Activity Logging?</p>
                <p className="text-sm text-gray-700">
                  Track all platform activities for security audits, compliance, and troubleshooting. 
                  Monitor user behavior, detect fraud, and maintain transparency in all operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "users", "properties", "approvals", "login"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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

        {/* Activity Timeline Preview */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-4">Activity logging not yet implemented</p>
              <p className="text-sm text-gray-500">
                This feature will automatically track all platform activities once deployed
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 Activity Types</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-medium mb-2">User Activities:</p>
              <ul className="space-y-1">
                <li>• User registration and profile updates</li>
                <li>• Login and logout events</li>
                <li>• Password changes and security updates</li>
                <li>• Email verification and phone verification</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Content Activities:</p>
              <ul className="space-y-1">
                <li>• Property listings (create, update, delete)</li>
                <li>• Image uploads and modifications</li>
                <li>• Property approvals and rejections</li>
                <li>• Testimonial and review management</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Admin Activities:</p>
              <ul className="space-y-1">
                <li>• User role changes and permissions</li>
                <li>• Content moderation decisions</li>
                <li>• System settings modifications</li>
                <li>• Support ticket responses</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Security Events:</p>
              <ul className="space-y-1">
                <li>• Failed login attempts</li>
                <li>• Suspicious activity detection</li>
                <li>• API rate limit violations</li>
                <li>• Account lockouts and unlocks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
