/*
 * Landing spot for the redirect coming back from the API after Google sign-in.
 *
 * The page is split in two on purpose. The real work needs useSearchParams to
 * read ?token=..., and a Client Component that calls useSearchParams must sit
 * inside a <Suspense> boundary — during a production build a static page
 * without one fails to build, because the search params aren't known until the
 * request reaches the browser. So this outer page stays a Server Component
 * that renders the boundary, and AuthCallbackClient does the reading.
 */

import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-stone-400 text-sm">Signing you in…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
