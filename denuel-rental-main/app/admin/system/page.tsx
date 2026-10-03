"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface SystemStatus {
  status: string;
  uptime: number;
  version: string;
  database: {
    status: string;
    latency: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  stats: {
    users: number;
    properties: number;
    bookings: number;
    messages: number;
  };
}

export default function SystemStatusPage() {
  const [systemInfo, setSystemInfo] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("/api/admin/system");
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch system status:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${systemInfo?.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Checking...' : systemInfo?.status === 'healthy' ? 'System Healthy' : 'System Issues'}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600 mt-2">
            Monitor platform health and performance metrics
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading system status...</p>
          </div>
        ) : (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Server Status</p>
                    <p className="text-2xl font-bold text-green-600">
                      {systemInfo?.status === 'healthy' ? '✓ Online' : '✗ Offline'}
                    </p>
                  </div>
                  <div className="text-4xl">🟢</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-xl font-bold text-gray-900">
                      {systemInfo?.uptime ? formatUptime(systemInfo.uptime) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-4xl">⏱️</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="text-xl font-bold text-green-600">
                      {systemInfo?.database.status === 'connected' ? '✓ Connected' : '✗ Disconnected'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {systemInfo?.database.latency}ms latency
                    </p>
                  </div>
                  <div className="text-4xl">🗄️</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="text-xl font-bold text-blue-600">
                      {systemInfo?.memory.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {systemInfo && formatBytes(systemInfo.memory.used)} / {systemInfo && formatBytes(systemInfo.memory.total)}
                    </p>
                  </div>
                  <div className="text-4xl">💾</div>
                </div>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-2xl font-bold text-gray-900">{systemInfo?.stats.users.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🏠</div>
                  <p className="text-2xl font-bold text-gray-900">{systemInfo?.stats.properties.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Properties</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-2xl font-bold text-gray-900">{systemInfo?.stats.bookings.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Bookings</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-2xl font-bold text-gray-900">{systemInfo?.stats.messages.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Messages</p>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Version:</span>
                    <span className="font-medium">{systemInfo?.version || '1.0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Environment:</span>
                    <span className="font-medium">Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node Version:</span>
                    <span className="font-medium">{process.version || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timezone:</span>
                    <span className="font-medium">Africa/Lusaka (CAT)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Database:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ✓ Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">File Storage:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ✓ Local Storage
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email Service:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      ⚠ Not Configured
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SMS Service:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      ⚠ Not Configured
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl">⚙️</div>
                  <div>
                    <p className="font-medium text-gray-900">System Settings</p>
                    <p className="text-xs text-gray-500">Configure platform settings</p>
                  </div>
                </Link>
                <Link
                  href="/admin/activity"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl">📝</div>
                  <div>
                    <p className="font-medium text-gray-900">Activity Log</p>
                    <p className="text-xs text-gray-500">View system activities</p>
                  </div>
                </Link>
                <button
                  onClick={() => fetchSystemStatus()}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl">🔄</div>
                  <div>
                    <p className="font-medium text-gray-900">Refresh Status</p>
                    <p className="text-xs text-gray-500">Update system metrics</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 System Monitoring</h3>
              <p className="text-sm text-gray-700 mb-3">
                This page provides real-time monitoring of your platform's health and performance.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Auto-refresh:</strong> Metrics update every 30 seconds</li>
                <li>• <strong>Database:</strong> Shows connection status and query latency</li>
                <li>• <strong>Memory:</strong> Tracks server memory usage to prevent issues</li>
                <li>• <strong>Services:</strong> Monitor critical integrations and dependencies</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
