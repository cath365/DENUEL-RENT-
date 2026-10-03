'use client';

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition"
    >
      Try Again
    </button>
  );
}
