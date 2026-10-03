"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lusaka Central', avgRent: 8000 },
  { name: 'Roma', avgRent: 6000 },
  { name: 'Kabulonga', avgRent: 12000 },
  { name: 'Chilenje', avgRent: 5000 },
];

export default function Research() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Market Research</h1>
      <p className="mb-4">Insights into rental markets, trends, and data.</p>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Average Rents by Neighborhood</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`K${value}`, 'Avg Rent']} />
              <Bar dataKey="avgRent" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Rental Trends</h2>
          <p>Average rent in Lusaka: K5,000 - K10,000 per month</p>
          <p>Pet-friendly properties: 30% of listings</p>
          <p>Properties with parking: 60% of listings</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Neighborhood Insights</h2>
          <p>Lusaka Central: High demand, average K8,000</p>
          <p>Roma: Family-friendly, average K6,000</p>
          <p>Kabulonga: Upscale, average K12,000</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Market Forecast</h2>
          <p>Rents expected to rise 5-10% in next year</p>
          <p>Increased demand for furnished properties</p>
        </div>
      </div>
    </div>
  );
}