'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ExpensesPage() {
  const [data, setData] = useState<any>({ expenses: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/expenses');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/expenses';
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || 'Unable to load property expenses.');
      }

      setData({
        expenses: Array.isArray(json.expenses) ? json.expenses : [],
        summary: json.summary || {},
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load property expenses.'
      );
      setData({ expenses: [], summary: {} });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const expenses = data.expenses || [];
  const categories = Object.entries(data.summary?.byCategory || {})
    .sort((a: any, b: any) => Number(b[1]) - Number(a[1]));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return expenses.filter((expense: any) => {
      if (categoryFilter !== 'ALL' && expense.category !== categoryFilter) return false;
      if (!needle) return true;

      return [
        expense.description,
        expense.property?.title,
        expense.category,
        expense.vendor,
      ].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [expenses, query, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/landlord" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Operating costs</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Property expenses
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Recorded property costs only. Ng&apos;anda does not generate projected or estimated expenses here.
            </p>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2">
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Recorded expenses</div>
            <div className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
              {loading ? '—' : money(data.summary?.total || 0)}
            </div>
          </div>
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Expense entries</div>
            <div className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
              {loading ? '—' : Number(data.summary?.count || 0).toLocaleString()}
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mt-6 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map(([category, total]: any) => (
              <div key={category} className="border-b border-r border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">{category}</div>
                <div className="mt-1 text-lg font-bold text-slate-950">{money(total)}</div>
              </div>
            ))}
          </section>
        )}

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search description, property or vendor"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All categories</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="TAXES">Taxes</option>
            <option value="INSURANCE">Insurance</option>
            <option value="UTILITIES">Utilities</option>
            <option value="MORTGAGE">Mortgage</option>
            <option value="HOA">HOA / service fees</option>
            <option value="OTHER">Other</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <div className="font-semibold text-red-800">Expense records unavailable</div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button onClick={load} className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : expenses.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No expenses recorded yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              This page stays empty until a real property expense is recorded.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No expense matches the current filters.
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Expense</th>
                  <th className="px-5 py-3 font-semibold">Property</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((expense: any) => (
                  <tr key={expense.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{expense.description}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {[expense.category, expense.vendor].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{expense.property?.title || 'Property'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(expense.date)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-950">{money(expense.amount)}</td>
                    <td className="px-5 py-4">
                      {expense.receiptUrl ? (
                        <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#16A34A]">
                          Open receipt
                        </a>
                      ) : (
                        <span className="text-slate-400">Not attached</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
