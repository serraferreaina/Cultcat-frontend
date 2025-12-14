import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://nattech.fib.upc.edu:40490';

async function refreshAccessToken() {
  const refresh = await AsyncStorage.getItem('refreshToken');
  if (!refresh) return null;

  const res = await fetch(`${API_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  if (!data.access) {
    return null;
  }

  await AsyncStorage.setItem('authToken', data.access);

  if (data.refresh) {
    await AsyncStorage.setItem('refreshToken', data.refresh);
  }

  return data.access;
}

export async function api(path: string, options: RequestInit = {}) {
  let token = await AsyncStorage.getItem('authToken');

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Unauthorized');
    }

    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export function getProfile() {
  return api('/profile/');
}
