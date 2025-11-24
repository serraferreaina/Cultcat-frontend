import React, { useEffect } from 'react';

declare global {
  // Declarem una variable global typesafe
  // perquè TS no es queixi quan fem global.authToken
  // Pots afegir-hi més dades si vols (rol, email...)
  var authToken: string | undefined;
}

interface Props {
  children: React.ReactNode;
}

export default function DevAuthWrapper({ children }: Props) {
  const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN;

  useEffect(() => {
    if (__DEV__ && DEV_TOKEN) {
      global.authToken = DEV_TOKEN;
      console.log('DEV TOKEN LOADED:', global.authToken);
    } else {
      console.log('NO DEV TOKEN FOUND');
    }
  }, []);

  return <>{children}</>;
}
