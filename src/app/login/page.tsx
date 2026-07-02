'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const defaultUrl = process.env.NODE_ENV === 'production' ? 'https://neurocollab-1.onrender.com' : 'http://localhost:8000';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
      const res = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      setAuth(data.access_token, username);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <div className="w-full max-w-md bg-surface-1 border border-border-default rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
            <Zap className="text-accent" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to NeuroCollab</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-surface-0 border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-0 border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium py-2.5 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-text-tertiary mt-8">
          Don't have an account?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
