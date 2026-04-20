import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hostDb, EventoConfirmado, TipoEvento, EstadoEventoConfirmado } from '@/lib/hostDatabase';
import { Plus, Search, Eye, Pencil, Trash2, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const TIPOS_EVENTO: { value: TipoEvento; label: string }[] = [
  { value: 'reunion', label: 'Reunión' }, { value: 'congreso', label: 'Congreso' },
  { value: 'conferencia', label: 'Conferencia' }, { value: 'coctel', label: 'Coctel' },
  { value: 'cena', label: 'Cena' }, { value: 'desayuno', label: 'Desayuno' },
  { value: 'coffee_break', label: 'Coffee Break' }, { value: 'inauguracion', label: 'Inauguración' },
  { value: 'otro', label: 'Otro' },
];

export default function HostEventos() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<EventoConfirmado[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvt, setSelectedEvt] = useState<EventoConfirmado | null>(null);
  const [editing, setEditing] = useState<EventoConfirmado | null>(null);

  const salones = hostDb.salones.getAll();
  const receptivos = hostDb.receptivos.getAll();

  const [form, setForm] = useState({
    receptivoId: '', nombreEvento: '', tipoEvento: 'reunion' as TipoEvento,
    fechaInicio: '', fechaFin: '', horaInicio: '09:00', horaFin: '18:00',
    salonId: '', paxConfirmado: 50, notasInternas: '', requiereBeo: true,
  });

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    itemId: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemName: '',
    itemId: '',
    onConfirm: () => {},
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setEventos(hostDb.eventosConfirmados.getAll());

  const filtered = eventos.filter(e => {
    const matchTab = activeTab === 'all' || e.estado === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || e.nombreEvento.toLowerCase().includes(q) || e.numeroEvento.toLowerCase().includes(q) ||
      (hostDb.receptivos.getById(e.receptivoId)?.nombre || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ receptivoId: '', nombreEvento: '', tipoEvento: 'reunion', fechaInicio: '', fechaFin: '', horaInicio: '09:00', horaFin: '18:00', salonId: '', paxConfirmado: 50, notasInternas: '', requiereBeo: true });
    setIsCreateOpen(true);
  };

  const openEdit = (evt: EventoConfirmado) => {
    setEditing(evt);
    setForm({ receptivoId: evt.receptivoId, nombreEvento: evt.nombreEvento, tipoEvento: evt.tipoEvento, fechaInicio: evt.fechaInicio, fechaFin: evt.fechaFin, horaInicio: evt.horaInicio, horaFin: evt.horaFin, salonId: evt.salonId, paxConfirmado: evt.paxConfirmado, notasInternas: evt.notasInternas, requiereBeo: evt.requiereBeo });
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!form.receptivoId || !form.nombreEvento || !form.fechaInicio || !form.salonId) {
      toast.error('Completa los campos obligatorios'); return;
    }
    // Check availability
    const disp = hostDb.verificarDisponibilidad(form.fechaInicio, form.fechaFin || form.fechaInicio, form.salonId, editing?.id);
    if (!disp.disponible) { toast.error(`No disponible: ${disp.mensaje}`); return; }

    try {
      if (editing) {
        hostDb.eventosConfirmados.update(editing.id, { ...form, estado: editing.estado, beoGenerado: editing.beoGenerado });
        toast.success('Evento actualizado');
      } else {
        hostDb.eventosConfirmados.create({ ...form, estado: 'confirmado', beoGenerado: false });
        toast.success('Evento creado manualmente');
      }
      setIsCreateOpen(false);
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = (evt: EventoConfirmado) => {
    setDeleteConfirmDialog({
      isOpen: true,
      itemName: evt.nombreEvento,
      itemId: evt.id,
      onConfirm: () => {
        hostDb.eventosConfirmados.delete(evt.id);
        toast.success('Evento eliminado');
        loadData();
      },
    });
  };

  const updateEstado = (evt: EventoConfirmado, estado: EstadoEventoConfirmado) => {
    hostDb.eventosConfirmados.update(evt.id, { estado });
    toast.success(`Estado cambiado a: ${estado}`);
    loadData();
  };

  const openDetail = (evt: EventoConfirmado) => { setSelectedEvt(evt); setIsDetailOpen(true); };
  const getReceptivoName = (id: string) => hostDb.receptivos.getById(id)?.nombre || 'Desconocido';
  const getSalonName = (id: string) => hostDb.salones.getById(id)?.nombre || '-';

  const estadoColors: Record<string, string> = {
    confirmado: 'bg-accent/10 text-accent', en_planificacion: 'bg-info/10 text-info',
    en_curso: 'bg-primary/10 text-primary', finalizado: 'bg-muted text-muted-foreground',
    cancelado: 'bg-destructive/10 text-destructive',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Eventos Confirmados</h1>
            <p className="text-muted-foreground mt-1">Gestión de eventos del hotel</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/host')}><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
            <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Crear Evento Manual</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="confirmado">Confirmados</TabsTrigger>
            <TabsTrigger value="en_planificacion">En Planificación</TabsTrigger>
            <TabsTrigger value="en_curso">En Curso</TabsTrigger>
            <TabsTrigger value="finalizado">Finalizados</TabsTrigger>
            <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar eventos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Evento</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Receptivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>BEO</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No hay eventos</TableCell></TableRow>
              ) : filtered.map(evt => (
                <TableRow key={evt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(evt)}>
                  <TableCell className="font-mono text-xs">{evt.numeroEvento}</TableCell>
                  <TableCell className="font-medium">{evt.nombreEvento}</TableCell>
                  <TableCell className="text-xs">{getReceptivoName(evt.receptivoId)}</TableCell>
                  <TableCell className="capitalize text-xs">{evt.tipoEvento.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs">{evt.fechaInicio}{evt.fechaFin !== evt.fechaInicio ? ` — ${evt.fechaFin}` : ''}</TableCell>
                  <TableCell className="text-xs">{getSalonName(evt.salonId)}</TableCell>
                  <TableCell>{evt.paxConfirmado}</TableCell>
                  <TableCell><Badge className={`text-xs ${estadoColors[evt.estado] || ''}`}>{evt.estado.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{evt.beoGenerado ? <Badge variant="outline" className="text-xs text-accent">✓</Badge> : <Badge variant="outline" className="text-xs">—</Badge>}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(evt)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(evt)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/host/beos')} title="BEOs"><FileText className="h-4 w-4" /></Button>
                      {evt.estado === 'cancelado' && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(evt)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Evento' : 'Crear Evento Manual'}</DialogTitle>
            <DialogDescription>{editing ? 'Actualiza los datos del evento' : 'Crea un evento para un receptivo no cliente (desde email)'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receptivo *</Label>
                <Select value={form.receptivoId} onValueChange={v => setForm({ ...form, receptivoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{receptivos.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipoEvento} onValueChange={(v: TipoEvento) => setForm({ ...form, tipoEvento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_EVENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Nombre del Evento *</Label><Input value={form.nombreEvento} onChange={e => setForm({ ...form, nombreEvento: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha Inicio *</Label><Input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fecha Fin</Label><Input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Hora Inicio</Label><Input type="time" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora Fin</Label><Input type="time" value={form.horaFin} onChange={e => setForm({ ...form, horaFin: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pax</Label><Input type="number" value={form.paxConfirmado} onChange={e => setForm({ ...form, paxConfirmado: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Salón *</Label>
              <Select value={form.salonId} onValueChange={v => setForm({ ...form, salonId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar salón" /></SelectTrigger>
                <SelectContent>{salones.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} (Teatro: {s.capacidadTeatro})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notas Internas</Label><Textarea value={form.notasInternas} onChange={e => setForm({ ...form, notasInternas: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear Evento'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEvt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedEvt.nombreEvento}
                  <Badge className={estadoColors[selectedEvt.estado]}>{selectedEvt.estado.replace('_', ' ')}</Badge>
                </DialogTitle>
                <DialogDescription>Evento #{selectedEvt.numeroEvento}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Receptivo:</span> {getReceptivoName(selectedEvt.receptivoId)}</div>
                <div><span className="text-muted-foreground">Tipo:</span> {selectedEvt.tipoEvento}</div>
                <div><span className="text-muted-foreground">Fechas:</span> {selectedEvt.fechaInicio} — {selectedEvt.fechaFin}</div>
                <div><span className="text-muted-foreground">Horario:</span> {selectedEvt.horaInicio} - {selectedEvt.horaFin}</div>
                <div><span className="text-muted-foreground">Salón:</span> {getSalonName(selectedEvt.salonId)}</div>
                <div><span className="text-muted-foreground">Pax:</span> {selectedEvt.paxConfirmado}</div>
                <div><span className="text-muted-foreground">BEO:</span> {selectedEvt.beoGenerado ? '✅ Generado' : '❌ Pendiente'}</div>
                <div><span className="text-muted-foreground">Confirmación:</span> {new Date(selectedEvt.fechaConfirmacion).toLocaleDateString('es-ES')}</div>
              </div>
              {selectedEvt.notasInternas && <Card className="p-3"><p className="text-sm text-muted-foreground">{selectedEvt.notasInternas}</p></Card>}
              <DialogFooter className="flex-wrap gap-2">
                {selectedEvt.estado === 'confirmado' && <Button size="sm" onClick={() => { updateEstado(selectedEvt, 'en_planificacion'); setIsDetailOpen(false); }}>▶ En Planificación</Button>}
                {selectedEvt.estado === 'en_planificacion' && <Button size="sm" onClick={() => { updateEstado(selectedEvt, 'en_curso'); setIsDetailOpen(false); }}>▶ En Curso</Button>}
                {selectedEvt.estado === 'en_curso' && <Button size="sm" onClick={() => { updateEstado(selectedEvt, 'finalizado'); setIsDetailOpen(false); }}>✓ Finalizar</Button>}
                {selectedEvt.estado !== 'cancelado' && selectedEvt.estado !== 'finalizado' && <Button size="sm" variant="destructive" onClick={() => { updateEstado(selectedEvt, 'cancelado'); setIsDetailOpen(false); }}>✗ Cancelar</Button>}
                <Button size="sm" variant="outline" onClick={() => { setIsDetailOpen(false); openEdit(selectedEvt); }}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/host/beos')}>BEOs</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirmDialog.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title="¿Eliminar evento?"
        description="¿Está seguro de que desea eliminar este evento confirmado? Esta acción no se puede deshacer."
        itemName={deleteConfirmDialog.itemName}
        itemType="evento"
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={deleteConfirmDialog.onConfirm}
      />
    </DashboardLayout>
  );
}
