import React, { useEffect } from 'react';

declare global {
  var currentUser: {
    id: number;
    username: string;
    profile_picture: string | null;
    profile_description: string;
    email?: string;
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
          id: data.id ?? 0,
          username: data.username ?? '',
          profile_description: data.bio ?? '',
          email: data.email ?? '',
          profile_picture:
            data.profilePic ??
            'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png', // fallback string
        };
      } catch (e) {
        // silenciat
      }
    };

    loadUser();
  }, []);

  return <>{children}</>;
}
