/**
 * API client for Health Companion backend.
 * Expects Firebase ID token in Authorization header for protected routes.
 */

import { API_BASE_URL, PRODUCTION_API_BASE_URL } from '../constants';

const getBaseUrl = (): string => {
  const base = typeof __DEV__ !== 'undefined' && !__DEV__ ? PRODUCTION_API_BASE_URL : API_BASE_URL;
  return base.replace(/\/$/, '');
};

const DEFAULT_TIMEOUT_MS = 20000;

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: object;
    token?: string | null;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s - is the backend running at ${url}?`);
    }
    throw err;
  }
  clearTimeout(timeoutId);
  if (!res!.ok) {
    const text = await res.text();
    let message = text;
    try {
      const j = JSON.parse(text);
      message = j.message || j.error || text;
    } catch {
      // use text as message
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return undefined as unknown as T;
}

export interface BackendUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  fitnessLevel: string | null;
  goals: string[] | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export async function getMe(token: string): Promise<BackendUser> {
  return apiRequest<BackendUser>('/users/me', { method: 'GET', token, timeoutMs: 25000 });
}

export async function updateMe(
  token: string,
  data: Partial<Pick<BackendUser, 'displayName' | 'photoUrl' | 'dateOfBirth' | 'gender' | 'height' | 'weight' | 'fitnessLevel' | 'goals'>>,
): Promise<BackendUser> {
  return apiRequest<BackendUser>('/users/me', { method: 'PATCH', body: data, token });
}
