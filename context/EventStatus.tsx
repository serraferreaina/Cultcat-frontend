// context/EventStatus.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EventStatusContextProps {
  goingEvents: Record<number, boolean>;
  savedEvents: Record<number, boolean>;
  toggleGoing: (eventId: number) => Promise<void>;
  toggleSaved: (eventId: number) => Promise<void>;
}

const EventStatusContext = createContext<EventStatusContextProps | undefined>(undefined);

export const EventStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goingEvents, setGoingEvents] = useState<Record<number, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<Record<number, boolean>>({});

  // --- Load saved events and wantToGo events on startup ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Load saved events from local storage
    try {
      const json = await AsyncStorage.getItem('savedEvents');
      if (json) setSavedEvents(JSON.parse(json));
    } catch (e) {
      console.warn('Error loading saved events from storage:', e);
    }

    // Load wantToGo events from API
    if (global.authToken) {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/saved-events/?state=wantToGo', {
          headers: {
            Authorization: `Token ${global.authToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const goingMap: Record<number, boolean> = {};
          data.forEach((item: any) => {
            const eventId = parseInt(item.event_id, 10);
            goingMap[eventId] = true;
          });
          setGoingEvents(goingMap);
        }
      } catch (err) {
        console.error('Error loading wantToGo events:', err);
      }
    }
  };

  // --- Persist saved events to AsyncStorage ---
  const persistSaved = async (updated: Record<number, boolean>) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving events to storage:', e);
    }
  };

  // --- Toggle "Want to Go" with API integration ---
  const toggleGoing = async (eventId: number) => {
    const isCurrentlyGoing = goingEvents[eventId] || false;

    // Optimistic update
    const updated = { ...goingEvents, [eventId]: !isCurrentlyGoing };
    setGoingEvents(updated);

    if (!global.authToken) {
      console.warn('No token available, toggled only locally.');
      return;
    }

    try {
      if (isCurrentlyGoing) {
        // Try DELETE with /save/ endpoint first
        console.log(`Removing event ${eventId} from wantToGo`);
        const res = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${global.authToken}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('DELETE failed, trying POST with wishlist state:', errorText);

          // Fallback: try setting to wishlist to remove from wantToGo
          const fallbackRes = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${global.authToken}`,
            },
            body: JSON.stringify({ state: 'wishlist' }),
          });

          if (!fallbackRes.ok) {
            throw new Error(`HTTP error! status: ${fallbackRes.status}`);
          }
        }
        console.log(`Successfully removed event ${eventId} from wantToGo`);
      } else {
        // POST: Add to wantToGo
        console.log(`Adding event ${eventId} to wantToGo`);
        const res = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${global.authToken}`,
          },
          body: JSON.stringify({ state: 'wantToGo' }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const responseData = await res.json();
        console.log('Success response:', responseData);
      }
    } catch (err) {
      console.error('Error toggling "want to go" on server:', err);
      // Revert on failure
      const reverted = { ...goingEvents, [eventId]: isCurrentlyGoing };
      setGoingEvents(reverted);
    }
  };

  // --- Toggle "Saved" with API integration ---
  const toggleSaved = async (eventId: number) => {
    const isCurrentlySaved = savedEvents[eventId] || false;

    const updated = { ...savedEvents, [eventId]: !isCurrentlySaved };
    setSavedEvents(updated);
    await persistSaved(updated);

    if (!global.authToken) {
      console.warn('No token available, toggled only locally.');
      return;
    }

    try {
      const res = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${global.authToken}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      if (isCurrentlySaved) {
        // If already saved, remove it
        await fetch(`http://nattech.fib.upc.edu:40490/saved-events/${eventId}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${global.authToken}`,
          },
        });
      }
    } catch (err) {
      console.error('Error saving event on server:', err);
      // Revert on failure
      const reverted = { ...savedEvents, [eventId]: isCurrentlySaved };
      setSavedEvents(reverted);
      await persistSaved(reverted);
    }
  };

  return (
    <EventStatusContext.Provider value={{ goingEvents, savedEvents, toggleGoing, toggleSaved }}>
      {children}
    </EventStatusContext.Provider>
  );
};

export const useEventStatus = () => {
  const context = useContext(EventStatusContext);
  if (!context) throw new Error('useEventStatus must be used within EventStatusProvider');
  return context;
};
