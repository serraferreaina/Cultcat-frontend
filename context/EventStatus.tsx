// context/EventStatus.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EventStatusContextProps {
  goingEvents: Record<number, boolean>;
  savedEvents: Record<number, boolean>;
  toggleGoing: (eventId: number) => void;
  toggleSaved: (eventId: number) => Promise<void>;
}

const EventStatusContext = createContext<EventStatusContextProps | undefined>(undefined);

export const EventStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goingEvents, setGoingEvents] = useState<Record<number, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<Record<number, boolean>>({});

  // --- Carregar bookmarks locals al iniciar ---
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const json = await AsyncStorage.getItem('savedEvents');
        if (json) setSavedEvents(JSON.parse(json));
      } catch (e) {
        console.warn('Error loading saved events from storage:', e);
      }
    };
    loadSaved();
  }, []);

  // --- Sincronitzar bookmarks locals amb AsyncStorage ---
  const persistSaved = async (updated: Record<number, boolean>) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving events to storage:', e);
    }
  };

  const toggleGoing = (eventId: number) => {
    setGoingEvents((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

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
        method: isCurrentlySaved ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${global.authToken}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (err) {
      console.error('Error saving event on server:', err);
      // revertir si falla
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
