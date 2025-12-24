import { authFetch } from './http';

export async function getGroupChats() {
  const res = await authFetch('http://nattech.fib.upc.edu:40490/chats/');
  if (!res.ok) throw new Error('Error loading group chats');
  return res.json();
}

export async function createGroup(name: string, participantIds: number[]) {
  const res = await authFetch('http://nattech.fib.upc.edu:40490/chats/create-group/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      participant_ids: participantIds,
    }),
  });

  if (!res.ok) throw new Error('Error creating group');
  return res.json();
}
