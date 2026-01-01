// api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://nattech.fib.upc.edu:40490';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Logout dur: neteja tokens
 */
export async function logout() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, 'isLoggedIn']);
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      await logout();
      return null;
    }

    const data = await res.json();

    if (!data.access) {
      await logout();
      return null;
    }

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access);
    return data.access;
  } catch (error) {
    await logout();
    return null;
  }
}

/**
 * API wrapper amb Bearer + refresh automàtic
 */
export async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    return Promise.reject({ silent: true });
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Si token caducat → intentem refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      throw new Error('Unauthorized');
    }

    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API Error');
  }

  return response.json();
}

/**
 * Helpers d’API (exemples)
 */

export const getProfile = () => api('/profile/');

export const getSavedEvents = async (state?: 'attended' | 'wishlist' | 'wantToGo') => {
  const query = state ? `?state=${state}` : '';
  return api(`/saved-events/${query}`);
};

export const getUserProfile = (id: number) => api(`/users/${id}/`);

export const getEvents = () => api('/events/');

export const getEventById = (id: number) => api(`/events/${id}/`);

export const deleteAccount = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) throw new Error('No auth token');

  const response = await fetch('http://nattech.fib.upc.edu:40490/profile/delete/', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete account');
  }

  // Clear auth token after successful deletion
  await AsyncStorage.removeItem('authToken');
  global.currentUser = null;
};

export const getUserBadges = () => api('/rewards/');

export function sendConnectionRequest(userId: string) {
  return api('/connection/send/', {
    method: 'POST',
    body: JSON.stringify({ to_user_id: userId }),
  });
}
