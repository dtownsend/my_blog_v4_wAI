'use client';

import { RotateCw } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-8">
        Sorry, an unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        <RotateCw size={20} />
        Try again
      </button>
    </div>
  );
}
