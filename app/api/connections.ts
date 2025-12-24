import { authFetch } from './http';

export async function getConnections() {
  const res = await authFetch('http://nattech.fib.upc.edu:40490/connections/');

  if (!res.ok) {
    throw new Error('Error loading connections');
  }

  return res.json();
}
