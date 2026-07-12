'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-pink-100">
        <div className="text-5xl mb-4">💔</div>
        <h1 className="text-2xl font-bold text-pink-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-pink-700 mb-6">
          An unexpected error occurred. Please try again or go back to the home
          page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-white text-pink-600 border border-pink-300 rounded-lg font-medium hover:bg-pink-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
