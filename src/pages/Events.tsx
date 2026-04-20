import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { db, Event, MacroEvent, EventSession, FormField, SessionAttendance, SubEvento } from '@/lib/database';
import { normalizeText, isDuplicate } from '@/lib/utils';
import {
  Plus, Calendar, Users, FileText, Pencil, Trash2, Settings2, Mail, Image, Palette,
  ArrowLeft, Wand2, Award, IdCard, Search, Eye, Clock, CheckSquare, Layers, CalendarDays, ChevronRight, Filter,
  Hotel, Ticket, MapPin
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUploader } from '@/components/ImageUploader';
import { FormBuilderWithPreview } from '@/components/formBuilder/FormBuilderWithPreview';
import { EmailTemplateManager } from '@/components/EmailTemplateManager';
import { JuryAssignment } from '@/components/JuryAssignment';
import { CertificateManager } from '@/components/CertificateManager';
import { CredentialsManager } from '@/components/CredentialsManager';
import EventContentEditor from '@/components/EventContentEditor';
import { SubEventoFormModal } from '@/components/SubEventos/SubEventoFormModal';
import { toast } from 'sonner';
import { ConfirmationDialog, SuccessDialog } from '@/components/ui/ConfirmationDialog';

type ViewMode = 'list' | 'macro-detail' | 'event-detail' | 'form-builder' | 'email-templates' | 'jury-assignment' | 'certificates' | 'credentials' | 'attendance';

// Default registration fields for macro event config
const defaultRegistrationFields = [
  { id: 'name', label: 'Nombre(s) y Apellidos', type: 'text', required: true, enabled: true },
  { id: 'idDocument', label: 'Carné de Identidad / Pasaporte', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
  { id: 'phone', label: 'Teléfono', type: 'tel', required: false, enabled: true },
  { id: 'country', label: 'País', type: 'select', required: true, enabled: true },
  { id: 'affiliation', label: 'Afiliación', type: 'select', required: true, enabled: true },
  { id: 'affiliationType', label: 'Tipo de Afiliación', type: 'select', required: true, enabled: true },
  { id: 'economicSector', label: 'Sector Económico', type: 'select', required: true, enabled: true },
  { id: 'participationType', label: 'Tipo de Participación', type: 'select', required: true, enabled: true },
  { id: 'scientificLevel', label: 'Nivel Científico', type: 'select', required: false, enabled: true },
  { id: 'educationalLevel', label: 'Nivel Educacional', type: 'select', required: true, enabled: true },
  { id: 'gender', label: 'Género', type: 'radio', required: true, enabled: true },
  { id: 'profilePhoto', label: 'Foto de Perfil', type: 'file', required: false, enabled: true },
];

export default function Events() {
  const { user: currentUser, isSuperAdmin, isAdmin, isAdminReceptivo, isAdminEmpresa, isCoordinadorHotel, isLector } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMacro, setSelectedMacro] = useState<MacroEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Data
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [subEventos, setSubEventos] = useState<SubEvento[]>([]);

  // Dialogs
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubeventoModalOpen, setIsSubeventoModalOpen] = useState(false);
  const [editingSubeventoId, setEditingSubeventoId] = useState<string | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);

  // Search
  const [macroSearch, setMacroSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  // Forms
  const [eventForm, setEventForm] = useState({
    name: '', nameEn: '', description: '', macroEventId: '',
    bannerImageUrl: '', backgroundImageUrl: '',
  });
  const [sessionForm, setSessionForm] = useState({ eventId: '', date: '', startTime: '', endTime: '' });
  const [activeEventTab, setActiveEventTab] = useState('basic');
  const [activeDetailTab, setActiveDetailTab] = useState('info');

  // Asignacion dialogs
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isSalonDialogOpen, setIsSalonDialogOpen] = useState(false);
  const [isActividadDialogOpen, setIsActividadDialogOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [selectedSalonIds, setSelectedSalonIds] = useState<string[]>([]);
  const [actividadForm, setActividadForm] = useState({
    nombre: '', descripcion: '', fecha: '', precio: 0, moneda: 'USD',
    incluyeTransporte: false, incluyeComida: false, capacidad: 0, lugar: '',
  });

  // Sub-views
  const [formBuilderType] = useState<'event'>('event');
  const [attendanceSession, setAttendanceSession] = useState<EventSession | null>(null);
  const [attendanceData, setAttendanceData] = useState<SessionAttendance[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    loadAll(); 
    
    const handleDataChange = () => {
      loadAll();
    };
    
    window.addEventListener('sge-data-change', handleDataChange);
    return () => window.removeEventListener('sge-data-change', handleDataChange);
  }, [currentUser?.id]);

  const loadAll = () => {
    let allMacros = db.macroEvents.getAll();
    let allEvents = db.events.getAll();

    // Data isolation per permission matrix
    if (currentUser) {
      if (currentUser.role === 'ADMIN_RECEPTIVO' || currentUser.role === 'LECTOR_RECEPTIVO') {
        allMacros = allMacros.filter(me => !(me as any).receptivoId || (me as any).receptivoId === currentUser.receptivoId);
        allEvents = allEvents.filter(e => {
          const macro = allMacros.find(m => m.id === e.macroEventId);
          return !!macro;
        });
      } else if (currentUser.role === 'ADMIN_EMPRESA' || currentUser.role === 'LECTOR_EMPRESA') {
        allMacros = allMacros.filter(me => !(me as any).empresaId || (me as any).empresaId === currentUser.empresaId);
        allEvents = allEvents.filter(e => {
          const macro = allMacros.find(m => m.id === e.macroEventId);
          return !!macro;
        });
      }
      // COORDINADOR_HOTEL ve todos los eventos (como SuperAdmin)
    }

    setMacroEvents(allMacros);
    setEvents(allEvents);
    setSessions(db.eventSessions.getAll());
    setSubEventos(db.subEventos.getAll());
    setIsLoading(false);
  };

  const canEdit = !isLector && !isCoordinadorHotel;
  const canCreate = isSuperAdmin || isAdmin || isAdminReceptivo || isAdminEmpresa || isCoordinadorHotel;

  // ===== MACRO EVENT HANDLERS =====

  const handleDeleteMacro = async (me: MacroEvent) => {
    if (me.isActive) { toast.error('Solo se puede eliminar eventos inactivos'); return; }
    const confirmed = await ConfirmationDialog.show({
      title: 'Eliminar Evento',
      description: '¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (confirmed) {
      db.macroEvents.delete(me.id);
      await SuccessDialog.show({
        title: '¡Eliminado!',
        description: 'Evento eliminado correctamente.',
        autoClose: 2000,
      });
      loadAll();
    }
  };

  const toggleMacroStatus = (me: MacroEvent) => {
    db.macroEvents.update(me.id, { isActive: !me.isActive });
    loadAll();
    if (selectedMacro?.id === me.id) setSelectedMacro(db.macroEvents.getById(me.id) || null);
  };

  const openMacroDetail = (me: MacroEvent) => { setSelectedMacro(me); setViewMode('macro-detail'); };

  // ===== SIMPLE EVENT HANDLERS =====
  const openCreateEvent = (macroId?: string) => {
    setEditingEvent(null);
    setEventForm({ name: '', nameEn: '', description: '', macroEventId: macroId || '', bannerImageUrl: '', backgroundImageUrl: '' });
    setActiveEventTab('basic');
    setIsEventDialogOpen(true);
  };

  const openEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name, nameEn: event.nameEn || '', description: event.description,
      macroEventId: event.macroEventId,
      bannerImageUrl: event.bannerImageUrl, backgroundImageUrl: event.backgroundImageUrl || '',
    });
    setActiveEventTab('basic');
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.name || !eventForm.macroEventId) {
      toast.error('Completa los campos obligatorios'); return;
    }
    const macro = db.macroEvents.getById(eventForm.macroEventId);
    if (!macro) { toast.error('Evento no encontrado'); return; }

    const eventosDelMacro = db.events.getAll().filter(e => e.macroEventId === eventForm.macroEventId);
    const duplicado = eventosDelMacro.find(e => normalizeText(e.name) === normalizeText(eventForm.name) && (!editingEvent || e.id !== editingEvent.id));
    if (duplicado) {
      toast.error(`Ya existe un Sub Evento con el nombre "${duplicado.name}" en este evento`);
      return;
    }

    try {
      const colors = {
        primaryColor: (macro as any).primaryColor || '#1e40af',
        secondaryColor: (macro as any).secondaryColor || '#059669',
        backgroundColor: (macro as any).backgroundColor || '#f0f9ff',
      };
      if (editingEvent) {
        db.events.update(editingEvent.id, { ...eventForm, ...colors, startDate: macro.startDate, endDate: macro.endDate });
        toast.success('Sub Evento actualizado');
      } else {
        db.events.create({ ...eventForm, ...colors, isActive: false, createdBy: '4', startDate: macro.startDate, endDate: macro.endDate } as any);
        toast.success('Sub Evento creado (estado: Inactivo)');
      }
      setIsEventDialogOpen(false);
      loadAll();
      if (editingEvent && selectedEvent?.id === editingEvent.id) setSelectedEvent(db.events.getById(editingEvent.id) || null);
    } catch (e: any) { toast.error(e.message || 'Error al guardar'); }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (event.isActive) { toast.error('Solo se puede eliminar eventos inactivos'); return; }
    const confirmed = await ConfirmationDialog.show({
      title: 'Eliminar Sub Evento',
      description: '¿Está seguro de que desea eliminar este Sub Evento? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (confirmed) {
      db.events.delete(event.id);
      await SuccessDialog.show({
        title: '¡Eliminado!',
        description: 'Sub Evento eliminado correctamente.',
        autoClose: 2000,
      });
      loadAll();
    }
  };

  const toggleEventStatus = (event: Event) => {
    if (!event.isActive) {
      const sesCount = db.eventSessions.getByEvent(event.id).length;
      if (sesCount === 0) { toast.error('El evento necesita al menos una sesión para activarse'); return; }
    }
    db.events.update(event.id, { isActive: !event.isActive });
    loadAll();
  };

  const openEventDetail = (event: Event) => { setSelectedEvent(event); setViewMode('event-detail'); };

  // ===== SESSION HANDLERS =====
  const openCreateSession = (eventId?: string) => {
    setEditingSession(null);
    setSessionForm({ eventId: eventId || '', date: '', startTime: '', endTime: '' });
    setIsSessionDialogOpen(true);
  };

  const openEditSession = (session: EventSession) => {
    setEditingSession(session);
    setSessionForm({ eventId: session.eventId, date: session.date, startTime: session.startTime, endTime: session.endTime });
    setIsSessionDialogOpen(true);
  };

  const handleSaveSession = () => {
    if (!sessionForm.eventId || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Completa todos los campos'); return;
    }
    if (sessionForm.endTime <= sessionForm.startTime) { toast.error('La hora de fin debe ser posterior a la de inicio'); return; }
    const event = db.events.getById(sessionForm.eventId);
    if (event) {
      const macro = db.macroEvents.getById(event.macroEventId);
      if (macro) {
        const sD = new Date(sessionForm.date), mS = new Date(macro.startDate.split('T')[0]), mE = new Date(macro.endDate.split('T')[0]);
        if (sD < mS || sD > mE) { toast.error('La fecha de la sesión debe estar dentro del rango del Evento'); return; }
      }
    }
    try {
      if (editingSession) { db.eventSessions.update(editingSession.id, sessionForm); toast.success('Sesión actualizada'); }
      else { db.eventSessions.create({ ...sessionForm, isActive: true }); toast.success('Sesión creada'); }
      setIsSessionDialogOpen(false);
      loadAll();
    } catch (e: any) { toast.error(e.message || 'Error'); }
  };

  const handleDeleteSession = async (session: EventSession) => {
    const confirmed = await ConfirmationDialog.show({
      title: 'Eliminar Sesión',
      description: '¿Está seguro de que desea eliminar esta sesión? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (confirmed) {
      db.eventSessions.delete(session.id);
      await SuccessDialog.show({
        title: '¡Eliminado!',
        description: 'Sesión eliminada correctamente.',
        autoClose: 2000,
      });
      loadAll();
    }
  };

  // ===== ATTENDANCE =====
  const openAttendance = (session: EventSession) => {
    setAttendanceSession(session);
    setAttendanceData(db.sessionAttendance.getBySession(session.id));
    setViewMode('attendance');
  };

  const toggleAttendance = (userId: string) => {
    if (!attendanceSession) return;
    const event = db.events.getById(attendanceSession.eventId);
    if (!event || !event.isActive) { toast.error('El evento debe estar activo'); return; }
    if (!attendanceSession.isActive) { toast.error('La sesión debe estar activa'); return; }
    const existing = attendanceData.find(a => a.userId === userId);
    const newVal = existing ? !existing.attended : true;
    db.sessionAttendance.markAttendance(attendanceSession.id, attendanceSession.eventId, userId, newVal);
    setAttendanceData(db.sessionAttendance.getBySession(attendanceSession.id));
  };

  const toggleAllAttendance = (users: { id: string }[], markAll: boolean) => {
    if (!attendanceSession) return;
    const event = db.events.getById(attendanceSession.eventId);
    if (!event || !event.isActive || !attendanceSession.isActive) return;
    users.forEach(user => db.sessionAttendance.markAttendance(attendanceSession.id, attendanceSession.eventId, user.id, markAll));
    setAttendanceData(db.sessionAttendance.getBySession(attendanceSession.id));
  };

  // ===== SUB-VIEW HANDLERS (now at macro level) =====
  const openFormBuilder = () => { setViewMode('form-builder'); };
  const openEmailTemplates = () => { setViewMode('email-templates'); };
  const openJuryAssignment = () => { setViewMode('jury-assignment'); };
  const openCertificates = () => { setViewMode('certificates'); };
  const openCredentials = () => { setViewMode('credentials'); };

  const handleSaveFormFields = (fields: FormField[]) => {
    if (selectedMacro) {
      const macroEventsList = events.filter(e => e.macroEventId === selectedMacro.id);
      macroEventsList.forEach(ev => db.events.updateFormFields(ev.id, fields));
      db.macroEvents.update(selectedMacro.id, { registrationFields: fields } as any);
      loadAll();
    }
  };

  const goBackToMacroDetail = () => {
    if (selectedMacro) setSelectedMacro(db.macroEvents.getById(selectedMacro.id) || selectedMacro);
    setSelectedEvent(null);
    setViewMode('macro-detail');
  };

  const goBackToEventDetail = () => {
    if (selectedEvent) setSelectedEvent(db.events.getById(selectedEvent.id) || selectedEvent);
    setViewMode('event-detail');
    setAttendanceSession(null);
  };

  const goBackToList = () => {
    setViewMode('list');
    setSelectedMacro(null);
    setSelectedEvent(null);
    setAttendanceSession(null);
  };

  // ===== HELPERS =====
  const getSimpleEventCount = (macroId: string) => events.filter(e => e.macroEventId === macroId).length;
  const getSessionCount = (eventId: string) => sessions.filter(s => s.eventId === eventId).length;
  const getEventName = (eventId: string) => db.events.getById(eventId)?.name || 'Sin evento';

  const filteredMacros = macroEvents.filter(me => {
    const q = macroSearch.toLowerCase();
    if (!q) return true;
    return me.name.toLowerCase().includes(q) || me.acronym.toLowerCase().includes(q) || me.description.toLowerCase().includes(q);
  });

  const filteredEvents = (macroId: string) => {
    const macroEvts = events.filter(e => e.macroEventId === macroId);
    const q = eventSearch.toLowerCase();
    if (!q) return macroEvts;
    return macroEvts.filter(e =>
      e.name.toLowerCase().includes(q) || (e.nameEn || '').toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    );
  };

  // ===== BREADCRUMB =====
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <button onClick={goBackToList} className="hover:text-foreground transition-colors">Eventos</button>
      {selectedMacro && (
        <>
          <ChevronRight className="h-3 w-3" />
          <button onClick={goBackToMacroDetail} className="hover:text-foreground transition-colors truncate max-w-[200px]">
            {selectedMacro.name}
          </button>
        </>
      )}
      {selectedEvent && viewMode !== 'macro-detail' && (
        <>
          <ChevronRight className="h-3 w-3" />
          <button onClick={goBackToEventDetail} className="hover:text-foreground transition-colors truncate max-w-[200px]">
            {selectedEvent.name}
          </button>
        </>
      )}
    </div>
  );

  // ===== ALL DIALOGS =====
  const renderDialogs = () => (
    <>
      {/* SIMPLE EVENT DIALOG */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Sub Evento' : 'Crear Sub Evento'}</DialogTitle>
            <DialogDescription>Sub Evento o componente del Evento principal</DialogDescription>
          </DialogHeader>
          {/* Solo información básica y descripción simple */}
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Nombre en Español *</Label><Input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nombre en Inglés</Label><Input value={eventForm.nameEn} onChange={e => setEventForm({ ...eventForm, nameEn: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Descripción General</Label>
              <Textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={3} placeholder="Descripción general del Sub Evento..." />
            </div>
            <div className="space-y-2">
              <Label>Evento *</Label>
              <Select value={eventForm.macroEventId} onValueChange={v => setEventForm({ ...eventForm, macroEventId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar evento padre" /></SelectTrigger>
                <SelectContent>
                  {macroEvents.filter(me => me.isActive).map(me => (
                    <SelectItem key={me.id} value={me.id}>{me.name} ({me.acronym})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSaveEvent}>{editingEvent ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SESSION DIALOG */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Editar Sesión' : 'Crear Sesión'}</DialogTitle>
            <DialogDescription>Sesión o ocurrencia temporal del Sub Evento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sub Evento *</Label>
              <Select value={sessionForm.eventId} onValueChange={v => setSessionForm({ ...sessionForm, eventId: v })} disabled={!!editingSession || !!selectedEvent}>
                <SelectTrigger><SelectValue placeholder="Seleccionar evento" /></SelectTrigger>
                <SelectContent>
                  {(selectedEvent ? [selectedEvent] : events).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={sessionForm.date} onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Hora Inicio *</Label><Input type="time" value={sessionForm.startTime} onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora Fin *</Label><Input type="time" value={sessionForm.endTime} onChange={e => setSessionForm({ ...sessionForm, endTime: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSaveSession}>{editingSession ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASIGNAR HOTEL DIALOG */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar Hotel</DialogTitle>
            <DialogDescription>Seleccione un hotel para este evento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {db.nomHoteles.getAll().filter(h => h.activo && !db.eventoHoteles.getByEvento(selectedMacro?.id || '').some(eh => eh.hotelId === h.id)).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Todos los hoteles disponibles ya están asignados</p>
            ) : (
              db.nomHoteles.getAll().filter(h => h.activo && !db.eventoHoteles.getByEvento(selectedMacro?.id || '').some(eh => eh.hotelId === h.id)).map(hotel => (
                <div key={hotel.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => {
                  db.eventoHoteles.create({
                    eventoId: selectedMacro?.id || '',
                    hotelId: hotel.id,
                    fechaCheckin: selectedMacro?.startDate || '',
                    fechaCheckout: selectedMacro?.endDate || '',
                  });
                  setIsHotelDialogOpen(false);
                  setSelectedMacro(db.macroEvents.getById(selectedMacro?.id || ''));
                  toast.success('Hotel asignado');
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{hotel.nombre}</p>
                      <p className="text-sm text-muted-foreground">{hotel.ciudad}</p>
                    </div>
                    <Badge>{hotel.categoriaEstrellas} estrellas</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotelDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASIGNAR SALON DIALOG */}
      <Dialog open={isSalonDialogOpen} onOpenChange={setIsSalonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar Salon</DialogTitle>
            <DialogDescription>Seleccione salones disponibles</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {db.salones.getAll().filter(s => s.estado === 'ACTIVO' && !db.eventoSalones.getByEvento(selectedMacro?.id || '').some(es => es.salonId === s.id)).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Todos los salones disponibles ya están asignados</p>
            ) : (
              db.salones.getAll().filter(s => s.estado === 'ACTIVO' && !db.eventoSalones.getByEvento(selectedMacro?.id || '').some(es => es.salonId === s.id)).map(salon => {
                const hotel = db.nomHoteles.getById(salon.hotelId);
                return (
                  <div key={salon.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => {
                    db.eventoSalones.create({
                      eventoId: selectedMacro?.id || '',
                      salonId: salon.id,
                      disponible: true,
                    });
                    setIsSalonDialogOpen(false);
                    setSelectedMacro(db.macroEvents.getById(selectedMacro?.id || ''));
                    toast.success('Salón asignado');
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{salon.nombre}</p>
                        <p className="text-sm text-muted-foreground">{hotel?.nombre || 'Sin hotel'} - {salon.ubicacion}</p>
                      </div>
                      <Badge variant="outline">Cap: {salon.capacidadMaxima}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalonDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NUEVA ACTIVIDAD SOCIAL DIALOG */}
      <Dialog open={isActividadDialogOpen} onOpenChange={setIsActividadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Actividad Social</DialogTitle>
            <DialogDescription>Configure los datos de la actividad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={actividadForm.nombre} onChange={e => setActividadForm({ ...actividadForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={actividadForm.descripcion} onChange={e => setActividadForm({ ...actividadForm, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={actividadForm.fecha} onChange={e => setActividadForm({ ...actividadForm, fecha: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Lugar</Label>
                <Input value={actividadForm.lugar} onChange={e => setActividadForm({ ...actividadForm, lugar: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input type="number" value={actividadForm.precio} onChange={e => setActividadForm({ ...actividadForm, precio: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={actividadForm.moneda} onValueChange={v => setActividadForm({ ...actividadForm, moneda: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CUP">CUP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input type="number" value={actividadForm.capacidad} onChange={e => setActividadForm({ ...actividadForm, capacidad: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="transporte" checked={actividadForm.incluyeTransporte} onCheckedChange={v => setActividadForm({ ...actividadForm, incluyeTransporte: !!v })} />
                <Label htmlFor="transporte">Incluye Transporte</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="comida" checked={actividadForm.incluyeComida} onCheckedChange={v => setActividadForm({ ...actividadForm, incluyeComida: !!v })} />
                <Label htmlFor="comida">Incluye Comida</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActividadDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={() => {
              if (!actividadForm.nombre) { toast.error('El nombre es obligatorio'); return; }
              db.actividadesSociales.create({
                eventoId: selectedMacro?.id || '',
                nombre: actividadForm.nombre,
                descripcion: actividadForm.descripcion,
                fecha: actividadForm.fecha,
                horaInicio: '',
                horaFin: '',
                puntoEncuentro: actividadForm.lugar,
                horaEncuentro: '',
                destino: '',
                direccionExacta: '',
                esGratuita: false,
                costo: {
                  CUP: 0,
                  moneda: actividadForm.precio,
                  monedaSeleccionada: actividadForm.moneda as 'CUP' | 'USD' | 'EUR',
                },
                cupoMaximo: actividadForm.capacidad,
                cupoMinimo: 0,
                fechaLimiteReserva: '',
                requiereTransporte: actividadForm.incluyeTransporte,
                guiaIncluido: false,
                imagenes: [],
                estado: 'ACTIVO',
              });
              setIsActividadDialogOpen(false);
              setActividadForm({ nombre: '', descripcion: '', fecha: '', precio: 0, moneda: 'USD', incluyeTransporte: false, incluyeComida: false, capacidad: 0, lugar: '' });
              setSelectedMacro(db.macroEvents.getById(selectedMacro?.id || ''));
              toast.success('Actividad creada');
            }}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Unificado de SubEventos - Componente Reutilizable */}
      <SubEventoFormModal
        isOpen={isSubeventoModalOpen}
        onClose={() => {
          setIsSubeventoModalOpen(false);
          setEditingSubeventoId(null);
        }}
        onSuccess={() => {
          loadAll();
          setIsSubeventoModalOpen(false);
          setEditingSubeventoId(null);
        }}
        evento={selectedMacro}
        subeventoId={editingSubeventoId}
      />
    </>
  );

  // ===== ATTENDANCE VIEW =====
  if (viewMode === 'attendance' && attendanceSession) {
    const users = db.users.getAll();
    const event = db.events.getById(attendanceSession.eventId);
    const isEditable = attendanceSession.isActive && event?.isActive;
    const allAttended = users.length > 0 && users.every(u => attendanceData.find(a => a.userId === u.id)?.attended);
    const someAttended = users.some(u => attendanceData.find(a => a.userId === u.id)?.attended);
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Registro de Asistencia</h1>
              <p className="text-muted-foreground">
                {getEventName(attendanceSession.eventId)} — {attendanceSession.date} ({attendanceSession.startTime} - {attendanceSession.endTime})
              </p>
            </div>
            <Button variant="outline" onClick={goBackToEventDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {!isEditable && (
            <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">⚠️ Solo lectura — el evento o la sesión están inactivos.</div>
          )}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Afiliación</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Checkbox
                        checked={allAttended}
                        ref={(el) => { if (el) (el as any).indeterminate = someAttended && !allAttended; }}
                        onCheckedChange={(checked) => { if (isEditable) toggleAllAttendance(users, !!checked); }}
                        disabled={!isEditable}
                      />
                      <span>Asistió</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const att = attendanceData.find(a => a.userId === user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.affiliation}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox checked={att?.attended || false} onCheckedChange={() => isEditable && toggleAttendance(user.id)} disabled={!isEditable} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  // ===== FORM BUILDER VIEW (at macro level) =====
  if (viewMode === 'form-builder' && selectedMacro) {
    // Use first event of macro as reference for the form builder
    const macroEvts = events.filter(e => e.macroEventId === selectedMacro.id);
    const refEvent = macroEvts[0];
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Formulario de Inscripción</h1>
              <p className="text-muted-foreground">{selectedMacro.name}</p>
            </div>
            <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {refEvent ? (
            <FormBuilderWithPreview
              eventId={refEvent.id}
              event={refEvent}
              initialFields={(selectedMacro as any)?.registrationFields || refEvent.formFields || defaultRegistrationFields}
              onSave={handleSaveFormFields}
              type="event"
            />
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Crea al menos un Sub Evento en este Evento para configurar el formulario de inscripción.
            </Card>
          )}
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  if (viewMode === 'email-templates' && selectedMacro) {
    const refEvent = events.find(e => e.macroEventId === selectedMacro.id);
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-display font-bold">Plantillas de Email</h1><p className="text-muted-foreground">{selectedMacro.name}</p></div>
            <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {refEvent ? <EmailTemplateManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un Sub Evento primero.</Card>}
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  if (viewMode === 'jury-assignment' && selectedMacro) {
    const refEvent = events.find(e => e.macroEventId === selectedMacro.id);
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-display font-bold">Asignación de Jurados</h1><p className="text-muted-foreground">{selectedMacro.name}</p></div>
            <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {refEvent ? <JuryAssignment event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un Sub Evento primero.</Card>}
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  if (viewMode === 'certificates' && selectedMacro) {
    const refEvent = events.find(e => e.macroEventId === selectedMacro.id);
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-display font-bold">Gestión de Certificados</h1><p className="text-muted-foreground">{selectedMacro.name}</p></div>
            <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {refEvent ? <CertificateManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un Sub Evento primero.</Card>}
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  if (viewMode === 'credentials' && selectedMacro) {
    const refEvent = events.find(e => e.macroEventId === selectedMacro.id);
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-display font-bold">Gestión de Credenciales</h1><p className="text-muted-foreground">{selectedMacro.name}</p></div>
            <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </div>
          {refEvent ? <CredentialsManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un Sub Evento primero.</Card>}
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  // ===== EVENT DETAIL VIEW (Sessions inside) =====
  if (viewMode === 'event-detail' && selectedEvent) {
    const eventSessions = sessions.filter(s => s.eventId === selectedEvent.id);
    const macro = db.macroEvents.getById(selectedEvent.macroEventId);
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">{selectedEvent.name}</h1>
              <p className="text-muted-foreground">{selectedEvent.nameEn} · {macro?.name || ''}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEditEvent(selectedEvent)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
              <Button variant="outline" onClick={goBackToMacroDetail}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
            </div>
          </div>

          {/* Description */}
          {selectedEvent.description && (
            <Card className="p-4">
              <Label className="text-sm font-semibold mb-2 block">Descripción General</Label>
              <p className="text-sm text-muted-foreground">{selectedEvent.description.replace(/<[^>]*>/g, '').substring(0, 300)}</p>
            </Card>
          )}

          {/* Event info summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{eventSessions.length}</p>
              <p className="text-sm text-muted-foreground">Sesiones</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex justify-center">
                <Switch checked={selectedEvent.isActive} onCheckedChange={() => {
                  toggleEventStatus(selectedEvent);
                  const refreshed = db.events.getById(selectedEvent.id);
                  if (refreshed) setSelectedEvent(refreshed);
                }} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{selectedEvent.isActive ? 'Activo' : 'Inactivo'}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: selectedEvent.primaryColor }}>■</p>
              <p className="text-sm text-muted-foreground">Color Principal</p>
            </Card>
          </div>

          {/* Sessions table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sesiones</CardTitle>
              <Button variant="hero" size="sm" onClick={() => openCreateSession(selectedEvent.id)}>
                <Plus className="h-4 w-4" />Nueva Sesión
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora Inicio</TableHead>
                    <TableHead>Hora Fin</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventSessions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay sesiones. Crea una para poder activar el evento.</TableCell></TableRow>
                  ) : eventSessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.startTime}</TableCell>
                      <TableCell>{session.endTime}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={session.isActive} onCheckedChange={() => {
                          db.eventSessions.update(session.id, { isActive: !session.isActive });
                          loadAll();
                        }} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openAttendance(session)} title="Asistencia"><CheckSquare className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditSession(session)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  // ===== MACRO DETAIL VIEW =====
  if (viewMode === 'macro-detail' && selectedMacro) {
    const macroEvts = filteredEvents(selectedMacro.id);
    const refEvent = macroEvts[0];
    
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">{selectedMacro.name}</h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mr-2">{selectedMacro.acronym}</Badge>
                {new Date(selectedMacro.startDate).toLocaleDateString('es-ES')} — {new Date(selectedMacro.endDate).toLocaleDateString('es-ES')}
                <Switch className="ml-4 inline-flex" checked={selectedMacro.isActive} onCheckedChange={() => {
                  toggleMacroStatus(selectedMacro);
                  const refreshed = db.macroEvents.getById(selectedMacro.id);
                  if (refreshed) setSelectedMacro(refreshed);
                }} />
                <span className="ml-2 text-sm">{selectedMacro.isActive ? 'Activo' : 'Inactivo'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/events/wizard/${selectedMacro.id}`)}><Wand2 className="h-4 w-4 mr-2" />Editar en Wizard</Button>
              <Button variant="outline" onClick={goBackToList}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
            </div>
          </div>

          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info"><FileText className="h-4 w-4 mr-1" />Info</TabsTrigger>
              <TabsTrigger value="subeventos"><Layers className="h-4 w-4 mr-1" />Sub Eventos</TabsTrigger>
              <TabsTrigger value="herramientas"><Settings2 className="h-4 w-4 mr-1" />Herramientas</TabsTrigger>
            </TabsList>

            {/* TAB: INFO */}
            <TabsContent value="info" className="space-y-4">
              {selectedMacro.description && (
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Descripción</h3>
                  <p className="text-sm text-muted-foreground">{selectedMacro.description}</p>
                </Card>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold">{macroEvts.length}</p>
                  <p className="text-sm text-muted-foreground">Sub Eventos</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold">{sessions.filter(s => macroEvts.some(e => e.id === s.eventId)).length}</p>
                  <p className="text-sm text-muted-foreground">Sesiones</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold">{db.actividadesSociales.getByEvento(selectedMacro.id).length}</p>
                  <p className="text-sm text-muted-foreground">Actividades</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold">{db.eventoHoteles.getByEvento(selectedMacro.id).length}</p>
                  <p className="text-sm text-muted-foreground">Hoteles</p>
                </Card>
              </div>
            </TabsContent>

            {/* TAB: SUB EVENTOS */}
            <TabsContent value="subeventos" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Sub Eventos</CardTitle>
                  <Button variant="hero" size="sm" onClick={() => { setEditingSubeventoId(null); setIsSubeventoModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Nuevo Sub Evento
                  </Button>
                </CardHeader>
                <CardContent>
                  {subEventos.filter(se => se.eventoId === selectedMacro.id).length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No hay Sub Eventos</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Temáticas</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subEventos.filter(se => se.eventoId === selectedMacro.id).map(sub => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.nombre}</TableCell>
                            <TableCell><Badge variant="outline">{sub.tipo}</Badge></TableCell>
                            <TableCell>{sub.tematicaIds?.length || 0}</TableCell>
                            <TableCell><Switch checked={sub.isActive} onCheckedChange={() => {
                              db.subEventos.update(sub.id, { isActive: !sub.isActive });
                              setSubEventos(db.subEventos.getAll());
                            }} /></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingSubeventoId(sub.id); setIsSubeventoModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: HERRAMIENTAS */}
            <TabsContent value="herramientas" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={openFormBuilder}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <Settings2 className="h-8 w-8 text-primary" />
                    <span className="font-medium">Formularios</span>
                    <span className="text-xs text-muted-foreground">Inscripción</span>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={openEmailTemplates}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <Mail className="h-8 w-8 text-primary" />
                    <span className="font-medium">Emails</span>
                    <span className="text-xs text-muted-foreground">Plantillas</span>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={openJuryAssignment}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <Wand2 className="h-8 w-8 text-primary" />
                    <span className="font-medium">Jurados</span>
                    <span className="text-xs text-muted-foreground">Asignación</span>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={openCertificates}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <Award className="h-8 w-8 text-primary" />
                    <span className="font-medium">Certificados</span>
                    <span className="text-xs text-muted-foreground">Gestión</span>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={openCredentials}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <IdCard className="h-8 w-8 text-primary" />
                    <span className="font-medium">Credenciales</span>
                    <span className="text-xs text-muted-foreground">Gestión</span>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {renderDialogs()}
      </DashboardLayout>
    );
  }

  // ===== MAIN LIST VIEW (Macro Events) =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Gestión de Eventos</h1>
          <p className="text-muted-foreground mt-1">Eventos y Sub Eventos</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar eventos..." value={macroSearch} onChange={e => setMacroSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="hero" onClick={() => navigate('/events/wizard')}><Plus className="h-4 w-4" />Nuevo Evento</Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Siglas</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead className="text-center">Sub Eventos</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacros.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay eventos</TableCell></TableRow>
              ) : filteredMacros.map(me => (
                <TableRow key={me.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openMacroDetail(me)}>
                  <TableCell className="font-medium">{me.name}</TableCell>
                  <TableCell><Badge variant="outline">{me.acronym}</Badge></TableCell>
                  <TableCell>{new Date(me.startDate).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>{new Date(me.endDate).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="text-center">{getSimpleEventCount(me.id)}</TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <Switch checked={me.isActive} onCheckedChange={() => toggleMacroStatus(me)} />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openMacroDetail(me)} title="Ver detalle"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/events/wizard/${me.id}`)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMacro(me)} title="Eliminar" disabled={me.isActive}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      {renderDialogs()}
    </DashboardLayout>
  );
}
