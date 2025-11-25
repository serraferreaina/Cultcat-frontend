import React, { useEffect } from 'react';

declare global {
  var currentUser: {
    id: number;
    username: string;
    profile_picture: string | null;
  } | null;
}

export default function UserLoader({ children }: { children: React.ReactNode }) {
  const token = global.authToken;

  useEffect(() => {
    const loadUser = async () => {
      if (!global.authToken) {
        console.log('Token not ready yet, waiting...');
        setTimeout(loadUser, 100);
        return;
      }

      try {
        console.log('Token ready → loading user...');
        const res = await fetch('http://nattech.fib.upc.edu:40490/profile/', {
          headers: {
            Authorization: `Token ${global.authToken}`,
          },
        });

        const data = await res.json();
        console.log('PROFILE RAW:', data);

        global.currentUser = {
          id: data.id,
          username: data.username,
          profile_picture: data.profile_picture ?? data.profilePic ?? null,
        };

        console.log('USER LOADED:', global.currentUser);
      } catch (e) {
        console.warn('Could not load current user:', e);
      }
    };

    loadUser();
  }, []);

  return <>{children}</>;
}
