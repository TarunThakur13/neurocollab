'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Zap } from 'lucide-react';

const publicPaths = ['/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token && !publicPaths.includes(pathname)) {
      router.push('/login');
    } else if (token && publicPaths.includes(pathname)) {
      router.push('/');
    } else if (token) {
      useChatStore.getState().fetchHistory();
    }
  }, [token, pathname, router]);

  // Prevent hydration mismatch and hide protected content before check
  if (!isMounted) return null;

  if (!token && !publicPaths.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center animate-pulse">
          <Zap className="text-accent" size={24} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
