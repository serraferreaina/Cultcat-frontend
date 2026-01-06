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
  toggleSaved: (eventId: number, event?: any) => Promise<void>;
  toggleAssisted: (eventId: number, date?: Date) => Promise<void>;
  refreshSavedEvents: () => Promise<void>;
  loadInitialData: () => Promise<void>;
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
    // Carregar dades locals primer (més ràpid)
    try {
      const json = await AsyncStorage.getItem('savedEvents');
      if (json) setSavedEvents(JSON.parse(json));

      const datesJson = await AsyncStorage.getItem('attendanceDates');
      if (datesJson) setAttendanceDates(JSON.parse(datesJson));
    } catch (e) {
      console.error('Error loading local saved events:', e);
    }

    // Després sincronitzar amb el backend
    try {
      const datesMap: Record<number, string> = {};

      // Carregar esdeveniments "going"
      const goingData = await api('/saved-events/?state=wantToGo');
      const goingMap: Record<number, boolean> = {};

      if (Array.isArray(goingData)) {
        goingData.forEach((item: any) => {
          const eventId = parseInt(item.event_id, 10);
          goingMap[eventId] = true;

          if (item.attendance_date) {
            datesMap[eventId] = item.attendance_date;
          }
        });
      }
      setGoingEvents(goingMap);

      // Carregar esdeveniments "attended"
      // B. Load "Attended"
      const assistedData = await api('/saved-events/?state=attended');
      const assistedMap: Record<number, boolean> = {};

      if (Array.isArray(assistedData)) {
        assistedData.forEach((item: any) => {
          const eventId = parseInt(item.event_id, 10);
          assistedMap[eventId] = true;

          if (item.attendance_date) {
            datesMap[eventId] = item.attendance_date;
          }
        });
      }

      setAssistedEvents(assistedMap);

      // Actualitzar totes les dates
      setAttendanceDates(datesMap);
      await AsyncStorage.setItem('attendanceDates', JSON.stringify(datesMap));

      // Carregar esdeveniments "wishlist"
      // C. Load "Wishlist" (Saved/Bookmarked)
      const savedData = await api('/saved-events/?state=wishlist');
      const savedMap: Record<number, boolean> = {};

      if (Array.isArray(savedData)) {
        savedData.forEach((item: any) => {
          const eventId = parseInt(item.event_id, 10);
          savedMap[eventId] = true;
        });
      }

      setSavedEvents(savedMap);

      await AsyncStorage.setItem('savedEvents', JSON.stringify(savedMap));
    } catch (error: any) {
      if (error?.silent) return;
      if (error?.message === 'Unauthorized') return;
      console.error('❌ Error loading API data:', error);
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
        await api(`/save/${eventId}/`, {
          method: 'DELETE',
        });
      } else {
        const body: any = { state };
        if (date) {
          // IMPORTANT: Formatar la data en format YYYY-MM-DD
          body.attendance_date = date.toISOString().split('T')[0];
        }

        const response = await api(`/save/${eventId}/`, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        // Verificar si el backend ha retornat la data correctament
        if (response && response.attendance_date) {
        } else {
          console.warn('⚠️ Backend did not return attendance_date');
        }
      }
    } catch (err) {
      console.error(`Error toggling ${state}:`, err);
      onFail();
    }
  };

  const toggleGoing = async (eventId: number, date?: Date) => {
    const isCurrentlyGoing = goingEvents[eventId] || false;

    if (!isCurrentlyGoing && date) {
      // Afegint: guardar la data
      const dateString = date.toISOString().split('T')[0];
      const updatedDates = { ...attendanceDates, [eventId]: dateString };
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    } else if (isCurrentlyGoing) {
      // Eliminant: esborrar la data
      const updatedDates = { ...attendanceDates };
      delete updatedDates[eventId];
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    }

    // Actualització optimista
    const updated = { ...goingEvents, [eventId]: !isCurrentlyGoing };
    setGoingEvents(updated);

    // Sincronitzar amb backend
    await handleApiToggle(
      eventId,
      isCurrentlyGoing,
      'wantToGo',
      () => {
        // En cas d'error, revertir
        console.warn(`⚠️ Could not sync event ${eventId} with backend, reverting...`);
        setGoingEvents({ ...goingEvents, [eventId]: isCurrentlyGoing });
      },
      date,
    );
  };

  const toggleAssisted = async (eventId: number, date?: Date) => {
    const isCurrentlyAssisted = assistedEvents[eventId] || false;

    if (!isCurrentlyAssisted && date) {
      // Afegint: guardar la data
      const dateString = date.toISOString().split('T')[0];
      const updatedDates = { ...attendanceDates, [eventId]: dateString };
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    } else if (isCurrentlyAssisted) {
      // Eliminant: esborrar la data
      const updatedDates = { ...attendanceDates };
      delete updatedDates[eventId];
      setAttendanceDates(updatedDates);
      await persistDates(updatedDates);
    }

    // Actualització optimista
    const updated = { ...assistedEvents, [eventId]: !isCurrentlyAssisted };
    setAssistedEvents(updated);

    // Sincronitzar amb backend
    await handleApiToggle(
      eventId,
      isCurrentlyAssisted,
      'attended',
      () => {
        // En cas d'error, revertir
        console.warn(`⚠️ Could not sync event ${eventId} with backend, reverting...`);
        setAssistedEvents({ ...assistedEvents, [eventId]: isCurrentlyAssisted });
      },
      date,
    );
  };

  const toggleSaved = async (eventId: number, event?: any) => {
    const isCurrentlySaved = savedEvents[eventId] || false;

    const updated = { ...savedEvents, [eventId]: !isCurrentlySaved };
    setSavedEvents(updated);
    await persistSaved(updated);

    // Si estamos guardando (no eliminando), necesitamos una fecha válida
    let dateToSend: Date | undefined = undefined;

    if (!isCurrentlySaved && event) {
      // Para wishlist (bookmark), usar la fecha de fin del evento
      if (event.data_fi) {
        dateToSend = new Date(event.data_fi);
      } else if (event.data_inici) {
        dateToSend = new Date(event.data_inici);
      } else {
        dateToSend = new Date();
      }
    }

    await handleApiToggle(
      eventId,
      isCurrentlySaved,
      'wishlist',
      async () => {
        const reverted = { ...savedEvents, [eventId]: isCurrentlySaved };
        setSavedEvents(reverted);
        await persistSaved(reverted);
      },
      dateToSend,
    );
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
        loadInitialData,
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
    if (!event.data_fi) return false;
    const endDate = new Date(event.data_fi);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const past = isPast();
  const id = event.id;

  // Obtenir la data d'assistència
  const attendanceDate = attendanceDates[id]
    ? (() => {
        // Parsejar manualment per evitar problemes de zona horària
        const [year, month, day] = attendanceDates[id].split('-').map(Number);
        // Crear la data directament amb els components (month - 1 perquè els mesos van de 0-11)
        const date = new Date(year, month - 1, day, 12, 0, 0);
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
