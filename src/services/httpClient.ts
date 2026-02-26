/**
 * Unified HTTP client with automatic token refresh interceptor.
 * All API calls go through this client — no more duplicated 401 handling.
 */

const API_BASE = 'http://localhost:8000/api/';

type TokenStore = {
    getAccessToken: () => string | null;
    setAccessToken: (token: string | null) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string | null) => void;
    onAuthFailure: () => void;
};

let tokenStore: TokenStore = {
    getAccessToken: () => localStorage.getItem('access_token'),
    setAccessToken: (token) => {
        if (token) localStorage.setItem('access_token', token);
        else localStorage.removeItem('access_token');
    },
    getRefreshToken: () => localStorage.getItem('refresh_token'),
    setRefreshToken: (token) => {
        if (token) localStorage.setItem('refresh_token', token);
        else localStorage.removeItem('refresh_token');
    },
    onAuthFailure: () => {
        window.location.href = '/login';
    },
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function configureTokenStore(store: Partial<TokenStore>) {
    tokenStore = { ...tokenStore, ...store };
}

export function getAccessToken(): string | null {
    return tokenStore.getAccessToken();
}

async function refreshTokens(): Promise<boolean> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE}auth-service/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // sends httpOnly cookie
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        tokenStore.setAccessToken(data.access_token);
        tokenStore.setRefreshToken(data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

/**
 * Ensures only one refresh happens at a time. All concurrent 401s
 * wait for the same refresh promise.
 */
async function ensureTokenRefreshed(): Promise<boolean> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = refreshTokens().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
    });

    return refreshPromise;
}

function buildHeaders(customHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (customHeaders) {
        const entries = customHeaders instanceof Headers
            ? Array.from(customHeaders.entries())
            : Object.entries(customHeaders);
        for (const [key, value] of entries) {
            headers[key] = value as string;
        }
    }

    const token = tokenStore.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export interface RequestOptions extends Omit<RequestInit, 'headers'> {
    headers?: Record<string, string>;
    skipAuth?: boolean;
    raw?: boolean; // return Response instead of parsed JSON
}

/**
 * Core request function with automatic 401 retry.
 */
export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, raw, headers: customHeaders, ...fetchOptions } = options;

    const headers = skipAuth
        ? { 'Content-Type': 'application/json', ...customHeaders }
        : buildHeaders(customHeaders);

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    let response = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });

    // Auto-retry on 401
    if (response.status === 401 && !skipAuth) {
        const refreshed = await ensureTokenRefreshed();
        if (refreshed) {
            // Retry with new token
            const newHeaders = buildHeaders(customHeaders);
            response = await fetch(url, { ...fetchOptions, headers: newHeaders, credentials: 'include' });
        } else {
            tokenStore.setAccessToken(null);
            tokenStore.setRefreshToken(null);
            tokenStore.onAuthFailure();
            throw new Error('Unauthorized');
        }
    }

    if (raw) return response as unknown as T;

    if (!response.ok) {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { error: 'request_failed', message: `Status ${response.status}` };
        }
        throw errorData;
    }

    // Handle empty responses (204, etc.)
    const text = await response.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
}

/**
 * Fetch that returns raw Response (for blobs, streams, etc.)
 * Still handles 401 refresh automatically.
 */
export async function rawRequest(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    return request<Response>(endpoint, { ...options, raw: true });
}

export const httpClient = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),

    put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

    patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),

    raw: rawRequest,
};
