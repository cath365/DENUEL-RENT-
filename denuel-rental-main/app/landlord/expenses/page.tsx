'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

function money(value: number) {
  return 'K' + Number(value || 0).toLocaleString();
}

function humanize(value?: string | null) {
  if (!value) return 'Other';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ExpensesPage() {
  const [data, setData] = useState<any>({ expenses: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('ALL');
  const [propertyId, setPropertyId] = useState('ALL');

  async function loadExpenses() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/expenses', { credentials: 'same-origin' });
      const text = await res.text();
      let payload: any = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/expenses&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(payload?.error || text || 'Unable to load property expenses.');
      }

      setData({
        expenses: Array.isArray(payload.expenses) ? payload.expenses : [],
        summary: payload.summary || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load property expenses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const categories = useMemo(() => {
    return [...new Set((data.expenses || []).map((expense: any) => expense.category).filter(Boolean))].sort();
  }, [data.expenses]);

  const properties = useMemo(() => {
    const unique = new Map<string, string>();
    for (const expense of data.expenses || []) {
      if (expense.property?.id) {
        unique.set(expense.property.id, expense.property.title || 'Property');
      }
    }
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data.expenses]);

  const visibleExpenses = useMemo(() => {
    return (data.expenses || []).filter((expense: any) => {
      if (category !== 'ALL' && expense.category !== category) return false;
      if (propertyId !== 'ALL' && expense.property?.id !== propertyId) return false;
      return true;
    });
  }, [category, data.expenses, propertyId]);

  const visibleTotal = visibleExpenses.reduce(
    (sum: number, expense: any) => sum + Number(expense.amount || 0),
    0,
  );

  const largestCategory = useMemo(() => {
    const entries = Object.entries(data.summary?.byCategory || {}) as [string, number][];
    return entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0] || null;
  }, [data.summary]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <Link href="/landlord" className="text-sm font-semibold text-blue-700">← Landlord dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Property expenses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review maintenance, utilities and other operating costs that have actually been recorded against your properties.
          </p>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Expenses could not be loaded</h2>
            <p className="mt-2 text-sm text-red-800">{error}</p>
            <button
              type="button"
              onClick={loadExpenses}
              className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
            >
              Try again
            </button>
          </section>
        )}

        <section className="mt-8 grid border-l border-t border-slate-200 bg-white sm:grid-cols-3">
          <div className="border-b border-r border-slate-200 p-5">
            <div className="text-sm text-slate-500">Recorded expenses</div>
            <div className="mt-2 text-2xl font-bold">
              {loading ? '—' : money(Number(data.summary?.total || 0))}
            </div>
          </div>
          <div className="border-b border-r border-slate-200 p-5">
            <div className="text-sm text-slate-500">Expense entries</div>
            <div className="mt-2 text-2xl font-bold">
              {loading ? '—' : Number(data.summary?.count || 0).toLocaleString()}
            </div>
          </div>
          <div className="border-b border-r border-slate-200 p-5">
            <div className="text-sm text-slate-500">Largest recorded category</div>
            <div className="mt-2 text-lg font-bold">
              {loading
                ? '—'
                : largestCategory
                  ? humanize(largestCategory[0]) + ' · ' + money(Number(largestCategory[1]))
                  : 'No data'}
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <label className="flex-1 text-sm font-medium text-slate-700">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>{humanize(value)}</option>
              ))}
            </select>
          </label>

          <label className="flex-1 text-sm font-medium text-slate-700">
            Property
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">All properties</option>
              {properties.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>

          <div className="sm:self-end">
            <div className="h-11 border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
              Filtered total: <strong>{money(visibleTotal)}</strong>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Expense history</h2>
            <p className="mt-1 text-xs text-slate-500">
              Only recorded expense entries are shown. Missing costs are not estimated.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : visibleExpenses.length ? (
            <div className="divide-y divide-slate-100">
              {visibleExpenses.map((expense: any) => (
                <article key={expense.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_160px_140px] md:items-center">
                  <div className="min-w-0">
                    <div className="font-semibold">{expense.description}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span>{expense.property?.title || 'Property not recorded'}</span>
                      <span>{humanize(expense.category)}</span>
                      {expense.vendor && <span>Vendor: {expense.vendor}</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Date</div>
                    <div className="mt-1 text-sm font-medium">
                      {expense.date ? new Date(expense.date).toLocaleDateString('en-ZM') : 'Not recorded'}
                    </div>
                    {expense.isRecurring && (
                      <div className="mt-1 text-xs text-slate-500">
                        Recurring{expense.recurringFrequency ? ' · ' + humanize(expense.recurringFrequency) : ''}
                      </div>
                    )}
                  </div>

                  <div className="md:text-right">
                    <div className="text-lg font-bold">{money(expense.amount)}</div>
                    {expense.receiptUrl && (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs font-semibold text-blue-700"
                      >
                        View receipt
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold">
                {(data.expenses || []).length ? 'No expenses match these filters' : 'No expenses recorded yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {(data.expenses || []).length
                  ? 'Change the category or property filter to see other recorded expenses.'
                  : 'Expense entries will appear here when costs are recorded against your properties.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
