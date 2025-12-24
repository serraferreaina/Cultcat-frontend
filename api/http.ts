import { getAccessToken } from './auth';

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  console.log('AUTH FETCH TOKEN:', token);

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}
