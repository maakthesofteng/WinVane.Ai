import type { AxiosInstance } from 'axios';

let cachedToken: string | null = null;
let inFlightPromise: Promise<string> | null = null;

export function getCachedCsrfToken(): string | null {
  return cachedToken;
}

export function clearCsrfToken(): void {
  cachedToken = null;
  inFlightPromise = null;
}

export async function fetchCsrfToken(client: AxiosInstance): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = client
    .get<{ csrfToken: string }>('/security/csrf-token', {
      // Do not run the CSRF request interceptor on the token fetch itself
      headers: {
        'x-skip-csrf-interceptor': 'true',
      },
    })
    .then((response) => {
      cachedToken = response.data.csrfToken;
      inFlightPromise = null;
      return cachedToken;
    })
    .catch((error) => {
      inFlightPromise = null;
      throw error;
    });

  return inFlightPromise;
}

