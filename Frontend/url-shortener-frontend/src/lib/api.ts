/*
 * The single door between this frontend and the Express API.
 *
 * Every network call in the app goes through `fetchApi`, so the three things
 * that must happen on *every* request — attach the JWT, set the JSON content
 * type, turn a failed response into a thrown Error — are written once here
 * instead of being repeated in each component.
 *
 * Frontend and backend are separate origins (Vercel and Render in production),
 * so this is a plain cross-origin fetch: the API allows this origin via CORS,
 * and auth rides in the Authorization header rather than in a cookie.
 */

// Baked into the browser bundle at build time, not read at runtime — that is
// what the NEXT_PUBLIC_ prefix means. Changing it requires a rebuild.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    // localStorage only exists in the browser. The `typeof window` guard keeps
    // this from crashing if the module is ever evaluated during server render.
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Build on top of any headers the caller passed instead of replacing them.
    const headers = new Headers(options.headers);
    if (token) {
        // The backend's requireAuth middleware reads exactly this shape:
        // "Bearer <jwt>". It verifies the signature and puts the user on req.
        headers.set('Authorization', `Bearer ${token}`);
    }
    // FormData sets its own multipart boundary, so forcing JSON there would
    // corrupt the request. The `has` check lets a caller override the type.
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // fetch only rejects on network failure — a 404 or 500 still "succeeds".
    // Converting non-2xx into a thrown Error is what lets every caller use a
    // plain try/catch and show `err.message` in the UI.
    if (!response.ok) {
        let errMessage = 'Something went wrong';
        try {
            // The API sends errors as { success: false, message }, so prefer
            // its wording (e.g. "Alias already taken", rate-limit messages).
            const data = await response.json();
            errMessage = data.message || errMessage;
        } catch {
            // Body wasn't JSON (a proxy error page, an empty 502). Keep the
            // generic message rather than masking the real failure with a
            // parse error.
        }
        throw new Error(errMessage);
    }

    // Most endpoints return JSON, so unwrap it for the caller. The QR endpoint
    // can return a PNG, so anything non-JSON is handed back as a raw Response.
    if (response.headers.get('Content-Type')?.includes('application/json')) {
        return await response.json();
    }
    return response;
}
