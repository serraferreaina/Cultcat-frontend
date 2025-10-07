// app/index.tsx  ← a l’ARREL de app/
import { Redirect } from 'expo-router';
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
