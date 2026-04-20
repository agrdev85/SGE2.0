import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, MacroEvent } from '@/lib/database';
import { useAuth } from './AuthContext';

interface EventContextType {
  selectedEventId: string | null;
  selectedEvent: MacroEvent | null;
  userEvents: MacroEvent[];
  setSelectedEventId: (id: string) => void;
  isFirstVisit: boolean;
  showEventSelector: boolean;
  setShowEventSelector: (v: boolean) => void;
  refreshEvents: () => void;
  eventChangeTrigger: number;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, isAdmin, isAdminReceptivo, isAdminEmpresa, isCoordinadorHotel } = useAuth();
  const [selectedEventId, setSelectedEventIdState] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<MacroEvent[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventChangeTrigger, setEventChangeTrigger] = useState(0);

  const loadUserEvents = () => {
    if (!user) { setUserEvents([]); return; }

    let allMacros = db.macroEvents.getAll();

    if (user.role === 'USER' || user.role === 'REVIEWER' || user.role === 'COMMITTEE') {
      // Participants: show events they're registered in or submitted abstracts to
      const registrations = db.eventRegistrations.getByUser(user.id);
      const abstracts = db.abstracts.getByUser(user.id);
      const regEventIds = registrations.map(r => r.eventId);
      const absEventIds = abstracts.map(a => a.eventId);
      const allEventIds = [...new Set([...regEventIds, ...absEventIds])];
      // Find macro events containing these simple events
      const events = allEventIds.map(id => db.events.getById(id)).filter(Boolean);
      const macroIds = [...new Set(events.map(e => e!.macroEventId))];
      allMacros = allMacros.filter(me => macroIds.includes(me.id));
      // Fallback: if no registrations, show active macros
      if (allMacros.length === 0) {
        allMacros = db.macroEvents.getAll().filter(me => me.isActive);
      }
    } else if (user.role === 'COORDINADOR_HOTEL') {
      const eventoHoteles = db.eventoHoteles.getByHotel(user.hotelId || '');
      const macroIds = eventoHoteles.map(eh => eh.eventoId);
      allMacros = allMacros.filter(me => macroIds.includes(me.id));
    } else if (user.role === 'ADMIN_RECEPTIVO' || user.role === 'LECTOR_RECEPTIVO') {
      allMacros = allMacros.filter(me => !(me as any).receptivoId || (me as any).receptivoId === user.receptivoId);
    } else if (user.role === 'ADMIN_EMPRESA' || user.role === 'LECTOR_EMPRESA') {
      allMacros = allMacros.filter(me => !(me as any).empresaId || (me as any).empresaId === user.empresaId);
    }
    // SUPERADMIN and ADMIN see all

    setUserEvents(allMacros);
  };

  useEffect(() => {
    loadUserEvents();
  }, [user]);

  useEffect(() => {
    if (!user || userEvents.length === 0) return;

    const lastKey = `last_event_${user.id}`;
    const lastEventId = localStorage.getItem(lastKey);
    const hasVisited = localStorage.getItem(`visited_${user.id}`);

    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowEventSelector(true);
      localStorage.setItem(`visited_${user.id}`, 'true');
    } else if (lastEventId && userEvents.find(e => e.id === lastEventId)) {
      setSelectedEventIdState(lastEventId);
    } else {
      setSelectedEventIdState(userEvents[0].id);
    }
  }, [user, userEvents]);

  const setSelectedEventId = (id: string) => {
    setSelectedEventIdState(id);
    setShowEventSelector(false);
    setIsFirstVisit(false);
    setEventChangeTrigger(prev => prev + 1);
    if (user) {
      localStorage.setItem(`last_event_${user.id}`, id);
    }
    window.dispatchEvent(new CustomEvent('sge-event-changed', { detail: { eventId: id } }));
  };

  const selectedEvent = userEvents.find(e => e.id === selectedEventId) || null;

  return (
    <EventContext.Provider value={{
      selectedEventId,
      selectedEvent,
      userEvents,
      setSelectedEventId,
      isFirstVisit,
      showEventSelector,
      setShowEventSelector,
      refreshEvents: loadUserEvents,
      eventChangeTrigger,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEventContext must be used within EventProvider');
  return context;
}
