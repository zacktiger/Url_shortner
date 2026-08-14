'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

/*
 * The last step of the OAuth round trip. The user arrives here from the API,
 * not from a link inside the app, carrying either ?token=<jwt> (success) or
 * ?error=... (they denied consent, or Google rejected the request).
 *
 * This page renders nothing but a spinner: its whole job is to hand the token
 * to AuthContext, which stores it, loads the profile, and pushes to the
 * dashboard. It's a visible URL for a fraction of a second.
 */
export default function AuthCallbackClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Back to the landing page with a flag, rather than stranding the user
      // on a blank spinner that never resolves.
      router.replace('/?auth_error=true');
      return;
    }

    if (token) {
      // login() handles storage + profile fetch + the redirect to /dashboard.
      login(token);
    } else {
      // Somebody opened /auth/callback directly with no params — nothing to do.
      router.replace('/');
    }
    // `replace` rather than `push` in both branches, so the back button skips
    // this throwaway page instead of bouncing the user through it again.
  }, [login, router, searchParams]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
      <p className="text-stone-500 text-sm">Signing you in…</p>
    </div>
  );
}
