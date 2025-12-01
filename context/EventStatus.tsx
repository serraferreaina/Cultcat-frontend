import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

interface EventStatusContextProps {
  goingEvents: Record<number, boolean>;
  savedEvents: Record<number, boolean>;
  assistedEvents: Record<number, boolean>;
  toggleGoing: (eventId: number) => Promise<void>;
  toggleSaved: (eventId: number) => Promise<void>;
  toggleAssisted: (eventId: number) => Promise<void>;
}

const EventStatusContext = createContext<EventStatusContextProps | undefined>(undefined);

export const EventStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goingEvents, setGoingEvents] = useState<Record<number, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<Record<number, boolean>>({});
  const [assistedEvents, setAssistedEvents] = useState<Record<number, boolean>>({});

  // --- Load all data on startup ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // 1. Load locally saved events
    try {
      const json = await AsyncStorage.getItem('savedEvents');
      if (json) setSavedEvents(JSON.parse(json));
    } catch (e) {
      console.warn('Error loading saved events from storage:', e);
    }

    // 2. Load API data
    if (global.authToken) {
      try {
        // A. Load "Want To Go"
        const resGoing = await fetch(
          'http://nattech.fib.upc.edu:40490/saved-events/?state=wantToGo',
          {
            headers: { Authorization: `Token ${global.authToken}` },
          },
        );

        if (resGoing.ok) {
          const data = await resGoing.json();
          const goingMap: Record<number, boolean> = {};
          data.forEach((item: any) => {
            goingMap[parseInt(item.event_id, 10)] = true;
          });
          setGoingEvents(goingMap);
        }

        // B. Load "Attended" (Backend calls it 'attended', we map it to 'assistedEvents')
        const resAssisted = await fetch(
          'http://nattech.fib.upc.edu:40490/saved-events/?state=attended',
          {
            headers: { Authorization: `Token ${global.authToken}` },
          },
        );

        if (resAssisted.ok) {
          const data = await resAssisted.json();
          const assistedMap: Record<number, boolean> = {};
          data.forEach((item: any) => {
            assistedMap[parseInt(item.event_id, 10)] = true;
          });
          setAssistedEvents(assistedMap);
        }
      } catch (err) {
        console.error('Error loading API events:', err);
      }
    }
  };

  // --- Persist locally saved events ---
  const persistSaved = async (updated: Record<number, boolean>) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving events to storage:', e);
    }
  };

  // --- Generic Helper for API Toggles ---
  // Updated type to accept 'attended' instead of 'assisted'
  const handleApiToggle = async (
    eventId: number,
    isActive: boolean,
    state: 'wantToGo' | 'attended',
    onFail: () => void,
  ) => {
    if (!global.authToken) {
      console.warn('No token available, toggled only locally.');
      return;
    }

    try {
      if (isActive) {
        // DELETE logic
        console.log(`Removing event ${eventId} from ${state}`);
        const res = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
          method: 'DELETE',
          headers: { Authorization: `Token ${global.authToken}` },
        });

        if (!res.ok) {
          // Fallback: Try setting to 'wishlist' to overwrite/remove
          console.log('DELETE failed, trying fallback to wishlist state...');
          const fallbackRes = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${global.authToken}`,
            },
            body: JSON.stringify({ state: 'wishlist' }),
          });

          if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
        }
      } else {
        // POST logic (Add)
        console.log(`Adding event ${eventId} to ${state}`);
        const res = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${global.authToken}`,
          },
          body: JSON.stringify({ state }), // This now sends "attended" or "wantToGo"
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      }
    } catch (err) {
      console.error(`Error toggling "${state}" on server:`, err);
      onFail(); // Execute rollback
    }
  };

  // --- Toggle "Want to Go" ---
  const toggleGoing = async (eventId: number) => {
    const isCurrentlyGoing = goingEvents[eventId] || false;

    // Optimistic Update
    const updated = { ...goingEvents, [eventId]: !isCurrentlyGoing };
    setGoingEvents(updated);

    await handleApiToggle(eventId, isCurrentlyGoing, 'wantToGo', () => {
      // Revert
      setGoingEvents({ ...goingEvents, [eventId]: isCurrentlyGoing });
    });
  };

  // --- Toggle "Assisted" ---
  const toggleAssisted = async (eventId: number) => {
    const isCurrentlyAssisted = assistedEvents[eventId] || false;

    // Optimistic Update
    const updated = { ...assistedEvents, [eventId]: !isCurrentlyAssisted };
    setAssistedEvents(updated);

    // HERE IS THE FIX: We pass 'attended' string to the API helper
    await handleApiToggle(eventId, isCurrentlyAssisted, 'attended', () => {
      // Revert
      setAssistedEvents({ ...assistedEvents, [eventId]: isCurrentlyAssisted });
    });
  };

  // --- Toggle "Saved" (Bookmark) ---
  const toggleSaved = async (eventId: number) => {
    const isCurrentlySaved = savedEvents[eventId] || false;

    const updated = { ...savedEvents, [eventId]: !isCurrentlySaved };
    setSavedEvents(updated);
    await persistSaved(updated);

    if (!global.authToken) return;

    try {
      // 1. Ensure event exists in backend
      const res = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${global.authToken}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      // 2. If we are un-saving, delete
      if (isCurrentlySaved) {
        await fetch(`http://nattech.fib.upc.edu:40490/saved-events/${eventId}/`, {
          method: 'DELETE',
          headers: { Authorization: `Token ${global.authToken}` },
        });
      }
    } catch (err) {
      console.error('Error saving event on server:', err);
      // Revert
      const reverted = { ...savedEvents, [eventId]: isCurrentlySaved };
      setSavedEvents(reverted);
      await persistSaved(reverted);
    }
  };

  return (
    <EventStatusContext.Provider
      value={{
        goingEvents,
        savedEvents,
        assistedEvents,
        toggleGoing,
        toggleSaved,
        toggleAssisted,
      }}
    >
      {children}
    </EventStatusContext.Provider>
  );
};

export const useEventStatus = () => {
  const context = useContext(EventStatusContext);
  if (!context) throw new Error('useEventStatus must be used within EventStatusProvider');
  return context;
};

export const useEventLogic = (event: any) => {
  const { goingEvents, toggleGoing, assistedEvents, toggleAssisted } = useEventStatus();
  const { t } = useTranslation();

  const isPast = () => {
    if (!event.data_inici) return false;
    const eventDate = new Date(event.data_inici);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const past = isPast();
  const id = event.id;

  if (past) {
    return {
      isActive: !!assistedEvents[id],
      toggle: () => toggleAssisted(id),
      textKey: t('assisted'),
      textKeyInactive: t('iHaveAssisted'),
      isPast: true,
      colorActive: '#4CAF50',
    };
  } else {
    return {
      isActive: !!goingEvents[id],
      toggle: () => toggleGoing(id),
      textKey: t('iWillAttend'),
      textKeyInactive: t('wantToGo'),
      isPast: false,
      colorActive: '#4CAF50',
    };
  }
};
