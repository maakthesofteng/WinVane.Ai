import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { CSRF_HEADER_NAME } from '@/constants/app';
import { normalizeError } from './apiError';
import { authEvents } from './authEvents';
import { clearCsrfToken, fetchCsrfToken, getCachedCsrfToken } from './csrf';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  adapter: 'fetch',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface IExtendedAxiosConfig extends InternalAxiosRequestConfig {
  _isCsrfRetry?: boolean;
}

apiClient.interceptors.request.use(
  async (config: IExtendedAxiosConfig) => {
    const method = config.method?.toUpperCase();
    const isStateChanging = method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isSkipCsrf = config.headers?.['x-skip-csrf-interceptor'] === 'true';

    if (isStateChanging && !isSkipCsrf) {
      const token = getCachedCsrfToken() ?? (await fetchCsrfToken(apiClient));
      if (token) {
        config.headers.set(CSRF_HEADER_NAME, token);
      }
    }

    if (config.headers?.['x-skip-csrf-interceptor']) {
      delete config.headers['x-skip-csrf-interceptor'];
    }

    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as IExtendedAxiosConfig | undefined;

    // Retry once if CSRF token was invalid/expired (403 with CSRF message)
    if (
      error.response?.status === 403 &&
      config &&
      !config._isCsrfRetry &&
      JSON.stringify(error.response?.data).toLowerCase().includes('csrf')
    ) {
      config._isCsrfRetry = true;
      clearCsrfToken();
      const newToken = await fetchCsrfToken(apiClient);
      config.headers.set(CSRF_HEADER_NAME, newToken);
      return apiClient(config);
    }

    // 401 Unauthorized handling (skip login endpoints to avoid emitting session logout on wrong credentials)
    const isAuthEndpoint = Boolean(config?.url?.includes('/login') || config?.url?.includes('/logout'));
    if (error.response?.status === 401 && !isAuthEndpoint && !authEvents.getIsLoggingOut()) {
      authEvents.emitUnauthorized();
    }

    return Promise.reject(normalizeError(error));
  }
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, body, config);
  return response.data;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, body, config);
  return response.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
