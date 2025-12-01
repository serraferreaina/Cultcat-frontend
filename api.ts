export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`http://nattech.fib.upc.edu:40490${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${global.authToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    console.log('API ERROR:', res.status, await res.text());
    throw new Error('API error');
  }

  return res.json();
}

export function getProfile() {
  return api('/profile/');
}
