import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, NomHotel, NomTipoHabitacion, Salon, EventoHotel } from '@/lib/database';
import { normalizeText, findSimilarItems, isDuplicate } from '@/lib/utils';
import { Search, Building2, MapPin, Phone, Check, X, Plus, Save, Image as ImageIcon, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { NomenclatorModal } from '@/components/ui/NomenclatorModal';
import { useConfirmation } from '@/hooks/useConfirmation';

interface HabitacionPrecio {
  tipoHabitacionId: string;
  tipoHabitacionNombre: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: string;
  cupo: number;
}

interface HotelSeleccionado {
  eventoHotelId: string;
  hotelId: string;
  hotel: NomHotel;
}

interface HotelFormData {
  nombre: string;
  descripcion: string;
  cadenaHotelera: string;
  categoriaEstrellas: number;
  ciudad: string;
  telefono: string;
  email: string;
  activo: boolean;
}

interface SalonFormData {
  hotelId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidadMaxima: number;
  estado: string;
}

interface TipoHabitacionFormData {
  nombre: string;
  descripcion: string;
  capacidadMaxPersonas: number;
  activo: boolean;
}

export function HotelesStep() {
  const { evento, guardarYContinuar, state, guardarHotelesData, obtenerHotelesData } = useWizard();
  const { canManageNomencladores } = useAuth();
  const { confirm, success } = useConfirmation();
  const [activeTab, setActiveTab] = useState('hoteles');
  
  const [hotelesDisponibles, setHotelesDisponibles] = useState<NomHotel[]>([]);
  const [hotelesSeleccionados, setHotelesSeleccionados] = useState<HotelSeleccionado[]>([]);
  const [salonesDisponibles, setSalonesDisponibles] = useState<Salon[]>([]);
  const [salonesSeleccionados, setSalonesSeleccionados] = useState<string[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [tiposHabitacion, setTiposHabitacion] = useState<NomTipoHabitacion[]>([]);
  const [habitacionesPorHotel, setHabitacionesPorHotel] = useState<Record<string, HabitacionPrecio[]>>({});
  const [tiposHabitacionSeleccionados, setTiposHabitacionSeleccionados] = useState<Record<string, string[]>>({});
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ ciudad: '', estrellas: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isSalonDialogOpen, setIsSalonDialogOpen] = useState(false);
  const [isTipoHabitacionDialogOpen, setIsTipoHabitacionDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<NomHotel | null>(null);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [editingTipoHabitacion, setEditingTipoHabitacion] = useState<NomTipoHabitacion | null>(null);
  const [suggestionDialog, setSuggestionDialog] = useState<{
    isOpen: boolean;
    type: 'tipoHabitacion' | 'salon' | 'hotel' | 'tipoParticipacion' | null;
    newName: string;
    suggestions: NomTipoHabitacion[] | Salon[] | NomHotel[];
    onSelectExisting: (id: string) => void;
    onCreateAnyway: () => void;
  }>({
    isOpen: false,
    type: null,
    newName: '',
    suggestions: [],
    onSelectExisting: () => {},
    onCreateAnyway: () => {},
  });

  const [hotelForm, setHotelForm] = useState({
    nombre: '', descripcion: '', cadenaHotelera: '', categoriaEstrellas: 3, ciudad: '', telefono: '', email: '', activo: true,
  });

  const [salonForm, setSalonForm] = useState({
    hotelId: '', codigo: '', nombre: '', descripcion: '', ubicacion: '', capacidadMaxima: 100, estado: 'ACTIVO',
  });

  const [tipoHabitacionForm, setTipoHabitacionForm] = useState({
    nombre: '', descripcion: '', capacidadMaxPersonas: 2, activo: true,
  });

  const [hotelErrors, setHotelErrors] = useState<Record<string, string>>({});
  const [salonErrors, setSalonErrors] = useState<Record<string, string>>({});
  const [tipoHabitacionErrors, setTipoHabitacionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      const salonesHotel = db.salones.getActivosByHotel(selectedHotelId);
      setSalonesDisponibles(salonesHotel);
    }
  }, [selectedHotelId]);

  useEffect(() => {
    const savedData = obtenerHotelesData();
    if (savedData) {
      setHabitacionesPorHotel(savedData.habitacionesPorHotel);
      setTiposHabitacionSeleccionados(savedData.tiposHabitacionSeleccionados);
      const hoteles = db.nomHoteles.getAll().filter(h => h.activo);
      const restoredHoteles: HotelSeleccionado[] = savedData.hotelesSeleccionados
        .map(hId => {
          const hotel = hoteles.find(h => h.id === hId);
          const eh = db.eventoHoteles.getAll().find(e => e.eventoId === evento?.id && e.hotelId === hId);
          return hotel && eh ? { eventoHotelId: eh.id, hotelId: hId, hotel } : null;
        })
        .filter((h): h is HotelSeleccionado => h !== null);
      setHotelesSeleccionados(restoredHoteles);
      setSalonesSeleccionados(savedData.salonesSeleccionados);
    }
  }, [evento?.id]);

  useEffect(() => {
    const handleDataChange = (e: CustomEvent) => {
      const collection = e.detail?.collection;
      if (collection && (
        collection.includes('hotel') || 
        collection.includes('salon') || 
        collection.includes('habitacion') ||
        collection === 'nomHoteles' ||
        collection === 'salones' ||
        collection === 'nomTiposHabitacion'
      )) {
        loadData();
      }
    };
    window.addEventListener('sge-data-change', handleDataChange as EventListener);
    return () => window.removeEventListener('sge-data-change', handleDataChange as EventListener);
  }, [evento?.id, selectedHotelId]);

  const loadData = () => {
    const hoteles = db.nomHoteles.getAll().filter(h => h.activo);
    setHotelesDisponibles(hoteles);
    const todosTipos = db.nomTiposHabitacion.getAll();
    setTiposHabitacion(todosTipos);

    const eventosHoteles = db.eventoHoteles.getByEvento(evento?.id || '');
    const hotelSeleccionadosData: HotelSeleccionado[] = eventosHoteles.map(eh => {
      const hotel = hoteles.find(h => h.id === eh.hotelId);
      return {
        eventoHotelId: eh.id,
        hotelId: eh.hotelId,
        hotel: hotel!,
      };
    }).filter(h => h.hotel);
    setHotelesSeleccionados(hotelSeleccionadosData);

    const eventoSalones = db.eventoSalones.getByEvento(evento?.id || '');
    setSalonesSeleccionados(eventoSalones.map(es => es.salonId));

    const habitacionesExistentes = db.eventoHotelHabitaciones.getByEvento(evento?.id || '');
    const habitaciones: Record<string, HabitacionPrecio[]> = {};
    const tiposSeleccionados: Record<string, string[]> = {};
    
    eventosHoteles.forEach(eh => {
      const habitacionesDelEventoHotel = habitacionesExistentes.filter(h => h.eventoHotelId === eh.id);
      
      tiposSeleccionados[eh.hotelId] = habitacionesDelEventoHotel.map(h => h.tipoHabitacionId);
      
      habitaciones[eh.hotelId] = todosTipos.map(t => {
        const existente = habitacionesDelEventoHotel.find(he => he.tipoHabitacionId === t.id);
        return {
          tipoHabitacionId: t.id,
          tipoHabitacionNombre: t.nombre || 'Sin nombre',
          precioCUP: existente?.precioCUP || 0,
          precioMoneda: existente?.precioMoneda || 0,
          moneda: existente?.moneda || 'USD',
          cupo: existente?.cupo || 0,
        };
      });
    });
    setHabitacionesPorHotel(habitaciones);
    setTiposHabitacionSeleccionados(tiposSeleccionados);

    if (hotelSeleccionadosData.length > 0 && !selectedHotelId) {
      setSelectedHotelId(hotelSeleccionadosData[0].hotelId);
    }

    guardarHotelesData({
      hotelesSeleccionados: hotelSeleccionadosData.map(h => h.hotelId),
      salonesSeleccionados: eventoSalones.map(es => es.salonId),
      habitacionesPorHotel: habitaciones,
      tiposHabitacionSeleccionados: tiposSeleccionados,
    });
  };

  const openEditHotel = (hotel: NomHotel) => {
    setEditingHotel(hotel);
    setHotelForm({
      nombre: hotel.nombre,
      descripcion: hotel.direccion || '',
      cadenaHotelera: hotel.cadenaHotelera || '',
      categoriaEstrellas: hotel.categoriaEstrellas || 3,
      ciudad: hotel.ciudad || '',
      telefono: hotel.telefono || '',
      email: hotel.email || '',
      activo: hotel.activo ?? true,
    });
    setIsHotelDialogOpen(true);
  };

  const handleDeleteHotel = async (hotel: NomHotel) => {
    await confirm({
      title: '¿Eliminar hotel?',
      description: `¿Está seguro de que desea eliminar "${hotel.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.nomHoteles.delete(hotel.id);
        loadData();
      },
      successMessage: `"${hotel.nombre}" ha sido eliminado correctamente.`,
    });
  };

  const openEditSalon = (salon: Salon) => {
    setEditingSalon(salon);
    setSalonForm({
      hotelId: salon.hotelId,
      codigo: salon.codigo,
      nombre: salon.nombre,
      descripcion: (salon as any).descripcion || '',
      ubicacion: salon.ubicacion || '',
      capacidadMaxima: salon.capacidadMaxima,
      estado: salon.estado || 'ACTIVO',
    });
    setIsSalonDialogOpen(true);
  };

  const handleDeleteSalon = async (salon: Salon) => {
    const { can, reason } = db.salones.canDelete(salon.id);
    if (!can) {
      toast.error(reason);
      return;
    }
    await confirm({
      title: '¿Eliminar salón?',
      description: `¿Está seguro de que desea eliminar "${salon.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.salones.delete(salon.id);
        loadData();
        if (selectedHotelId) {
          setSalonesDisponibles(db.salones.getActivosByHotel(selectedHotelId));
        }
      },
      successMessage: `"${salon.nombre}" ha sido eliminado correctamente.`,
    });
  };

  const openEditTipoHabitacion = (tipo: NomTipoHabitacion) => {
    setEditingTipoHabitacion(tipo);
    setTipoHabitacionForm({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      capacidadMaxPersonas: tipo.capacidadMaxPersonas || 2,
      activo: tipo.activo ?? true,
    });
    setIsTipoHabitacionDialogOpen(true);
  };

  const handleDeleteTipoHabitacion = async (tipo: NomTipoHabitacion) => {
    await confirm({
      title: '¿Eliminar tipo de habitación?',
      description: `¿Está seguro de que desea eliminar "${tipo.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.nomTiposHabitacion.delete(tipo.id);
        loadData();
      },
      successMessage: `"${tipo.nombre}" ha sido eliminado correctamente.`,
    });
  };

  const handleSaveHotel = (data: any) => {
    const errors: Record<string, string> = {};
    if (!data.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    if (!data.ciudad?.trim()) {
      errors.ciudad = 'La ciudad es requerida';
    }
    
    if (Object.keys(errors).length > 0) {
      setHotelErrors(errors);
      return;
    }
    setHotelErrors({});
    
    const existeNombre = db.nomHoteles.getAll().some(
      h => h.nombre.toLowerCase() === data.nombre.toLowerCase().trim() && (!editingHotel || h.id !== editingHotel.id)
    );
    if (existeNombre) {
      toast.error('Ya existe un hotel con este nombre');
      return;
    }

    try {
      if (editingHotel) {
        db.nomHoteles.update(editingHotel.id, {
          nombre: data.nombre.trim(),
          direccion: data.descripcion || '',
          cadenaHotelera: data.cadenaHotelera || '',
          ciudad: data.ciudad.trim(),
          categoriaEstrellas: data.categoriaEstrellas,
          telefono: data.telefono || '',
          email: data.email || '',
          activo: data.activo ?? true,
        });
        toast.success('Hotel actualizado');
        success({ title: '¡Guardado!', description: 'Hotel actualizado correctamente' });
        success({ title: '¡Hotel actualizado!', description: `Se guardaron los cambios de "${data.nombre}"` });
      } else {
        db.nomHoteles.create({
          nombre: data.nombre.trim(),
          direccion: data.descripcion || '',
          cadenaHotelera: data.cadenaHotelera || '',
          ciudad: data.ciudad.trim(),
          categoriaEstrellas: data.categoriaEstrellas,
          telefono: data.telefono || '',
          email: data.email || '',
          activo: true,
        });
        toast.success('Hotel creado');
        success({ title: '¡Guardado!', description: 'Hotel creado correctamente' });
        success({ title: '¡Hotel creado!', description: `"${data.nombre.trim()}" se agregó correctamente` });
      }
      setIsHotelDialogOpen(false);
      setEditingHotel(null);
      setHotelForm({ nombre: '', descripcion: '', cadenaHotelera: '', categoriaEstrellas: 3, ciudad: '', telefono: '', email: '', activo: true });
      loadData();
    } catch (error) {
      toast.error('Error al guardar el hotel');
    }
  };

  const handleSaveSalon = (data: any) => {
    const errors: Record<string, string> = {};
    if (!data.codigo?.trim()) {
      errors.codigo = 'El código es requerido';
    }
    if (!data.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    if (!data.capacidadMaxima || data.capacidadMaxima <= 0) {
      errors.capacidadMaxima = 'La capacidad debe ser mayor a 0';
    }
    
    if (Object.keys(errors).length > 0) {
      setSalonErrors(errors);
      return;
    }
    setSalonErrors({});
    
    const hotelIdForSalon = editingSalon ? editingSalon.hotelId : salonForm.hotelId;
    const existeCodigo = db.salones.getByHotel(hotelIdForSalon).some(
      s => s.codigo.toLowerCase() === data.codigo.toLowerCase().trim() && (!editingSalon || s.id !== editingSalon.id)
    );
    if (existeCodigo) {
      toast.error('Ya existe un salón con este código en este hotel');
      return;
    }

    try {
      if (editingSalon) {
        db.salones.update(editingSalon.id, {
          codigo: data.codigo.trim(),
          nombre: data.nombre.trim(),
          ubicacion: data.ubicacion || '',
          capacidadMaxima: data.capacidadMaxima || 100,
          descripcion: data.descripcion || '',
          estado: data.estado || 'ACTIVO',
        } as any);
        toast.success('Salón actualizado');
        success({ title: '¡Guardado!', description: 'Salón actualizado correctamente' });
        success({ title: '¡Salón actualizado!', description: `Se guardaron los cambios de "${data.nombre.trim()}"`});
      } else {
        db.salones.create({
          hotelId: hotelIdForSalon,
          codigo: data.codigo.trim(),
          nombre: data.nombre.trim(),
          ubicacion: data.ubicacion || '',
          capacidadMaxima: data.capacidadMaxima || 100,
          descripcion: data.descripcion || '',
          estado: data.estado || 'ACTIVO',
          imagenes: [],
        } as any);
        toast.success('Salón creado');
        success({ title: '¡Guardado!', description: 'Salón creado correctamente' });
        success({ title: '¡Salón creado!', description: `"${data.nombre.trim()}" se agregó correctamente`});
      }
      setIsSalonDialogOpen(false);
      setEditingSalon(null);
      setSalonForm({ hotelId: '', codigo: '', nombre: '', descripcion: '', ubicacion: '', capacidadMaxima: 100, estado: 'ACTIVO' as const });
      loadData();
      if (hotelIdForSalon) {
        setSalonesDisponibles(db.salones.getActivosByHotel(hotelIdForSalon));
      }
    } catch (error) {
      toast.error('Error al guardar el salón');
    }
  };

  const handleSaveTipoHabitacion = () => {
    if (!tipoHabitacionForm.nombre.trim()) {
      toast.error('El nombre del tipo de habitación es obligatorio');
      return;
    }

    const existe = tiposHabitacion.find(
      t => t.nombre.toLowerCase() === tipoHabitacionForm.nombre.toLowerCase().trim() && (!editingTipoHabitacion || t.id !== editingTipoHabitacion.id)
    );
    if (existe) {
      toast.error('Ya existe un tipo de habitación con este nombre');
      return;
    }

    try {
      if (editingTipoHabitacion) {
        db.nomTiposHabitacion.update(editingTipoHabitacion.id, {
          nombre: tipoHabitacionForm.nombre.trim(),
          descripcion: tipoHabitacionForm.descripcion,
          capacidadMaxPersonas: tipoHabitacionForm.capacidadMaxPersonas,
        });
        toast.success('Tipo de habitación actualizado');
        success({ title: '¡Guardado!', description: 'Tipo de habitación actualizado correctamente' });
        success({ title: '¡Tipo de habitación actualizado!', description: `Se guardaron los cambios de "${tipoHabitacionForm.nombre.trim()}"`});
      } else {
        db.nomTiposHabitacion.create({
          nombre: tipoHabitacionForm.nombre.trim(),
          descripcion: tipoHabitacionForm.descripcion,
          capacidadMaxPersonas: tipoHabitacionForm.capacidadMaxPersonas,
          activo: true,
        });
      toast.success('Tipo de habitación creado');
      success({ title: '¡Guardado!', description: 'Tipo de habitación creado correctamente' });
        success({ title: '¡Guardado!', description: 'Tipo de habitación creado correctamente' });
        success({ title: '¡Tipo de habitación creado!', description: `"${tipoHabitacionForm.nombre.trim()}" se agregó correctamente`});
      }
      setIsTipoHabitacionDialogOpen(false);
      setEditingTipoHabitacion(null);
      setTipoHabitacionForm({ nombre: '', descripcion: '', capacidadMaxPersonas: 2, activo: true });
      loadData();
    } catch (error) {
      toast.error('Error al guardar el tipo de habitación');
    }
  };

  const handleCrearTipoHabitacion = () => {
    if (!tipoHabitacionForm.nombre.trim()) {
      toast.error('El nombre del tipo de habitación es obligatorio');
      return;
    }
    if (!selectedHotelId) {
      toast.error('Seleccione un hotel primero');
      return;
    }
    
    const nombreIngresado = tipoHabitacionForm.nombre.trim();
    const existe = isDuplicate(tiposHabitacion, nombreIngresado, t => t.nombre);
    
    if (existe) {
      toast.error(`"${existe.nombre}" ya existe. Selecciónelo de la lista de tipos disponibles.`);
      return;
    }

    const similares = findSimilarItems(tiposHabitacion, nombreIngresado, t => t.nombre, 0.5);
    
    if (similares.length > 0) {
      setSuggestionDialog({
        isOpen: true,
        type: 'tipoHabitacion',
        newName: nombreIngresado,
        suggestions: similares.map(s => s.item),
        onSelectExisting: (id) => {
          const tipo = tiposHabitacion.find(t => t.id === id);
          if (tipo) {
            toggleHabitacion(selectedHotelId, id);
            success({ title: '¡Seleccionado!', description: `"${tipo.nombre}" seleccionado` });
          }
          setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
        },
        onCreateAnyway: () => {
          crearTipoHabitacion(nombreIngresado);
          setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      crearTipoHabitacion(nombreIngresado);
    }
  };

  const crearTipoHabitacion = (nombre: string) => {
    try {
      const nuevoTipo = db.nomTiposHabitacion.create({
        nombre,
        descripcion: tipoHabitacionForm.descripcion,
        capacidadMaxPersonas: tipoHabitacionForm.capacidadMaxPersonas,
        activo: true,
      });
      toast.success('Tipo de habitación creado');
      success({ title: '¡Tipo de habitación creado!', description: `"${nombre}" se agregó correctamente`});
      setIsTipoHabitacionDialogOpen(false);
      setTipoHabitacionForm({ nombre: '', descripcion: '', capacidadMaxPersonas: 2, activo: true });
      loadData();
      setTiposHabitacion(db.nomTiposHabitacion.getAll());
    } catch (error) {
      toast.error('Error al crear el tipo de habitación');
    }
  };

  const toggleHotel = (hotelId: string) => {
    const hotel = hotelesDisponibles.find(h => h.id === hotelId);
    if (!hotel) return;

    const yaSeleccionado = hotelesSeleccionados.find(h => h.hotelId === hotelId);
    
    if (yaSeleccionado) {
      setHotelesSeleccionados(prev => prev.filter(h => h.hotelId !== hotelId));
      setHabitacionesPorHotel(prev => {
        const newHab = { ...prev };
        delete newHab[hotelId];
        return newHab;
      });
    } else {
      const tiposDelHotel = db.hotelTiposHabitacion.getByHotel(hotelId);
      const nuevoHotel: HotelSeleccionado = {
        eventoHotelId: '',
        hotelId,
        hotel,
      };
      
      setHotelesSeleccionados(prev => [...prev, nuevoHotel]);
      
      setHabitacionesPorHotel(prev => ({
        ...prev,
        [hotelId]: tiposDelHotel.map(th => {
          const tipoHabitacion = db.nomTiposHabitacion.getAll().find(t => t.id === th.tipoHabitacionId);
          return {
            tipoHabitacionId: th.tipoHabitacionId,
            tipoHabitacionNombre: tipoHabitacion?.nombre || 'Sin nombre',
            precioCUP: th.precioConDesayuno || 0,
            precioMoneda: th.precioConTodoIncluido || 0,
            moneda: 'USD',
            cupo: 0,
          };
        }),
      }));
    }
  };

  const toggleSalon = (salonId: string) => {
    setSalonesSeleccionados(prev =>
      prev.includes(salonId)
        ? prev.filter(id => id !== salonId)
        : [...prev, salonId]
    );
  };

  const toggleHabitacion = (hotelId: string, tipoHabitacionId: string) => {
    const currentSelected = tiposHabitacionSeleccionados[hotelId] || [];
    const tipoHabitacion = tiposHabitacion.find(t => t.id === tipoHabitacionId);
    
    if (currentSelected.includes(tipoHabitacionId)) {
      setTiposHabitacionSeleccionados(prev => ({
        ...prev,
        [hotelId]: prev[hotelId].filter(id => id !== tipoHabitacionId),
      }));
      setHabitacionesPorHotel(prev => ({
        ...prev,
        [hotelId]: (prev[hotelId] || []).filter(h => h.tipoHabitacionId !== tipoHabitacionId),
      }));
    } else {
      setTiposHabitacionSeleccionados(prev => ({
        ...prev,
        [hotelId]: [...(prev[hotelId] || []), tipoHabitacionId],
      }));
      setHabitacionesPorHotel(prev => ({
        ...prev,
        [hotelId]: [...(prev[hotelId] || []), { 
          tipoHabitacionId, 
          tipoHabitacionNombre: tipoHabitacion?.nombre || '', 
          precioCUP: 0, 
          precioMoneda: 0, 
          moneda: 'USD',
          cupo: 0 
        }],
      }));
    }
  };

  const updateHabitacion = (hotelId: string, tipoId: string, field: keyof HabitacionPrecio, value: any) => {
    setHabitacionesPorHotel(prev => ({
      ...prev,
      [hotelId]: (prev[hotelId] || []).map(h =>
        h.tipoHabitacionId === tipoId ? { ...h, [field]: value } : h
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const eventoId = evento?.id || '';
      
      for (const hotelSel of hotelesSeleccionados) {
        let eventoHotelId = hotelSel.eventoHotelId;
        
        if (!eventoHotelId) {
          const nuevoEventoHotel = db.eventoHoteles.create({
            eventoId,
            hotelId: hotelSel.hotelId,
            fechaCheckin: evento?.startDate || '',
            fechaCheckout: evento?.endDate || '',
          });
          eventoHotelId = nuevoEventoHotel.id;
        }

        db.eventoHotelHabitaciones.deleteByEventoHotel(eventoHotelId);
        
        const habitaciones = habitacionesPorHotel[hotelSel.hotelId] || [];
        const seleccionados = tiposHabitacionSeleccionados[hotelSel.hotelId] || [];
        
        for (const hab of habitaciones) {
          if (seleccionados.includes(hab.tipoHabitacionId)) {
            db.eventoHotelHabitaciones.create({
              eventoHotelId,
              tipoHabitacionId: hab.tipoHabitacionId,
              precioCUP: hab.precioCUP,
              precioMoneda: hab.precioMoneda,
              moneda: hab.moneda as any,
              cupo: hab.cupo,
            });
          }
        }
      }

      for (const salonId of salonesSeleccionados) {
        const existente = db.eventoSalones.getAll().find(
          es => es.eventoId === eventoId && es.salonId === salonId
        );
        if (!existente) {
          db.eventoSalones.create({
            eventoId,
            salonId,
            disponible: true,
          });
        }
      }

      const salonesActuales = db.eventoSalones.getAll().filter(es => es.eventoId === eventoId);
      for (const es of salonesActuales) {
        if (!salonesSeleccionados.includes(es.salonId)) {
          db.eventoSalones.delete(es.id);
        }
      }

      await guardarYContinuar(2, {} as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
      console.error(error);
    }
    setIsSaving(false);
  };

  const filteredHoteles = hotelesDisponibles.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.nombre.toLowerCase().includes(q) || h.ciudad.toLowerCase().includes(q);
    const matchCiudad = !filters.ciudad || filters.ciudad === 'all' || h.ciudad === filters.ciudad;
    const matchEstrellas = !filters.estrellas || filters.estrellas === 'all' || h.categoriaEstrellas === parseInt(filters.estrellas);
    return matchSearch && matchCiudad && matchEstrellas;
  });

  const ciudades = [...new Set(hotelesDisponibles.map(h => h.ciudad))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hoteles, Salones y Habitaciones</CardTitle>
          <CardDescription>
            Configure los hoteles, salones y tipos de habitación para este evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hoteles" className="gap-2">
                <Building2 className="w-4 h-4" />
                Hoteles
                <Badge variant="secondary" className="ml-1">{hotelesSeleccionados.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="salones" className="gap-2">
                <MapPin className="w-4 h-4" />
                Salones
                <Badge variant="secondary" className="ml-1">{salonesSeleccionados.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="habitaciones" className="gap-2">
                <Building2 className="w-4 h-4" />
                Habitaciones
              </TabsTrigger>
            </TabsList>

            {/* Tab Hoteles */}
            <TabsContent value="hoteles" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o ciudad..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filters.ciudad} onValueChange={v => setFilters({ ...filters, ciudad: v })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {ciudades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.estrellas} onValueChange={v => setFilters({ ...filters, estrellas: v })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estrellas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="3">3 Estrellas</SelectItem>
                    <SelectItem value="4">4 Estrellas</SelectItem>
                    <SelectItem value="5">5 Estrellas</SelectItem>
                  </SelectContent>
                </Select>
                {canManageNomencladores && (
                  <Button variant="outline" onClick={() => { setEditingHotel(null); setHotelForm({ nombre: '', descripcion: '', cadenaHotelera: '', categoriaEstrellas: 3, ciudad: '', telefono: '', email: '', activo: true }); setIsHotelDialogOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Crear Hotel
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {filteredHoteles.map(hotel => {
                  const salonesCount = db.salones.getActivosByHotel(hotel.id).length;
                  const habitacionesCount = db.hotelTiposHabitacion.getByHotel(hotel.id).length;
                  const isSelected = hotelesSeleccionados.some(h => h.hotelId === hotel.id);
                  return (
                    <div
                      key={hotel.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleHotel(hotel.id)} 
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1" onClick={() => toggleHotel(hotel.id)}>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{hotel.nombre}</h4>
                            <span className="text-yellow-500">{'⭐'.repeat(hotel.categoriaEstrellas)}</span>
                            {!hotel.activo && <Badge variant="destructive">Inactivo</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3" />
                            {hotel.ciudad}
                            <Phone className="w-3 h-3 ml-2" />
                            {hotel.telefono}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {salonesCount} salones
                            </Badge>
                            <Badge variant="outline">
                              {habitacionesCount} tipos habitación
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant={isSelected ? "default" : "outline"} size="sm" onClick={() => toggleHotel(hotel.id)}>
                            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                          {canManageNomencladores && (
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); openEditHotel(hotel); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteHotel(hotel); }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hotelesSeleccionados.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Hoteles seleccionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {hotelesSeleccionados.map(h => (
                      <Badge key={h.hotelId} variant="default" className="gap-1">
                        {h.hotel.nombre}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); toggleHotel(h.hotelId); }}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab Salones */}
            <TabsContent value="salones" className="space-y-4">
              {hotelesSeleccionados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Seleccione primero hoteles en la pestaña anterior</p>
                </div>
              ) : (
                <>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelesSeleccionados.map(h => (
                        <SelectItem key={h.hotelId} value={h.hotelId}>{h.hotel.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {salonesDisponibles.length} salón(es) disponibles
                    </p>
                    {canManageNomencladores && selectedHotelId && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingSalon(null); setSalonForm({ hotelId: selectedHotelId, codigo: '', nombre: '', descripcion: '', ubicacion: '', capacidadMaxima: 100, estado: 'ACTIVO' }); setIsSalonDialogOpen(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Salón
                      </Button>
                    )}
                  </div>

                  {selectedHotelId && (
                    <div className="space-y-2">
                      {salonesDisponibles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No hay salones configurados para este hotel</p>
                        </div>
                      ) : (
                        salonesDisponibles.map(salon => {
                          const isSelected = salonesSeleccionados.includes(salon.id);
                          return (
                            <div
                              key={salon.id}
                              className={`p-4 rounded-lg border transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                                  : 'hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <Checkbox 
                                  checked={isSelected} 
                                  onCheckedChange={() => toggleSalon(salon.id)} 
                                  className="mt-1"
                                />
                                <div className="flex-1 cursor-pointer" onClick={() => toggleSalon(salon.id)}>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{salon.nombre}</h4>
                                    <Badge variant="outline">{salon.codigo}</Badge>
                                    {salon.estado === 'INACTIVO' && <Badge variant="destructive">Inactivo</Badge>}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {salon.ubicacion || 'Sin ubicación'} • Capacidad: {salon.capacidadMaxima} personas
                                  </p>
                                  {salon.imagenes && salon.imagenes.length > 0 && (
                                    <Badge variant="secondary" className="mt-1 gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      {salon.imagenes.length} imágenes
                                    </Badge>
                                  )}
                                </div>
                                {canManageNomencladores && (
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); openEditSalon(salon); }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteSalon(salon); }}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab Habitaciones */}
            <TabsContent value="habitaciones" className="space-y-4">
              {hotelesSeleccionados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Seleccione primero hoteles en la pestaña de Hoteles</p>
                </div>
              ) : (
                <>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelesSeleccionados.map(h => (
                        <SelectItem key={h.hotelId} value={h.hotelId}>{h.hotel.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {tiposHabitacion.length} tipo(s) de habitación disponibles
                    </p>
                    {canManageNomencladores && selectedHotelId && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingTipoHabitacion(null); setTipoHabitacionForm({ nombre: '', descripcion: '', capacidadMaxPersonas: 2, activo: true }); setIsTipoHabitacionDialogOpen(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Tipo Habitación
                      </Button>
                    )}
                  </div>

                  {selectedHotelId && (
                    <div className="space-y-2">
                      {tiposHabitacion.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No hay tipos de habitación en el nomenclador general</p>
                          <p className="text-xs mt-1">Cree uno nuevo para comenzar</p>
                        </div>
                      ) : (
                        tiposHabitacion.map(tipo => {
                          const isSelected = (tiposHabitacionSeleccionados[selectedHotelId] || []).includes(tipo.id);
                          const habitacion = habitacionesPorHotel[selectedHotelId]?.find(
                            h => h.tipoHabitacionId === tipo.id
                          );
                          return (
                            <div
                              key={tipo.id}
                              className={`p-4 rounded-lg border transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                                  : 'hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <Checkbox 
                                  checked={isSelected} 
                                  onCheckedChange={() => toggleHabitacion(selectedHotelId, tipo.id)} 
                                  className="mt-1"
                                />
                                <div className="flex-1 cursor-pointer" onClick={() => toggleHabitacion(selectedHotelId, tipo.id)}>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{tipo.nombre}</h4>
                                    {tipo.descripcion && (
                                      <span className="text-sm text-muted-foreground">- {tipo.descripcion}</span>
                                    )}
                                    {!tipo.activo && <Badge variant="destructive">Inactivo</Badge>}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Capacidad máxima: {tipo.capacidadMaxPersonas || 2} persona(s)
                                  </p>
                                </div>
                                {canManageNomencladores && (
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); openEditTipoHabitacion(tipo); }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteTipoHabitacion(tipo); }}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {isSelected && (
                                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Precio CUP</Label>
                                    <Input
                                      type="number"
                                      value={habitacion?.precioCUP ?? 0}
                                      onChange={e => updateHabitacion(selectedHotelId, tipo.id, 'precioCUP', parseFloat(e.target.value) || 0)}
                                      onClick={e => e.stopPropagation()}
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Precio (USD/EUR)</Label>
                                    <Input
                                      type="number"
                                      value={habitacion?.precioMoneda ?? 0}
                                      onChange={e => updateHabitacion(selectedHotelId, tipo.id, 'precioMoneda', parseFloat(e.target.value) || 0)}
                                      onClick={e => e.stopPropagation()}
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Cupo</Label>
                                    <Input
                                      type="number"
                                      value={habitacion?.cupo ?? 0}
                                      onChange={e => updateHabitacion(selectedHotelId, tipo.id, 'cupo', parseInt(e.target.value) || 0)}
                                      onClick={e => e.stopPropagation()}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  
                  {selectedHotelId && (tiposHabitacionSeleccionados[selectedHotelId]?.length || 0) > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Tipos de habitación seleccionados:</p>
                      <div className="flex flex-wrap gap-2">
                        {(tiposHabitacionSeleccionados[selectedHotelId] || []).map(tipoId => {
                          const tipo = tiposHabitacion.find(t => t.id === tipoId);
                          return tipo ? (
                            <Badge key={tipoId} variant="default" className="gap-1">
                              {tipo.nombre}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => toggleHabitacion(selectedHotelId, tipoId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>

      <NomenclatorModal
        open={isHotelDialogOpen}
        onOpenChange={setIsHotelDialogOpen}
        type="hotel"
        mode={editingHotel ? 'edit' : 'create'}
        formData={hotelForm}
        onFormChange={setHotelForm as (data: any) => void}
        errors={hotelErrors}
        onSave={handleSaveHotel}
        onDelete={editingHotel ? () => handleDeleteHotel(editingHotel) : undefined}
        similarItems={findSimilarItems(
          editingHotel 
            ? hotelesDisponibles.filter(h => h.id !== editingHotel.id) 
            : hotelesDisponibles, 
          hotelForm.nombre, 
          h => h.nombre, 
          0.5
        ).map(s => s.item.nombre)}
      />

      <NomenclatorModal
        open={isSalonDialogOpen}
        onOpenChange={setIsSalonDialogOpen}
        type="salon"
        mode={editingSalon ? 'edit' : 'create'}
        formData={salonForm}
        onFormChange={setSalonForm as (data: any) => void}
        errors={salonErrors}
        onSave={(data) => {
          const salonData = { ...data, hotelId: editingSalon?.hotelId || salonForm.hotelId };
          handleSaveSalon(salonData);
        }}
        onDelete={editingSalon ? () => handleDeleteSalon(editingSalon) : undefined}
        similarItems={findSimilarItems(
          editingSalon 
            ? salonesDisponibles.filter(s => s.id !== editingSalon.id) 
            : salonesDisponibles, 
          salonForm.codigo, 
          s => s.codigo, 
          0.5
        ).map(s => s.item.codigo)}
      />

      <NomenclatorModal
        open={isTipoHabitacionDialogOpen}
        onOpenChange={setIsTipoHabitacionDialogOpen}
        type="tipoHabitacion"
        mode={editingTipoHabitacion ? 'edit' : 'create'}
        formData={tipoHabitacionForm}
        onFormChange={setTipoHabitacionForm as (data: any) => void}
        errors={tipoHabitacionErrors}
        onSave={handleSaveTipoHabitacion}
        onDelete={editingTipoHabitacion ? () => handleDeleteTipoHabitacion(editingTipoHabitacion) : undefined}
        similarItems={findSimilarItems(
          editingTipoHabitacion 
            ? tiposHabitacion.filter(t => t.id !== editingTipoHabitacion.id) 
            : tiposHabitacion, 
          tipoHabitacionForm.nombre, 
          t => t.nombre, 
          0.5
        ).map(s => s.item.nombre)}
      />

      {!canManageNomencladores && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          Solo los administradores pueden crear nomencladores
        </div>
      )}

    </div>
  );
}

export default HotelesStep;
