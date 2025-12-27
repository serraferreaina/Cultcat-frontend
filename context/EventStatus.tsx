import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

interface EventStatusContextProps {
  goingEvents: Record<number, boolean>;
  savedEvents: Record<number, boolean>;
  assistedEvents: Record<number, boolean>;
  attendanceDates: Record<number, string>;
  toggleGoing: (eventId: number, date?: Date) => Promise<void>;
  toggleSaved: (eventId: number) => Promise<void>;
  toggleAssisted: (eventId: number, date?: Date) => Promise<void>;
  refreshSavedEvents: () => Promise<void>;
}

const EventStatusContext = createContext<EventStatusContextProps | undefined>(undefined);

export const EventStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goingEvents, setGoingEvents] = useState<Record<number, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<Record<number, boolean>>({});
  const [assistedEvents, setAssistedEvents] = useState<Record<number, boolean>>({});
  const [attendanceDates, setAttendanceDates] = useState<Record<number, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const json = await AsyncStorage.getItem('savedEvents');
      if (json) setSavedEvents(JSON.parse(json));

      const datesJson = await AsyncStorage.getItem('attendanceDates');
      if (datesJson) setAttendanceDates(JSON.parse(datesJson));
    } catch (e) {
      console.error('Error loading local saved events:', e);
    }

    try {
      const goingData = await api('/saved-events/?state=wantToGo');
      const goingMap: Record<number, boolean> = {};
      const datesMap: Record<number, string> = {};
      goingData.forEach((item: any) => {
        const eventId = parseInt(item.event_id, 10);
        goingMap[eventId] = true;
        if (item.attendance_date) {
          datesMap[eventId] = item.attendance_date;
        }
      });
      setGoingEvents(goingMap);
      setAttendanceDates((prev) => ({ ...prev, ...datesMap }));

      const assistedData = await api('/saved-events/?state=attended');
      const assistedMap: Record<number, boolean> = {};
      assistedData.forEach((item: any) => {
        const eventId = parseInt(item.event_id, 10);
        assistedMap[eventId] = true;
        if (item.attendance_date) {
          datesMap[eventId] = item.attendance_date;
        }
      });
      setAssistedEvents(assistedMap);
      setAttendanceDates((prev) => ({ ...prev, ...datesMap }));

      const savedData = await api('/saved-events/?state=wishlist');
      const savedMap: Record<number, boolean> = {};
      savedData.forEach((item: any) => {
        savedMap[parseInt(item.event_id, 10)] = true;
      });
      setSavedEvents(savedMap);

      await AsyncStorage.setItem('savedEvents', JSON.stringify(savedMap));
      await AsyncStorage.setItem('attendanceDates', JSON.stringify(datesMap));
    } catch (err) {
      console.error('Error loading API data:', err);
    }
  };

  const refreshSavedEvents = async () => {
    try {
      const savedData = await api('/saved-events/?state=wishlist');
      const savedMap: Record<number, boolean> = {};
      savedData.forEach((item: any) => {
        savedMap[parseInt(item.event_id, 10)] = true;
      });
      setSavedEvents(savedMap);
      await AsyncStorage.setItem('savedEvents', JSON.stringify(savedMap));
    } catch (err) {
      console.error('Error refreshing saved events:', err);
    }
  };

  const persistSaved = async (updated: Record<number, boolean>) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updated));
    } catch (e) {
      console.error('Error persisting saved events:', e);
    }
  };

  const persistDates = async (updated: Record<number, string>) => {
    try {
      await AsyncStorage.setItem('attendanceDates', JSON.stringify(updated));
    } catch (e) {
      console.error('Error persisting attendance dates:', e);
    }
  };

  const handleApiToggle = async (
    eventId: number,
    isActive: boolean,
    state: 'wantToGo' | 'attended' | 'wishlist',
    onFail: () => void,
    date?: Date,
  ) => {
    try {
      if (isActive) {
        console.log(`Removing event ${eventId} from ${state}`);
        await api(`/save/${eventId}/`, {
          method: 'DELETE',
        });
      } else {
        console.log(`Adding event ${eventId} to ${state}`);
        const body: any = { state };
        if (date) {
          body.attendance_date = date.toISOString().split('T')[0];
        }
        await api(`/save/${eventId}/`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
    } catch (err) {
      console.error(`Error toggling ${state}:`, err);
      onFail();
    }
  };

  const toggleGoing = async (eventId: number, date?: Date) => {
    const isCurrentlyGoing = goingEvents[eventId] || false;

    // Update date if provided
    if (date && !isCurrentlyGoing) {
      const dateString = date.toISOString().split('T')[0];
      const updatedDates = { ...attendanceDates, [eventId]: dateString };
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    } else if (isCurrentlyGoing) {
      const updatedDates = { ...attendanceDates };
      delete updatedDates[eventId];
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    }

    // Optimistic Update
    const updated = { ...goingEvents, [eventId]: !isCurrentlyGoing };
    setGoingEvents(updated);

    // Try to sync with backend
    try {
      await handleApiToggle(
        eventId,
        isCurrentlyGoing,
        'wantToGo',
        () => {
          console.warn(`⚠️ Could not sync event ${eventId} with backend`);
        },
        date,
      );
    } catch (err) {
      console.warn(`⚠️ Error syncing with backend for event ${eventId}:`, err);
    }
  };

  const toggleAssisted = async (eventId: number, date?: Date) => {
    const isCurrentlyAssisted = assistedEvents[eventId] || false;

    // Update date if provided
    if (date && !isCurrentlyAssisted) {
      const dateString = date.toISOString().split('T')[0];
      const updatedDates = { ...attendanceDates, [eventId]: dateString };
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    } else if (isCurrentlyAssisted) {
      const updatedDates = { ...attendanceDates };
      delete updatedDates[eventId];
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    }

    // Optimistic Update
    const updated = { ...assistedEvents, [eventId]: !isCurrentlyAssisted };
    setAssistedEvents(updated);

    // Try to sync with backend
    try {
      await handleApiToggle(
        eventId,
        isCurrentlyAssisted,
        'attended',
        () => {
          console.warn(`⚠️ Could not sync event ${eventId} with backend`);
        },
        date,
      );
    } catch (err) {
      console.warn(`⚠️ Error syncing with backend for event ${eventId}:`, err);
    }
  };

  const toggleSaved = async (eventId: number) => {
    const isCurrentlySaved = savedEvents[eventId] || false;

    const updated = { ...savedEvents, [eventId]: !isCurrentlySaved };
    setSavedEvents(updated);
    await persistSaved(updated);

    await handleApiToggle(eventId, isCurrentlySaved, 'wishlist', async () => {
      const reverted = { ...savedEvents, [eventId]: isCurrentlySaved };
      setSavedEvents(reverted);
      await persistSaved(reverted);
    });
  };

  return (
    <EventStatusContext.Provider
      value={{
        goingEvents,
        savedEvents,
        assistedEvents,
        attendanceDates,
        toggleGoing,
        toggleSaved,
        toggleAssisted,
        refreshSavedEvents,
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
  const { goingEvents, toggleGoing, assistedEvents, toggleAssisted, attendanceDates } =
    useEventStatus();
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

  // Crear la data i sumar-li un dia per compensar la zona horària
  const attendanceDate = attendanceDates[id] 
    ? (() => {
        const date = new Date(attendanceDates[id]);
        date.setDate(date.getDate() + 1);
        return date;
      })()
    : undefined;

  if (past) {
    return {
      isActive: !!assistedEvents[id],
      toggle: (date?: Date) => toggleAssisted(id, date),
      textKey: t('assisted'),
      textKeyInactive: t('iHaveAssisted'),
      isPast: true,
      colorActive: '#4CAF50',
      attendanceDate,
    };
  } else {
    return {
      isActive: !!goingEvents[id],
      toggle: (date?: Date) => toggleGoing(id, date),
      textKey: t('iWillAttend'),
      textKeyInactive: t('wantToGo'),
      isPast: false,
      colorActive: '#4CAF50',
      attendanceDate,
    };
  }
};