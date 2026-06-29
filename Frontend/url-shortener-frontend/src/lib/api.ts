const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errMessage = 'Something went wrong';
        try {
            const data = await response.json();
            errMessage = data.message || errMessage;
        } catch {
            // ignore
        }
        throw new Error(errMessage);
    }

    if (response.headers.get('Content-Type')?.includes('application/json')) {
        return await response.json();
    }
    return response;
}
