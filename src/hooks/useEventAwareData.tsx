import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';
import { db } from '@/lib/database';

export interface UseEventAwareDataOptions<T> {
  /**
   * Función que carga los datos desde la base de datos
   * Recibe el eventId y debe retornar los datos
   */
  fetchData: (eventId: string) => T | T[] | Promise<T | T[]>;
  
  /**
   * Función para comparar si los datos son iguales (para evitar re-renders innecesarios)
   */
  compareData?: (a: T | T[], b: T | T[]) => boolean;
  
  /**
   * Si es true, espera que fetchData retorne una Promise
   */
  asyncMode?: boolean;
}

/**
 * Hook customizado para cargar datos de forma reactiva basándose en el evento seleccionado.
 * 
 * @example
 * ```tsx
 * const { data: sessions, isLoading, error, reload } = useEventAwareData({
 *   fetchData: (eventId) => db.eventSessions.getBySubEvento(eventId),
 * });
 * ```
 */
export function useEventAwareData<T>(options: UseEventAwareDataOptions<T>) {
  const { fetchData, compareData, asyncMode = false } = options;
  const { selectedEventId, eventChangeTrigger } = useEventContext();
  const [data, setData] = useState<T | T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastDataRef = useRef<T | T[] | null>(null);
  
  const loadData = useCallback(async () => {
    if (!selectedEventId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result: T | T[];
      
      if (asyncMode) {
        result = await fetchData(selectedEventId) as T | T[];
      } else {
        result = fetchData(selectedEventId) as T | T[];
      }
      
      // Solo actualizar si los datos son diferentes
      if (compareData) {
        if (!compareData(result, lastDataRef.current as T | T[])) {
          setData(result);
          lastDataRef.current = result;
        }
      } else {
        setData(result);
        lastDataRef.current = result;
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Error al cargar datos'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedEventId, eventChangeTrigger, fetchData, compareData, asyncMode]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return {
    data,
    setData,
    isLoading,
    error,
    reload: loadData,
    selectedEventId,
  };
}

/**
 * Hook para cargar una lista de datos filtrados por evento
 * 
 * @example
 * ```tsx
 * const { items, isLoading } = useEventAwareList({
 *   collectionKey: 'eventSessions',
 *   filterFn: (sessions, eventId) => sessions.filter(s => s.eventId === eventId),
 * });
 * ```
 */
export function useEventAwareList<T>({
  collectionKey,
  filterFn,
}: {
  collectionKey: string;
  filterFn: (allItems: any[], eventId: string) => T[];
}) {
  const { selectedEventId, eventChangeTrigger } = useEventContext();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = () => {
      if (!selectedEventId) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Obtener la colección desde db
        const collection = (db as any)[collectionKey];
        if (collection && typeof collection.getAll === 'function') {
          const allItems = collection.getAll();
          const filtered = filterFn(allItems, selectedEventId);
          setItems(filtered);
        }
      } catch (e) {
        console.error(`Error loading ${collectionKey}:`, e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedEventId, eventChangeTrigger, collectionKey, filterFn]);
  
  return { items, setItems, isLoading, selectedEventId };
}

/**
 * Hook para sincronizar con el cambio de evento seleccionado.
 * Ejecuta un callback cuando cambia el evento.
 * 
 * @example
 * ```tsx
 * useEventSync((eventId) => {
 *   console.log('Evento cambió a:', eventId);
 *   fetchData(eventId);
 * });
 * ```
 */
export function useEventSync(callback: (eventId: string | null) => void) {
  const { selectedEventId, eventChangeTrigger } = useEventContext();
  
  useEffect(() => {
    callback(selectedEventId);
  }, [selectedEventId, eventChangeTrigger]);
}