import React, { useEffect } from 'react';

declare global {
  var currentUser: {
    id: number;
    username: string;
    profile_picture: string | null;
    profile_description: string;
  } | null;
}

export default function UserLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadUser = async () => {
      if (!global.authToken) {
        setTimeout(loadUser, 100);
        return;
      }

      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/profile/', {
          headers: {
            Authorization: `Token ${global.authToken}`,
          },
        });

        const data = await res.json();

        global.currentUser = {
          id: data.id,
          username: data.username,
          profile_description: data.bio,
          profile_picture: data.profilePic,
        };
      } catch (e) {
        // silenciat
      }
    };

    loadUser();
  }, []);

  return <>{children}</>;
}
