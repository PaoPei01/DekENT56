import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_EVENT_SLUG } from '../lib/defaultEvent';
import type { EventRecord } from '../lib/eventTypes';
import { fetchAdminEvents, fetchPublicEvents } from '../services/events';

const STORAGE_KEY = 'tfbp_current_event_id';

type EventContextValue = {
  currentEvent: EventRecord | null;
  currentEventId: string | null;
  currentEventSlug: string | null;
  events: EventRecord[];
  loading: boolean;
  error: string | null;
  setCurrentEventById: (id: string) => void;
  setCurrentEventBySlug: (slug: string) => void;
  reloadEvents: () => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);

function chooseEvent(events: EventRecord[], preferredId: string | null) {
  if (!events.length) return null;
  return events.find((event) => event.id === preferredId)
    ?? events.find((event) => event.slug === DEFAULT_EVENT_SLUG)
    ?? events[0];
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let nextEvents: EventRecord[] = [];
      try {
        nextEvents = await fetchAdminEvents();
      } catch {
        nextEvents = await fetchPublicEvents();
      }
      const preferredId = localStorage.getItem(STORAGE_KEY);
      const nextCurrent = chooseEvent(nextEvents, preferredId);
      setEvents(nextEvents);
      setCurrentEvent(nextCurrent);
      if (nextCurrent) localStorage.setItem(STORAGE_KEY, nextCurrent.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events');
      setEvents([]);
      setCurrentEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadEvents();
  }, [reloadEvents]);

  const value = useMemo<EventContextValue>(() => ({
    currentEvent,
    currentEventId: currentEvent?.id ?? null,
    currentEventSlug: currentEvent?.slug ?? null,
    events,
    loading,
    error,
    setCurrentEventById: (id: string) => {
      const next = events.find((event) => event.id === id);
      if (!next) return;
      localStorage.setItem(STORAGE_KEY, next.id);
      setCurrentEvent(next);
    },
    setCurrentEventBySlug: (slug: string) => {
      const next = events.find((event) => event.slug === slug);
      if (!next) return;
      localStorage.setItem(STORAGE_KEY, next.id);
      setCurrentEvent(next);
    },
    reloadEvents,
  }), [currentEvent, error, events, loading, reloadEvents]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const value = useContext(EventContext);
  if (!value) throw new Error('useEventContext must be used inside EventProvider');
  return value;
}
