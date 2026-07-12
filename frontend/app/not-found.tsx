import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-pink-100">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-pink-900 mb-2">
          Page not found
        </h1>
        <p className="text-pink-700 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
