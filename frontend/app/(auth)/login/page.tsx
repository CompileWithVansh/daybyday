'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth.actions';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identifier, password);

    if (result.success) {
      router.push('/home');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-md mx-4 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-pink-900 mb-2">DayByDay</h1>
        <p className="text-pink-600">Welcome back 💕</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-pink-800 mb-1"
          >
            Email or Username
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input"
            placeholder="Enter your email or username"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-pink-800 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="bg-pink-50 border border-pink-200 text-pink-700 px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
