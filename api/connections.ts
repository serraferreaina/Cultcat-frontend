import { api } from '../api';

export async function getConnections() {
  return api('/connections/');
}

export async function checkIfConnected(userId: string) {
  try {
    const connections = await getConnections();
    return connections.some((conn: any) => conn.user_id === parseInt(userId));
  } catch (error) {
    return false;
  }
}
