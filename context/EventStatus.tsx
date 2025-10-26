import React, { createContext, useContext, useState } from 'react';

type EventStatusType = {
  goingEvents: { [key: number]: boolean };
  savedEvents: { [key: number]: boolean };
  toggleGoing: (id: number) => void;
  toggleSaved: (id: number) => void;
};

const EventStatusContext = createContext<EventStatusType | undefined>(undefined);

export const EventStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [goingEvents, setGoingEvents] = useState<{ [key: number]: boolean }>({});
  const [savedEvents, setSavedEvents] = useState<{ [key: number]: boolean }>({});

  const toggleGoing = (id: number) => {
    setGoingEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSaved = (id: number) => {
    setSavedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <EventStatusContext.Provider value={{ goingEvents, savedEvents, toggleGoing, toggleSaved }}>
      {children}
    </EventStatusContext.Provider>
  );
};

export const useEventStatus = () => {
  const context = useContext(EventStatusContext);
  if (!context) throw new Error('useEventStatus must be used inside EventStatusProvider');
  return context;
};
