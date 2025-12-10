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

  const data = await res.json();

  if (!res.ok || !data.access) {
    console.log('❌ Refresh token invalid or expired');
    return null;
  }

  // Guarda els nous tokens
  await AsyncStorage.setItem('authToken', data.access);

  if (data.refresh) {
    await AsyncStorage.setItem('refreshToken', data.refresh);
  }

  console.log('🔄 Access token refreshed');

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

  // 🔥 Access token caducat → 401
  if (res.status === 401) {
    console.log('⚠️ Access token expired, trying refresh…');

    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Unauthorized'); // logout natural
    }

    // 🔁 Tornem a fer la crida amb el token nou
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
    console.log('API ERROR:', res.status, await res.text());
    throw new Error('API error');
  }

  return res.json();
}

export function getProfile() {
  return api('/profile/');
}
