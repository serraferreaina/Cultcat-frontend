import React, { createContext, useContext, useState, useEffect } from 'react';

type EventStatusType = {
  goingEvents: { [key: number]: boolean };
  savedEvents: { [key: number]: boolean };
  toggleGoing: (id: number) => void;
  toggleSaved: (id: number) => void;
  loadingSaved: boolean;
};

const EventStatusContext = createContext<EventStatusType | undefined>(undefined);

export const EventStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [goingEvents, setGoingEvents] = useState<{ [key: number]: boolean }>({});
  const [savedEvents, setSavedEvents] = useState<{ [key: number]: boolean }>({});
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Función para esperar a que global.authToken esté disponible
  const waitForToken = async (): Promise<string> => {
    while (!global.authToken) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return global.authToken;
  };

  useEffect(() => {
    const loadSavedEvents = async () => {
      try {
        const token = await waitForToken();
        const res = await fetch('http://nattech.fib.upc.edu:40490/saved-events/?state=wishlist', {
          headers: { Authorization: `Token ${token}` },
        });

        if (!res.ok) {
          console.error('Error loading saved events', res.status);
          setLoadingSaved(false);
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn('Saved events no es un array', data);
          setLoadingSaved(false);
          return;
        }

        const saved: Record<number, boolean> = {};
        data.forEach((item) => {
          const id = Number(item.event_id);
          if (!isNaN(id)) saved[id] = true;
        });

        setSavedEvents(saved);
      } catch (e) {
        console.error('Error loading saved events', e);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedEvents();
  }, []);

  const toggleGoing = (id: number) => {
    setGoingEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSaved = async (eventId: number) => {
    try {
      const token = await waitForToken();
      const newState = !savedEvents[eventId];

      // Actualizar localmente primero
      setSavedEvents((prev) => ({ ...prev, [eventId]: newState }));

      const res = await fetch(`http://nattech.fib.upc.edu:40490/save/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          state: newState ? 'wishlist' : 'unsaved',
        }),
      });

      if (!res.ok) {
        console.error('Error saving event', res.status);
        // Revertir local si falla
        setSavedEvents((prev) => ({ ...prev, [eventId]: !newState }));
      }
    } catch (e) {
      console.error('Error saving event', e);
      // Revertir local si falla
      setSavedEvents((prev) => ({ ...prev, [eventId]: !savedEvents[eventId] }));
    }
  };

  return (
    <EventStatusContext.Provider
      value={{ goingEvents, savedEvents, toggleGoing, toggleSaved, loadingSaved }}
    >
      {children}
    </EventStatusContext.Provider>
  );
};

export const useEventStatus = () => {
  const context = useContext(EventStatusContext);
  if (!context) throw new Error('useEventStatus must be used inside EventStatusProvider');
  return context;
};
