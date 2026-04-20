import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hostDb, SolicitudEvento, TipoEvento, EstadoSolicitud } from '@/lib/hostDatabase';
import { Plus, Search, Eye, Check, X, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TIPOS_EVENTO: { value: TipoEvento; label: string }[] = [
  { value: 'reunion', label: 'Reunión' }, { value: 'congreso', label: 'Congreso' },
  { value: 'conferencia', label: 'Conferencia' }, { value: 'coctel', label: 'Coctel' },
  { value: 'cena', label: 'Cena' }, { value: 'desayuno', label: 'Desayuno' },
  { value: 'coffee_break', label: 'Coffee Break' }, { value: 'inauguracion', label: 'Inauguración' },
  { value: 'otro', label: 'Otro' },
];

export default function HostSolicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudEvento[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pendiente');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSol, setSelectedSol] = useState<SolicitudEvento | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState('');

  const [form, setForm] = useState({
    receptivoId: '', nombreEvento: '', tipoEvento: 'reunion' as TipoEvento,
    fechaInicio: '', fechaFin: '', horaInicio: '09:00', horaFin: '18:00',
    paxEstimado: 50, salonSugeridoId: '', necesidadesEspeciales: '', origen: 'email' as 'sistema' | 'email',
  });

  const salones = hostDb.salones.getAll();
  const receptivos = hostDb.receptivos.getAll();

  useEffect(() => { loadData(); }, []);

  const loadData = () => setSolicitudes(hostDb.solicitudes.getAll());

  const filtered = solicitudes.filter(s => {
    const matchTab = activeTab === 'todas' || s.estado === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || s.nombreEvento.toLowerCase().includes(q) || s.numeroConsecutivo.toLowerCase().includes(q) ||
      (hostDb.receptivos.getById(s.receptivoId)?.nombre || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleCreate = () => {
    if (!form.receptivoId || !form.nombreEvento || !form.fechaInicio || !form.fechaFin) {
      toast.error('Completa los campos obligatorios'); return;
    }
    hostDb.solicitudes.create({ ...form, estado: 'pendiente' });
    toast.success('Solicitud creada');
    setIsCreateOpen(false);
    loadData();
  };

  const handleAceptar = (sol: SolicitudEvento) => {
    try {
      hostDb.solicitudes.aceptar(sol.id, sol.salonSugeridoId);
      toast.success('Solicitud aceptada y evento creado');
      setIsDetailOpen(false);
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRechazar = () => {
    if (!selectedSol || !rejectMotivo) { toast.error('Ingresa un motivo'); return; }
    hostDb.solicitudes.rechazar(selectedSol.id, rejectMotivo);
    toast.success('Solicitud rechazada');
    setIsRejectOpen(false);
    setIsDetailOpen(false);
    setRejectMotivo('');
    loadData();
  };

  const openDetail = (sol: SolicitudEvento) => { setSelectedSol(sol); setIsDetailOpen(true); };

  const getReceptivoName = (id: string) => hostDb.receptivos.getById(id)?.nombre || 'Desconocido';
  const getSalonName = (id?: string) => id ? hostDb.salones.getById(id)?.nombre || '-' : '-';

  const estadoBadge: Record<string, string> = {
    pendiente: 'bg-warning/10 text-warning', aceptada: 'bg-accent/10 text-accent',
    rechazada: 'bg-destructive/10 text-destructive', convertida: 'bg-primary/10 text-primary',
    borrador: 'bg-muted text-muted-foreground', enviada: 'bg-info/10 text-info',
    cancelada: 'bg-muted text-muted-foreground',
  };

  const counts = {
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    aceptada: solicitudes.filter(s => s.estado === 'aceptada').length,
    rechazada: solicitudes.filter(s => s.estado === 'rechazada').length,
    convertida: solicitudes.filter(s => s.estado === 'convertida').length,
  };

  // Check disponibilidad for selected solicitud
  const disponibilidad = selectedSol?.salonSugeridoId
    ? hostDb.verificarDisponibilidad(selectedSol.fechaInicio, selectedSol.fechaFin, selectedSol.salonSugeridoId)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Solicitudes</h1>
            <p className="text-muted-foreground mt-1">Gestión de solicitudes de eventos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/host')}>
              <ArrowLeft className="h-4 w-4 mr-2" />Dashboard
            </Button>
            <Button variant="hero" onClick={() => { setForm({ receptivoId: '', nombreEvento: '', tipoEvento: 'reunion', fechaInicio: '', fechaFin: '', horaInicio: '09:00', horaFin: '18:00', paxEstimado: 50, salonSugeridoId: '', necesidadesEspeciales: '', origen: 'email' }); setIsCreateOpen(true); }}>
              <Mail className="h-4 w-4 mr-2" />Crear desde Email
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pendiente">Pendientes {counts.pendiente > 0 && <Badge className="ml-1 h-5 bg-warning text-xs">{counts.pendiente}</Badge>}</TabsTrigger>
            <TabsTrigger value="aceptada">Aceptadas ({counts.aceptada})</TabsTrigger>
            <TabsTrigger value="rechazada">Rechazadas ({counts.rechazada})</TabsTrigger>
            <TabsTrigger value="convertida">Convertidas ({counts.convertida})</TabsTrigger>
            <TabsTrigger value="todas">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar solicitudes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Receptivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No hay solicitudes</TableCell></TableRow>
              ) : filtered.map(sol => (
                <TableRow key={sol.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(sol)}>
                  <TableCell className="font-mono text-xs">{sol.numeroConsecutivo}</TableCell>
                  <TableCell className="font-medium">{sol.nombreEvento}</TableCell>
                  <TableCell>{getReceptivoName(sol.receptivoId)}</TableCell>
                  <TableCell className="capitalize text-xs">{sol.tipoEvento.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs">{sol.fechaInicio}</TableCell>
                  <TableCell>{sol.paxEstimado}</TableCell>
                  <TableCell className="text-xs">{getSalonName(sol.salonSugeridoId)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{sol.origen === 'email' ? '📧 Email' : '💻 Sistema'}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs ${estadoBadge[sol.estado] || ''}`}>{sol.estado}</Badge></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(sol)}><Eye className="h-4 w-4" /></Button>
                      {sol.estado === 'pendiente' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => handleAceptar(sol)}><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedSol(sol); setIsRejectOpen(true); }}><X className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* CREATE FROM EMAIL DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Solicitud desde Email</DialogTitle>
            <DialogDescription>Registra una solicitud recibida por email de un receptivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receptivo *</Label>
                <Select value={form.receptivoId} onValueChange={v => setForm({ ...form, receptivoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar receptivo" /></SelectTrigger>
                  <SelectContent>
                    {receptivos.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre} ({r.tipo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Evento *</Label>
                <Select value={form.tipoEvento} onValueChange={(v: TipoEvento) => setForm({ ...form, tipoEvento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre del Evento *</Label>
              <Input value={form.nombreEvento} onChange={e => setForm({ ...form, nombreEvento: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha Inicio *</Label><Input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fecha Fin *</Label><Input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Hora Inicio</Label><Input type="time" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora Fin</Label><Input type="time" value={form.horaFin} onChange={e => setForm({ ...form, horaFin: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pax Estimados</Label><Input type="number" value={form.paxEstimado} onChange={e => setForm({ ...form, paxEstimado: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Salón Sugerido</Label>
              <Select value={form.salonSugeridoId} onValueChange={v => setForm({ ...form, salonSugeridoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar salón" /></SelectTrigger>
                <SelectContent>
                  {salones.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} (Teatro: {s.capacidadTeatro})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Necesidades Especiales</Label>
              <Textarea value={form.necesidadesEspeciales} onChange={e => setForm({ ...form, necesidadesEspeciales: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleCreate}>Crear Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSol && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Solicitud #{selectedSol.numeroConsecutivo}
                  <Badge className={estadoBadge[selectedSol.estado]}>{selectedSol.estado}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">📋 Información General</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Receptivo:</span> {getReceptivoName(selectedSol.receptivoId)}</div>
                    <div><span className="text-muted-foreground">Origen:</span> {selectedSol.origen === 'email' ? '📧 Email' : '💻 Sistema'}</div>
                    <div><span className="text-muted-foreground">Evento:</span> {selectedSol.nombreEvento}</div>
                    <div><span className="text-muted-foreground">Tipo:</span> {selectedSol.tipoEvento}</div>
                    <div><span className="text-muted-foreground">Fechas:</span> {selectedSol.fechaInicio} — {selectedSol.fechaFin}</div>
                    <div><span className="text-muted-foreground">Horario:</span> {selectedSol.horaInicio} - {selectedSol.horaFin}</div>
                    <div><span className="text-muted-foreground">Pax:</span> {selectedSol.paxEstimado}</div>
                    <div><span className="text-muted-foreground">Salón sugerido:</span> {getSalonName(selectedSol.salonSugeridoId)}</div>
                  </div>
                </Card>

                {/* Disponibilidad */}
                {selectedSol.salonSugeridoId && disponibilidad && (
                  <Card className={`p-4 ${disponibilidad.disponible ? 'border-accent' : 'border-destructive'}`}>
                    <h4 className="font-semibold mb-2">📅 Disponibilidad del Salón</h4>
                    <div className={`text-sm font-medium ${disponibilidad.disponible ? 'text-accent' : 'text-destructive'}`}>
                      {disponibilidad.disponible ? '✅ Disponible' : `❌ ${disponibilidad.mensaje}`}
                    </div>
                    {!disponibilidad.disponible && disponibilidad.conflictos.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {disponibilidad.conflictos.map(c => (
                          <div key={c.id}>• {c.nombreEvento} ({c.fechaInicio} - {c.fechaFin})</div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {selectedSol.necesidadesEspeciales && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">📝 Necesidades Especiales</h4>
                    <p className="text-sm text-muted-foreground">{selectedSol.necesidadesEspeciales}</p>
                  </Card>
                )}

                {selectedSol.motivoRechazo && (
                  <Card className="p-4 border-destructive">
                    <h4 className="font-semibold mb-2 text-destructive">❌ Motivo de Rechazo</h4>
                    <p className="text-sm">{selectedSol.motivoRechazo}</p>
                  </Card>
                )}
              </div>
              {selectedSol.estado === 'pendiente' && (
                <DialogFooter>
                  <Button variant="destructive" onClick={() => setIsRejectOpen(true)}>✗ Rechazar</Button>
                  <Button variant="success" onClick={() => handleAceptar(selectedSol)}>✓ Aceptar y Crear Evento</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar Solicitud</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Motivo del rechazo *</Label>
            <Textarea value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} rows={3} placeholder="Explica el motivo del rechazo..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
