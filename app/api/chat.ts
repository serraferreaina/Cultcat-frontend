import { authFetch } from './http';

export async function getChatMessages(chatId: number) {
  const res = await authFetch(`http://nattech.fib.upc.edu:40490/chat/${chatId}/messages/`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }

  return res.json();
}

export async function sendChatMessage(chatId: number, content: string) {
  const res = await authFetch('http://nattech.fib.upc.edu:40490/send-message/', {
    method: 'POST',
    body: JSON.stringify({
      chat: chatId,
      content,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }

  return res.json();
}
