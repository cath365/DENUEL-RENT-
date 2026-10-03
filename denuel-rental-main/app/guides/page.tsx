'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Guide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt?: string;
  content: string;
  published: boolean;
  readTimeMinutes?: number;
  createdAt: string;
}

interface Checklist {
  id: string;
  title: string;
  category: string;
  items: string[];
}

interface UserProgress {
  checklistId: string;
  completedItems: string[];
  progress: number;
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null);

  const categories = [
    { id: 'all', name: 'All Guides', icon: '📚' },
    { id: 'BUYING', name: 'Home Buying', icon: '🏠' },
    { id: 'SELLING', name: 'Selling', icon: '💰' },
    { id: 'RENTING', name: 'Renting', icon: '🔑' },
    { id: 'MOVING', name: 'Moving', icon: '📦' },
    { id: 'FINANCING', name: 'Financing', icon: '🏦' },
    { id: 'MAINTENANCE', name: 'Home Care', icon: '🔧' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [guidesRes, checklistsRes, progressRes] = await Promise.all([
        fetch('/api/guides'),
        fetch('/api/guides/checklists'),
        fetch('/api/guides/checklists/progress'),
      ]);

      if (guidesRes.ok) {
        const data = await guidesRes.json();
        setGuides(data.guides || []);
      }

      if (checklistsRes.ok) {
        const data = await checklistsRes.json();
        setChecklists(data.checklists || []);
      }

      if (progressRes.ok) {
        const data = await progressRes.json();
        setUserProgress(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = async (checklistId: string, item: string) => {
    const currentProgress = userProgress.find((p) => p.checklistId === checklistId);
    const completedItems = currentProgress?.completedItems || [];
    const newCompleted = completedItems.includes(item)
      ? completedItems.filter((i) => i !== item)
      : [...completedItems, item];

    try {
      await fetch('/api/guides/checklists/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistId,
          completedItems: newCompleted,
        }),
      });

      setUserProgress((prev) => {
        const existing = prev.find((p) => p.checklistId === checklistId);
        if (existing) {
          return prev.map((p) =>
            p.checklistId === checklistId
              ? { ...p, completedItems: newCompleted }
              : p
          );
        }
        return [...prev, { checklistId, completedItems: newCompleted, progress: 0 }];
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getChecklistProgress = (checklist: Checklist) => {
    const progress = userProgress.find((p) => p.checklistId === checklist.id);
    const completed = progress?.completedItems?.length || 0;
    return Math.round((completed / checklist.items.length) * 100);
  };

  const filteredGuides =
    activeCategory === 'all'
      ? guides
      : guides.filter((g) => g.category === activeCategory);

  const filteredChecklists =
    activeCategory === 'all'
      ? checklists
      : checklists.filter((c) => c.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold">Home Guides & Resources</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Home Guides & Resources</h1>
          <p className="mt-2 text-teal-100 max-w-2xl">
            Everything you need to know about buying, selling, renting, and maintaining your home.
            Plus interactive checklists to keep you on track.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Checklists */}
        {filteredChecklists.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Interactive Checklists
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChecklists.map((checklist) => {
                const progress = getChecklistProgress(checklist);
                return (
                  <div
                    key={checklist.id}
                    onClick={() => setActiveChecklist(checklist)}
                    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{checklist.title}</h3>
                      <span className="text-sm text-gray-600">
                        {checklist.items.length} items
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-teal-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {progress}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Guides */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Guides & Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
              >
                <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                  <span className="text-5xl">
                    {categories.find((c) => c.id === guide.category)?.icon || '📄'}
                  </span>
                </div>
                <div className="p-6">
                  <span className="text-xs text-teal-600 font-medium">
                    {categories.find((c) => c.id === guide.category)?.name}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1">{guide.title}</h3>
                  {guide.excerpt && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {guide.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    {guide.readTimeMinutes && (
                      <span>{guide.readTimeMinutes} min read</span>
                    )}
                    <span>Read more →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredGuides.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              No guides found in this category.
            </p>
          )}
        </div>

        {/* Quick Resources */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Resources</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/mortgage-calculator"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl">🧮</span>
              <div>
                <p className="font-medium text-gray-900">Mortgage Calculator</p>
                <p className="text-xs text-gray-600">Calculate payments</p>
              </div>
            </Link>
            <Link
              href="/market"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">Market Trends</p>
                <p className="text-xs text-gray-600">View analytics</p>
              </div>
            </Link>
            <Link
              href="/compare"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl">⚖️</span>
              <div>
                <p className="font-medium text-gray-900">Compare Properties</p>
                <p className="text-xs text-gray-600">Side by side</p>
              </div>
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl">🔧</span>
              <div>
                <p className="font-medium text-gray-900">Home Services</p>
                <p className="text-xs text-gray-600">Find providers</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-teal-600">
                  {categories.find((c) => c.id === selectedGuide.category)?.name}
                </span>
                <h2 className="text-xl font-bold text-gray-900">{selectedGuide.title}</h2>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedGuide.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {activeChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{activeChecklist.title}</h2>
              <button
                onClick={() => setActiveChecklist(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-teal-500 transition-all"
                    style={{ width: `${getChecklistProgress(activeChecklist)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {userProgress.find((p) => p.checklistId === activeChecklist.id)?.completedItems?.length || 0} of{' '}
                  {activeChecklist.items.length} complete
                </p>
              </div>
              <div className="space-y-2">
                {activeChecklist.items.map((item, index) => {
                  const progress = userProgress.find((p) => p.checklistId === activeChecklist.id);
                  const isChecked = progress?.completedItems?.includes(item) || false;
                  return (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        isChecked ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecklistItem(activeChecklist.id, item)}
                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className={isChecked ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
