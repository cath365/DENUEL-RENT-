"use client";

import React, { useState } from 'react';

export default function RentersInsurance() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    propertyValue: '',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate quote
    const quote = Math.round(parseFloat(form.propertyValue) * 0.005);
    alert(`Your estimated annual premium: K${quote}. Contact insurance provider for details.`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Renters Insurance</h1>
      <p className="mb-4">Protect your belongings with affordable renters insurance. Get a free quote below.</p>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-md">
        <div className="mb-4">
          <label className="block">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block">Property Value (ZMW)</label>
          <input
            type="number"
            value={form.propertyValue}
            onChange={(e) => setForm({ ...form, propertyValue: e.target.value })}
            required
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            className="border p-2 w-full"
          />
        </div>
        <button type="submit" className="bg-green-500 text-white p-2 rounded w-full">
          Get Free Quote
        </button>
      </form>
    </div>
  );
}