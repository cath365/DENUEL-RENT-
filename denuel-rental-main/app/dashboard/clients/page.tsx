"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Client {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  properties: number;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // For now, we'll show users who have applied to the agent's properties
      const response = await fetch("/api/dashboard/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
          <p className="text-gray-600 mt-2">
            Manage your tenant relationships and client contacts
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">🚧</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Client Management Coming Soon!
              </h2>
              <p className="text-gray-700 mb-4">
                We're building a comprehensive client management system where you can:
              </p>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Track all tenants and their rental history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Manage lease agreements and renewals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Store important client documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>View payment history and outstanding balances</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Send automated reminders and notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Rate and review tenant behavior</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600">
                In the meantime, you can manage your clients through the applications section.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/applications"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">View Applications</h3>
            <p className="text-sm text-gray-600">
              Review applications from potential tenants
            </p>
          </Link>

          <Link
            href="/dashboard/properties"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="font-semibold text-gray-900 mb-2">My Properties</h3>
            <p className="text-sm text-gray-600">
              Manage your rental properties and listings
            </p>
          </Link>

          <Link
            href="/inquiries"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">Messages</h3>
            <p className="text-sm text-gray-600">
              Chat with tenants and potential clients
            </p>
          </Link>
        </div>

        {/* Temporary Client List from Applications */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Contacts
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            People who have applied to or inquired about your properties
          </p>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-600 mb-4">No clients yet</p>
              <p className="text-sm text-gray-500">
                Clients will appear here when people apply to your properties
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {client.name || "Anonymous User"}
                      </h3>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      {client.phone && (
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {client.properties} {client.properties === 1 ? "property" : "properties"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Since {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
