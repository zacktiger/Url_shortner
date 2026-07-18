'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.replace('/?auth_error=true');
      return;
    }

    if (token) {
      login(token);
    } else {
      router.replace('/');
    }
  }, [login, router, searchParams]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
      <p className="text-stone-500 text-sm">Signing you in…</p>
    </div>
  );
}
