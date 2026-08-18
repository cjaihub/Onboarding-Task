'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';

const PUBLIC_ROUTES = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublic, router]);

  // While checking session, show a full-screen loader
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--surface-base)' }}
      >
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
        >
          <Shield className="h-7 w-7 text-white" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Authenticating…
        </p>
      </div>
    );
  }

  // Public route — always render (login page)
  if (isPublic) return <>{children}</>;

  // Protected route — only render once authenticated
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
