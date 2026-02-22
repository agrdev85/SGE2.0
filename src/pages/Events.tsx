import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { db, Event, MacroEvent, EventSession, FormField, SessionAttendance } from '@/lib/database';
import {
  Plus, Calendar, Users, FileText, Edit, Trash2, Settings2, Mail, Image, Palette,
  ArrowLeft, Wand2, Award, IdCard, Search, Eye, Clock, CheckSquare, Layers, CalendarDays, ChevronRight, Filter
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
import { toast } from 'sonner';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMacro, setSelectedMacro] = useState<MacroEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Data
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<EventSession[]>([]);

  // Dialogs
  const [isMacroDialogOpen, setIsMacroDialogOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<MacroEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);

  // Search
  const [macroSearch, setMacroSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  // Forms
  const [macroForm, setMacroForm] = useState({
    name: '', acronym: '', description: '', startDate: '', endDate: '', logoUrl: '',
    content: '', bannerImageUrl: '', backgroundImageUrl: '', registrationFields: [] as any[],
    primaryColor: '#1e40af', secondaryColor: '#059669', backgroundColor: '#f0f9ff',
  });
  const [eventForm, setEventForm] = useState({
    name: '', nameEn: '', description: '', macroEventId: '',
    bannerImageUrl: '', backgroundImageUrl: '',
  });
  const [sessionForm, setSessionForm] = useState({ eventId: '', date: '', startTime: '', endTime: '' });
  const [activeEventTab, setActiveEventTab] = useState('basic');
  const [activeMacroTab, setActiveMacroTab] = useState('basic');

  // Sub-views
  const [formBuilderType] = useState<'event'>('event');
  const [attendanceSession, setAttendanceSession] = useState<EventSession | null>(null);
  const [attendanceData, setAttendanceData] = useState<SessionAttendance[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    setMacroEvents(db.macroEvents.getAll());
    setEvents(db.events.getAll());
    setSessions(db.eventSessions.getAll());
    setIsLoading(false);
  };

  // ===== MACRO EVENT HANDLERS =====
  const openCreateMacro = () => {
    setEditingMacro(null);
    setMacroForm({ 
      name: '', acronym: '', description: '', startDate: '', endDate: '', logoUrl: '', 
      content: '', bannerImageUrl: '', backgroundImageUrl: '', registrationFields: [],
      primaryColor: '#1e40af', secondaryColor: '#059669', backgroundColor: '#f0f9ff' 
    });
    setActiveMacroTab('basic');
    setIsMacroDialogOpen(true);
  };

  const openEditMacro = (me: MacroEvent) => {
    setEditingMacro(me);
    setMacroForm({
      name: me.name, acronym: me.acronym, description: me.description,
      startDate: me.startDate, endDate: me.endDate, logoUrl: me.logoUrl || '',
      bannerImageUrl: (me as any).bannerImageUrl || '',
      backgroundImageUrl: (me as any).backgroundImageUrl || '',
      content: (me as any).content || '',
      registrationFields: (me as any).registrationFields || (me as any).formFields || [],
      primaryColor: (me as any).primaryColor || '#1e40af',
      secondaryColor: (me as any).secondaryColor || '#059669',
      backgroundColor: (me as any).backgroundColor || '#f0f9ff',
    });
    setActiveMacroTab('basic');
    setIsMacroDialogOpen(true);
  };

  const handleSaveMacro = () => {
    if (!macroForm.name || !macroForm.acronym || !macroForm.startDate || !macroForm.endDate) {
      toast.error('Completa los campos obligatorios'); return;
    }
    if (new Date(macroForm.endDate) < new Date(macroForm.startDate)) {
      toast.error('La fecha de fin no puede ser anterior a la de inicio'); return;
    }
    try {
      if (editingMacro) {
        db.macroEvents.update(editingMacro.id, macroForm as any);
        // Propagate relevant macro fields to all simple events belonging to this macro
        const relatedEvents = events.filter(e => e.macroEventId === editingMacro.id);
        relatedEvents.forEach(ev => {
          const updateData: any = {
            bannerImageUrl: macroForm.bannerImageUrl,
            backgroundImageUrl: macroForm.backgroundImageUrl,
            logoUrl: macroForm.logoUrl,
            primaryColor: macroForm.primaryColor,
            secondaryColor: macroForm.secondaryColor,
            backgroundColor: macroForm.backgroundColor,
            startDate: macroForm.startDate,
            endDate: macroForm.endDate,
          };
          db.events.update(ev.id, updateData);
          if (macroForm.registrationFields) db.events.updateFormFields(ev.id, macroForm.registrationFields as any);
        });
        toast.success('Macro evento actualizado');
      } else {
        db.macroEvents.create({ ...macroForm, isActive: false });
        toast.success('Macro evento creado (estado: Inactivo)');
      }
      setIsMacroDialogOpen(false);
      loadAll();
      if (editingMacro && selectedMacro?.id === editingMacro.id) {
        setSelectedMacro(db.macroEvents.getById(editingMacro.id) || null);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const handleDeleteMacro = (me: MacroEvent) => {
    if (me.isActive) { toast.error('Solo se puede eliminar macro eventos inactivos'); return; }
    if (confirm('¿Eliminar este macro evento?')) {
      db.macroEvents.delete(me.id);
      toast.success('Macro evento eliminado');
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
    if (!macro) { toast.error('Macro evento no encontrado'); return; }
    try {
      const colors = {
        primaryColor: (macro as any).primaryColor || '#1e40af',
        secondaryColor: (macro as any).secondaryColor || '#059669',
        backgroundColor: (macro as any).backgroundColor || '#f0f9ff',
      };
      if (editingEvent) {
        db.events.update(editingEvent.id, { ...eventForm, ...colors, startDate: macro.startDate, endDate: macro.endDate });
        toast.success('Evento simple actualizado');
      } else {
        db.events.create({ ...eventForm, ...colors, isActive: false, createdBy: '4', startDate: macro.startDate, endDate: macro.endDate } as any);
        toast.success('Evento simple creado (estado: Inactivo)');
      }
      setIsEventDialogOpen(false);
      loadAll();
      if (editingEvent && selectedEvent?.id === editingEvent.id) setSelectedEvent(db.events.getById(editingEvent.id) || null);
    } catch (e: any) { toast.error(e.message || 'Error al guardar'); }
  };

  const handleDeleteEvent = (event: Event) => {
    if (event.isActive) { toast.error('Solo se puede eliminar eventos inactivos'); return; }
    if (confirm('¿Eliminar este evento simple?')) { db.events.delete(event.id); toast.success('Evento eliminado'); loadAll(); }
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
        if (sD < mS || sD > mE) { toast.error('La fecha de la sesión debe estar dentro del rango del macro evento'); return; }
      }
    }
    try {
      if (editingSession) { db.eventSessions.update(editingSession.id, sessionForm); toast.success('Sesión actualizada'); }
      else { db.eventSessions.create({ ...sessionForm, isActive: true }); toast.success('Sesión creada'); }
      setIsSessionDialogOpen(false);
      loadAll();
    } catch (e: any) { toast.error(e.message || 'Error'); }
  };

  const handleDeleteSession = (session: EventSession) => {
    if (confirm('¿Eliminar esta sesión?')) { db.eventSessions.delete(session.id); toast.success('Sesión eliminada'); loadAll(); }
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
    const macroToUse = editingMacro || selectedMacro;
    if (macroToUse) {
      // Save form fields to all events of this macro
      const macroEventsList = events.filter(e => e.macroEventId === macroToUse.id);
      macroEventsList.forEach(ev => db.events.updateFormFields(ev.id, fields));
      // Also save to macro event as registrationFields
      db.macroEvents.update(macroToUse.id, { registrationFields: fields } as any);
      loadAll();
    } else {
      // If no macro selected (editing new macro), just update local state
      setMacroForm(prev => ({ ...prev, registrationFields: fields }));
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
      <button onClick={goBackToList} className="hover:text-foreground transition-colors">Macro Eventos</button>
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
      {/* MACRO EVENT DIALOG */}
      <Dialog open={isMacroDialogOpen} onOpenChange={setIsMacroDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMacro ? 'Editar Macro Evento' : 'Crear Macro Evento'}</DialogTitle>
            <DialogDescription>Contenedor principal que agrupa eventos simples</DialogDescription>
          </DialogHeader>
          <Tabs value={activeMacroTab} onValueChange={setActiveMacroTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic"><FileText className="h-4 w-4 mr-1" />Información</TabsTrigger>
              <TabsTrigger value="content"><Settings2 className="h-4 w-4 mr-1" />Contenidos</TabsTrigger>
              <TabsTrigger value="images"><Image className="h-4 w-4 mr-1" />Imágenes</TabsTrigger>
              <TabsTrigger value="logotipo"><Image className="h-4 w-4 mr-1" />Logotipo</TabsTrigger>
              <TabsTrigger value="colors"><Palette className="h-4 w-4 mr-1" />Colores</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={macroForm.name} onChange={e => setMacroForm({ ...macroForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Siglas (único) *</Label><Input value={macroForm.acronym} onChange={e => setMacroForm({ ...macroForm, acronym: e.target.value })} placeholder="Ej: CIB2024" /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={macroForm.description} onChange={e => setMacroForm({ ...macroForm, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fecha/Hora Inicio *</Label><Input type="datetime-local" value={macroForm.startDate} onChange={e => setMacroForm({ ...macroForm, startDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fecha/Hora Fin *</Label><Input type="datetime-local" value={macroForm.endDate} onChange={e => setMacroForm({ ...macroForm, endDate: e.target.value })} /></div>
              </div>
            </TabsContent>
            <TabsContent value="content" className="mt-4">
              <EventContentEditor
                content={macroForm.content || ''}
                onChange={content => setMacroForm({ ...macroForm, content })}
              />
            </TabsContent>
            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Banner del Evento</Label>
                <ImageUploader value={macroForm.bannerImageUrl} onChange={url => setMacroForm({ ...macroForm, bannerImageUrl: url })} aspectRatio="banner" placeholder="Subir banner" />
              </div>
              <div className="space-y-2">
                <Label>Imagen de Fondo</Label>
                <ImageUploader value={macroForm.backgroundImageUrl} onChange={url => setMacroForm({ ...macroForm, backgroundImageUrl: url })} aspectRatio="banner" placeholder="Subir imagen de fondo" />
              </div>
            </TabsContent>
            <TabsContent value="logotipo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Logotipo</Label>
                <ImageUploader value={macroForm.logoUrl} onChange={url => setMacroForm({ ...macroForm, logoUrl: url })} aspectRatio="square" placeholder="Subir logotipo" />
              </div>
            </TabsContent>
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                  <div key={key} className="space-y-2">
                    <Label>{key === 'primaryColor' ? 'Color Primario' : key === 'secondaryColor' ? 'Color Secundario' : 'Color de Fondo'}</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={macroForm[key]} onChange={e => setMacroForm({ ...macroForm, [key]: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={macroForm[key]} onChange={e => setMacroForm({ ...macroForm, [key]: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg overflow-hidden h-24" style={{ backgroundColor: macroForm.backgroundColor }}>
                <div className="h-12 flex items-center justify-center text-white font-semibold" style={{ background: `linear-gradient(135deg, ${macroForm.primaryColor}, ${macroForm.secondaryColor})` }}>
                  {macroForm.name || 'Vista previa'}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMacroDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSaveMacro}>{editingMacro ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIMPLE EVENT DIALOG */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento Simple' : 'Crear Evento Simple'}</DialogTitle>
            <DialogDescription>Actividad concreta asociada a un macro evento</DialogDescription>
          </DialogHeader>
          {/* Solo información básica y descripción simple */}
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Nombre en Español *</Label><Input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nombre en Inglés</Label><Input value={eventForm.nameEn} onChange={e => setEventForm({ ...eventForm, nameEn: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Descripción General</Label>
              <Textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={3} placeholder="Descripción general del evento simple..." />
            </div>
            <div className="space-y-2">
              <Label>Macro Evento Asociado *</Label>
              <Select value={eventForm.macroEventId} onValueChange={v => setEventForm({ ...eventForm, macroEventId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar macro evento" /></SelectTrigger>
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
            <DialogDescription>Ocurrencia temporal de un evento simple</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Evento Simple *</Label>
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
              Crea al menos un evento simple en este macro evento para configurar el formulario de inscripción.
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
          {refEvent ? <EmailTemplateManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un evento simple primero.</Card>}
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
          {refEvent ? <JuryAssignment event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un evento simple primero.</Card>}
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
          {refEvent ? <CertificateManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un evento simple primero.</Card>}
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
          {refEvent ? <CredentialsManager event={refEvent} /> : <Card className="p-8 text-center text-muted-foreground">Crea al menos un evento simple primero.</Card>}
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
              <Button variant="outline" onClick={() => openEditEvent(selectedEvent)}><Edit className="h-4 w-4 mr-2" />Editar</Button>
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
              <p className="text-sm text-muted-foreground">Color (Macro)</p>
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
                          <Button variant="ghost" size="icon" onClick={() => openEditSession(session)} title="Editar"><Edit className="h-4 w-4" /></Button>
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
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">{selectedMacro.name}</h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mr-2">{selectedMacro.acronym}</Badge>
                {new Date(selectedMacro.startDate).toLocaleDateString('es-ES')} — {new Date(selectedMacro.endDate).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEditMacro(selectedMacro)}><Edit className="h-4 w-4 mr-2" />Editar</Button>
              <Button variant="outline" onClick={goBackToList}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
            </div>
          </div>

          {/* Macro info summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{events.filter(e => e.macroEventId === selectedMacro.id).length}</p>
              <p className="text-sm text-muted-foreground">Eventos Simples</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{sessions.filter(s => events.filter(e => e.macroEventId === selectedMacro.id).some(e => e.id === s.eventId)).length}</p>
              <p className="text-sm text-muted-foreground">Sesiones Totales</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex justify-center">
                <Switch checked={selectedMacro.isActive} onCheckedChange={() => {
                  toggleMacroStatus(selectedMacro);
                  const refreshed = db.macroEvents.getById(selectedMacro.id);
                  if (refreshed) setSelectedMacro(refreshed);
                }} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{selectedMacro.isActive ? 'Activo' : 'Inactivo'}</p>
            </Card>
          </div>

          {selectedMacro.description && (
            <Card className="p-4"><p className="text-sm text-muted-foreground">{selectedMacro.description}</p></Card>
          )}

          {/* TOOLS - now at macro level */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Herramientas del Evento</CardTitle>
              <CardDescription>Configuración compartida por todos los eventos simples de este macro evento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={openFormBuilder}>
                  <Settings2 className="h-5 w-5" /><span className="text-xs">Form. Inscripción</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={openEmailTemplates}>
                  <Mail className="h-5 w-5" /><span className="text-xs">Emails</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={openJuryAssignment}>
                  <Wand2 className="h-5 w-5" /><span className="text-xs">Jurados</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={openCertificates}>
                  <Award className="h-5 w-5" /><span className="text-xs">Certificados</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={openCredentials}>
                  <IdCard className="h-5 w-5" /><span className="text-xs">Credenciales</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simple Events table with search */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Eventos Simples</CardTitle>
              <Button variant="hero" size="sm" onClick={() => openCreateEvent(selectedMacro.id)}>
                <Plus className="h-4 w-4" />Nuevo Evento Simple
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar eventos simples..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} className="pl-9" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre (ES)</TableHead>
                    <TableHead>Nombre (EN)</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Sesiones</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {macroEvts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay eventos simples</TableCell></TableRow>
                  ) : macroEvts.map(event => (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEventDetail(event)}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell className="text-muted-foreground">{event.nameEn || '-'}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{event.description?.replace(/<[^>]*>/g, '').substring(0, 60) || '-'}</TableCell>
                      <TableCell className="text-center">{getSessionCount(event.id)}</TableCell>
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <Switch checked={event.isActive} onCheckedChange={() => toggleEventStatus(event)} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEventDetail(event)} title="Ver detalle"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)} title="Editar"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event)} title="Eliminar" disabled={event.isActive}><Trash2 className="h-4 w-4" /></Button>
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

  // ===== MAIN LIST VIEW (Macro Events) =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Gestión de Eventos</h1>
          <p className="text-muted-foreground mt-1">Macro eventos, eventos simples y sesiones</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar macro eventos..." value={macroSearch} onChange={e => setMacroSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="hero" onClick={openCreateMacro}><Plus className="h-4 w-4" />Nuevo Macro Evento</Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Siglas</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead className="text-center">Eventos Simples</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacros.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay macro eventos</TableCell></TableRow>
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
                      <Button variant="ghost" size="icon" onClick={() => openEditMacro(me)} title="Editar"><Edit className="h-4 w-4" /></Button>
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
