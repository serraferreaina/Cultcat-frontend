import { authFetch } from './http';

export async function getUsers() {
  const res = await authFetch('http://nattech.fib.upc.edu:40490/users/');
  if (!res.ok) throw new Error('Error loading users');
  return res.json();
}
