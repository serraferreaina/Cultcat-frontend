import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

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
    } catch (e) {}

    // 2. Load API data
    try {
      // A. Load "Want To Go"
      const goingData = await api('/saved-events/?state=wantToGo');

      const goingMap: Record<number, boolean> = {};
      goingData.forEach((item: any) => {
        goingMap[parseInt(item.event_id, 10)] = true;
      });
      setGoingEvents(goingMap);

      // B. Load "Attended"
      const assistedData = await api('/saved-events/?state=attended');

      const assistedMap: Record<number, boolean> = {};
      assistedData.forEach((item: any) => {
        assistedMap[parseInt(item.event_id, 10)] = true;
      });
      setAssistedEvents(assistedMap);
    } catch (err) {}
  };

  // --- Persist locally saved events ---
  const persistSaved = async (updated: Record<number, boolean>) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updated));
    } catch (e) {}
  };

  // --- Generic Helper for API Toggles ---
  // Updated type to accept 'attended' instead of 'assisted'
  const handleApiToggle = async (
    eventId: number,
    isActive: boolean,
    state: 'wantToGo' | 'attended',
    onFail: () => void,
  ) => {
    try {
      if (isActive) {
        // DELETE logic
        console.log(`Removing event ${eventId} from ${state}`);

        await api(`/save/${eventId}/`, {
          method: 'DELETE',
        });
      } else {
        // POST logic (Add)
        console.log(`Adding event ${eventId} to ${state}`);

        await api(`/save/${eventId}/`, {
          method: 'POST',
          body: JSON.stringify({ state }),
        });
      }
    } catch (err) {}
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

    // update local state optimistically
    const updated = { ...savedEvents, [eventId]: !isCurrentlySaved };
    setSavedEvents(updated);
    await persistSaved(updated);

    try {
      // 1. Ensure event exists in backend
      await api(`/events/${eventId}`, {
        method: 'POST',
      });

      // 2. If unsaving → DELETE
      if (isCurrentlySaved) {
        await api(`/saved-events/${eventId}/`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      // Rollback local state
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
