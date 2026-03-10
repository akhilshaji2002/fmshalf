import axios from 'axios';

const sanitizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');

const configuredOrigin = sanitizeOrigin(import.meta.env.VITE_API_URL);
export const API_ORIGIN = configuredOrigin || 'http://localhost:5000';
export const API_BASE = `${API_ORIGIN}/api`;
export const UPLOADS_BASE = `${API_ORIGIN}/uploads`;

const normalizeUrl = (url) => {
    if (!url) return url;
    const raw = String(url);
    if (raw.startsWith('http://localhost:5000')) {
        return raw.replace('http://localhost:5000', API_ORIGIN);
    }
    if (raw.startsWith('/api') || raw.startsWith('/uploads')) {
        return `${API_ORIGIN}${raw}`;
    }
    return raw;
};

// Patch fetch once so existing files work in hosted environments.
if (typeof window !== 'undefined' && !window.__FMS_FETCH_PATCHED__) {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
        if (typeof input === 'string') {
            return nativeFetch(normalizeUrl(input), init);
        }
        if (input instanceof Request) {
            const nextUrl = normalizeUrl(input.url);
            const nextReq = nextUrl !== input.url ? new Request(nextUrl, input) : input;
            return nativeFetch(nextReq, init);
        }
        return nativeFetch(input, init);
    };
    window.__FMS_FETCH_PATCHED__ = true;
}

axios.interceptors.request.use((config) => {
    if (config.url) {
        config.url = normalizeUrl(config.url);
    }
    return config;
});
