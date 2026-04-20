import React, { createContext, useContext, useState, useCallback } from 'react';
import { db, MacroEvent } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

export interface HabitacionPrecio {
  tipoHabitacionId: string;
  tipoHabitacionNombre: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: string;
  cupo: number;
}

export interface HotelesData {
  hotelesSeleccionados: string[];
  salonesSeleccionados: string[];
  habitacionesPorHotel: Record<string, HabitacionPrecio[]>;
  tiposHabitacionSeleccionados: Record<string, string[]>;
}

export interface WizardState {
  eventoId: string | null;
  pasoActual: number;
  pasosCompletados: number[];
  datosTemporal: Partial<MacroEvent>;
  errores: Record<string, string>;
  ultimaModificacion: string | null;
  modificadoPor: string | null;
  isLoading: boolean;
  isSaving: boolean;
  hotelesData: HotelesData | null;
}

const pasos = [
  { numero: 1, titulo: 'Información Básica', icon: '1' },
  { numero: 2, titulo: 'Hoteles y Alojamiento', icon: '2' },
  { numero: 3, titulo: 'Tipos de Participación', icon: '3' },
  { numero: 4, titulo: 'Transporte y Logística', icon: '4' },
  { numero: 5, titulo: 'Programa Social', icon: '5' },
  { numero: 6, titulo: 'Nomencladores', icon: '6' },
  { numero: 7, titulo: 'Configuración Final', icon: '7' },
];

const PASOS_DEPENDENCIAS: Record<number, number[]> = {
  1: [],
  2: [1],
  3: [2],
  4: [3],
  5: [3],
  6: [5],
  7: [1, 2, 3, 4, 5, 6],
};

interface WizardContextType {
  state: WizardState;
  evento: MacroEvent | null;
  pasos: typeof pasos;
  guardarPaso: (paso: number, datos: Partial<MacroEvent>) => Promise<void>;
  marcarPasoCompletado: (paso: number) => void;
  siguientePaso: () => void;
  pasoAnterior: () => void;
  irAPaso: (paso: number) => void;
  puedeAccederPaso: (paso: number) => boolean;
  esPasoCompletado: (paso: number) => boolean;
  guardarYSalir: () => Promise<void>;
  guardarYContinuar: (paso: number, datos: Partial<MacroEvent>) => Promise<void>;
  cargarEvento: (eventoId: string) => Promise<void>;
  crearNuevoEvento: (datos: Partial<MacroEvent>) => Promise<string>;
  porcentajeCompletado: number;
  getPasosInfo: () => { numero: number; titulo: string; icon: string; estado: 'completado' | 'actual' | 'bloqueado' | 'pendiente' }[];
  guardarHotelesData: (data: HotelesData) => void;
  obtenerHotelesData: () => HotelesData | null;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [state, setState] = useState<WizardState>({
    eventoId: null,
    pasoActual: 1,
    pasosCompletados: [],
    datosTemporal: {},
    errores: {},
    ultimaModificacion: null,
    modificadoPor: null,
    isLoading: false,
    isSaving: false,
    hotelesData: null,
  });

  const [evento, setEvento] = useState<MacroEvent | null>(null);

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('sge_')) {
        window.dispatchEvent(new CustomEvent('sge-data-change', { detail: { key: e.key } }));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const puedeAccederPaso = useCallback((paso: number): boolean => {
    if (state.pasosCompletados.includes(paso)) return true;
    if (paso === 1) return true;
    
    const dependencias = PASOS_DEPENDENCIAS[paso] || [];
    return dependencias.every(dep => state.pasosCompletados.includes(dep));
  }, [state.pasosCompletados]);

  const esPasoCompletado = useCallback((paso: number): boolean => {
    return state.pasosCompletados.includes(paso);
  }, [state.pasosCompletados]);

  const marcarPasoCompletado = useCallback((paso: number) => {
    setState(prev => ({
      ...prev,
      pasosCompletados: prev.pasosCompletados.includes(paso) 
        ? prev.pasosCompletados 
        : [...prev.pasosCompletados, paso],
    }));
  }, []);

  const guardarPaso = useCallback(async (paso: number, datos: Partial<MacroEvent>) => {
    if (!state.eventoId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      const eventoActualizado = db.macroEvents.update(state.eventoId, datos);
      
      setEvento(eventoActualizado);
      
      const pasosActualizados = state.pasosCompletados.includes(paso)
        ? state.pasosCompletados
        : [...state.pasosCompletados, paso];
      
      setState(prev => ({
        ...prev,
        datosTemporal: { ...prev.datosTemporal, ...datos },
        ultimaModificacion: new Date().toISOString(),
        modificadoPor: user?.id || null,
        isSaving: false,
        pasosCompletados: pasosActualizados,
      }));

      db.wizardProgress.create({
        eventoId: state.eventoId,
        pasoActual: paso,
        pasosCompletados: pasosActualizados,
        modificadoPor: user?.id || 'system',
      });
    } catch (error) {
      console.error('Error guardando paso:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        errores: { ...prev.errores, [paso]: 'Error al guardar' },
      }));
    }
  }, [state.eventoId, state.pasosCompletados, user?.id]);

  const siguientePaso = useCallback(() => {
    const sigPaso = state.pasoActual + 1;
    if (sigPaso <= 8 && puedeAccederPaso(sigPaso)) {
      setState(prev => ({ ...prev, pasoActual: sigPaso }));
    }
  }, [state.pasoActual, puedeAccederPaso]);

  const pasoAnterior = useCallback(() => {
    const antPaso = state.pasoActual - 1;
    if (antPaso >= 1) {
      setState(prev => ({ ...prev, pasoActual: antPaso }));
    }
  }, [state.pasoActual]);

  const irAPaso = useCallback((paso: number) => {
    if (puedeAccederPaso(paso)) {
      setState(prev => ({ ...prev, pasoActual: paso }));
    }
  }, [puedeAccederPaso]);

  const cargarEvento = useCallback(async (eventoId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const eventoData = db.macroEvents.getById(eventoId);
      const progress = db.wizardProgress.get(eventoId);
      
      if (eventoData) {
        setEvento(eventoData);
        const pasosValidos = (progress?.pasosCompletados || []).filter(p => p >= 1 && p <= 7);
        const pasoActualValido = (progress?.pasoActual && progress.pasoActual >= 1 && progress.pasoActual <= 7) 
          ? progress.pasoActual 
          : 1;
        setState({
          eventoId,
          pasoActual: pasoActualValido,
          pasosCompletados: pasosValidos,
          datosTemporal: eventoData,
          ultimaModificacion: progress?.ultimaModificacion || null,
          modificadoPor: progress?.modificadoPor || null,
          isLoading: false,
          isSaving: false,
          errores: {},
          hotelesData: null,
        });
      } else {
        throw new Error('Evento no encontrado');
      }
    } catch (error) {
      console.error('Error cargando evento:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const crearNuevoEvento = useCallback(async (datos: Partial<MacroEvent>): Promise<string> => {
    const nuevoEvento = db.macroEvents.create({
      name: datos.name || 'Nuevo Evento',
      acronym: datos.acronym || '',
      description: datos.description || '',
      startDate: datos.startDate || new Date().toISOString(),
      endDate: datos.endDate || new Date().toISOString(),
      isActive: true,
    });

    db.wizardProgress.create({
      eventoId: nuevoEvento.id,
      pasoActual: 1,
      pasosCompletados: [],
      modificadoPor: user?.id || 'system',
    });

    setEvento(nuevoEvento);
    setState(prev => ({
      ...prev,
      eventoId: nuevoEvento.id,
      pasoActual: 1,
      pasosCompletados: [],
      datosTemporal: nuevoEvento,
    }));

    return nuevoEvento.id;
  }, [user?.id]);

  const guardarYSalir = useCallback(async () => {
    if (!state.eventoId || !evento) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      db.macroEvents.update(state.eventoId, {
        ...evento,
        pasoActual: state.pasoActual,
      });
      
      db.wizardProgress.update(state.eventoId, {
        pasoActual: state.pasoActual,
        pasosCompletados: state.pasosCompletados,
        modificadoPor: user?.id || 'system',
      });
      
      setState(prev => ({ ...prev, isSaving: false }));
    } catch (error) {
      console.error('Error guardando:', error);
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [state.eventoId, evento, state.pasoActual, state.pasosCompletados, user?.id]);

  const guardarYContinuar = useCallback(async (paso: number, datos: Partial<MacroEvent>) => {
    if (!state.eventoId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      db.macroEvents.update(state.eventoId, datos);
      
      const pasosActualizados = state.pasosCompletados.includes(paso)
        ? state.pasosCompletados
        : [...state.pasosCompletados, paso];
      
      db.wizardProgress.create({
        eventoId: state.eventoId,
        pasoActual: paso,
        pasosCompletados: pasosActualizados,
        modificadoPor: user?.id || 'system',
      });
      
      const sigPaso = paso + 1;
      if (sigPaso <= 7) {
        setState(prev => ({
          ...prev,
          pasoActual: sigPaso,
          pasosCompletados: pasosActualizados,
          datosTemporal: { ...prev.datosTemporal, ...datos },
          ultimaModificacion: new Date().toISOString(),
          modificadoPor: user?.id || null,
          isSaving: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          datosTemporal: { ...prev.datosTemporal, ...datos },
          ultimaModificacion: new Date().toISOString(),
          modificadoPor: user?.id || null,
          isSaving: false,
        }));
      }
    } catch (error) {
      console.error('Error guardando y continuando:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        errores: { ...prev.errores, [paso]: 'Error al guardar' },
      }));
    }
  }, [state.eventoId, state.pasosCompletados, user?.id]);

  const porcentajeCompletado = Math.round((state.pasosCompletados.length / 7) * 100);

  const getPasosInfo = useCallback(() => {
    return pasos.map(paso => {
      if (state.pasosCompletados.includes(paso.numero)) {
        return { ...paso, estado: 'completado' as const };
      }
      if (state.pasoActual === paso.numero) {
        return { ...paso, estado: 'actual' as const };
      }
      if (puedeAccederPaso(paso.numero)) {
        return { ...paso, estado: 'pendiente' as const };
      }
      return { ...paso, estado: 'bloqueado' as const };
    });
  }, [state.pasoActual, state.pasosCompletados, puedeAccederPaso]);

  const guardarHotelesData = useCallback((data: HotelesData) => {
    setState(prev => ({ ...prev, hotelesData: data }));
  }, []);

  const obtenerHotelesData = useCallback((): HotelesData | null => {
    return state.hotelesData;
  }, [state.hotelesData]);

  const value: WizardContextType = {
    state,
    evento,
    pasos,
    guardarPaso,
    marcarPasoCompletado,
    siguientePaso,
    pasoAnterior,
    irAPaso,
    puedeAccederPaso,
    esPasoCompletado,
    guardarYSalir,
    guardarYContinuar,
    cargarEvento,
    crearNuevoEvento,
    porcentajeCompletado,
    getPasosInfo,
    guardarHotelesData,
    obtenerHotelesData,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

export { pasos, PASOS_DEPENDENCIAS };
