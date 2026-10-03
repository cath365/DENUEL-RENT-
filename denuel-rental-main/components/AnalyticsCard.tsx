"use client";
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsCard({ propertyId }: { propertyId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/analytics/property/${propertyId}/timeseries?days=30`);
      const json = await res.json();
      setData(json.data || []);
      setLoading(false);
    })();
  }, [propertyId]);

  if (loading) return <div className="p-4">Loading analytics...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Views (30d)</div>
        <div className="text-sm text-muted">Total {data.reduce((s, d) => s + d.count, 0)}</div>
      </div>
      <div style={{ width: '100%', height: 100 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: any) => [`${v}`, 'Views']} labelFormatter={(l: any) => l} />
            <Line type="monotone" dataKey="count" stroke="#2b6cb0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}