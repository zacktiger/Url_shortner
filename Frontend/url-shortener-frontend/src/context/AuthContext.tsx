"use client";

/*
 * Who is signed in, for the whole app.
 *
 * The full sign-in flow, end to end:
 *
 *   1. User clicks "Sign in with Google" (Navbar) → the browser leaves this app
 *      entirely for GET {API}/auth/google.
 *   2. The Express API hands off to Google via Passport; the user approves.
 *   3. Google redirects back to the API's /auth/google/callback. The API finds
 *      or creates the User row, signs a JWT (7-day expiry), and redirects to
 *      {FRONTEND}/auth/callback?token=<jwt>.
 *   4. That page calls login(token) below.
 *
 * The token is kept in localStorage, which is why it survives a refresh and a
 * closed tab: on mount we read it back and re-verify it against /auth/me
 * instead of trusting whatever is in storage. The trade-off worth being able
 * to state out loud — localStorage is readable by any script on the page, so
 * an XSS bug leaks the token; an httpOnly cookie would not be, but it needs
 * shared-origin or credentialed CORS setup, which this split deployment
 * (Vercel frontend, Render API) doesn't have.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

// Mirrors the fields /auth/me returns — deliberately no token or Google ID.
interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    // Starts true: on first paint we genuinely don't know yet whether there is
    // a session. Pages wait on this so a signed-in user never sees the
    // signed-out UI flash before the /auth/me round trip finishes.
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Runs once on mount — this is the "stay signed in across refreshes" step.
    // localStorage is read here rather than during render because it doesn't
    // exist on the server, and this component is pre-rendered there.
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
        } else {
            // No token at all: nothing to verify, so we're done deciding.
            setLoading(false);
        }
    }, []);

    /*
     * Trades a token for the user it belongs to.
     *
     * This is the only thing that proves the stored token is still good — an
     * expired or tampered JWT fails verification in the backend middleware,
     * fetchApi throws, and we log out. Note `authToken` isn't passed to
     * fetchApi: fetchApi reads the token from localStorage itself, and every
     * caller writes it there first.
     */
    async function fetchUserProfile(authToken: string) {
        try {
            const data = await fetchApi('/auth/me');
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                logout();
            }
        } catch (error) {
            // Usually a 401 from an expired token. Clearing it is the right
            // move — keeping a dead token would make every later request fail.
            console.error('Failed to load user profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }

    /*
     * Called by the OAuth callback page with the token the API put in the URL.
     * Storage first, so the fetchApi call inside fetchUserProfile picks the
     * token up; only then do we navigate, so the dashboard mounts with the
     * user already in context and doesn't have to load it again.
     */
    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setLoading(true);
        fetchUserProfile(newToken).then(() => {
            router.push('/dashboard');
        });
    };

    /*
     * Sign-out is entirely client-side: JWTs are stateless, so there is no
     * server session to destroy — dropping the token is what ends the session.
     * (The flip side, worth knowing: a stolen token stays valid until it
     * expires. Revoking early would need a denylist or short-lived tokens.)
     */
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/*
 * How every component reads the session. The throw isn't defensive noise: the
 * context defaults to undefined, so without it a component rendered outside
 * AuthProvider would silently see `user === undefined` and behave as if nobody
 * were signed in. This turns that into an obvious error at the point of use.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
