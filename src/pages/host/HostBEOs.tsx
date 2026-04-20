import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { hostDb, BEO, EventoConfirmado } from '@/lib/hostDatabase';
import { Plus, Search, Eye, Pencil, FileText, Send, Check, ArrowLeft, Download, Trash2, History, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const DEPARTAMENTOS = ['Banquetes / Montaje A&B', 'Cocina', 'Informáticos', 'Mantenimiento', 'Ama de Llaves'];

export default function HostBEOs() {
  const navigate = useNavigate();
  const [beos, setBeos] = useState<BEO[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBeo, setEditingBeo] = useState<BEO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBeo, setSelectedBeo] = useState<BEO | null>(null);

  const eventos = hostDb.eventosConfirmados.getAll().filter(e => e.estado !== 'cancelado');

  const [form, setForm] = useState({
    eventoId: '',
    responsableHotel: '',
    tourLeader: '',
    tipoMontaje: 'Teatro',
    paxFinal: 0,
    departamentos: Object.fromEntries(DEPARTAMENTOS.map(d => [d, ''])) as Record<string, string>,
    costos: { items: [{ concepto: '', cantidad: 1, precioUnitario: 0, total: 0 }], total: 0, moneda: 'CUP' },
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setBeos(hostDb.beos.getAll());

  const filtered = beos.filter(b => {
    const matchTab = activeTab === 'all' || b.estado === activeTab;
    const q = search.toLowerCase();
    const evt = hostDb.eventosConfirmados.getById(b.eventoId);
    const matchSearch = !q || b.numeroBeo.toLowerCase().includes(q) || (evt?.nombreEvento || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const openCreate = () => {
    setEditingBeo(null);
    setForm({
      eventoId: '', responsableHotel: '', tourLeader: '', tipoMontaje: 'Teatro', paxFinal: 0,
      departamentos: Object.fromEntries(DEPARTAMENTOS.map(d => [d, ''])),
      costos: { items: [{ concepto: '', cantidad: 1, precioUnitario: 0, total: 0 }], total: 0, moneda: 'CUP' },
    });
    setIsEditorOpen(true);
  };

  const openEdit = (beo: BEO) => {
    setEditingBeo(beo);
    setForm({
      eventoId: beo.eventoId, responsableHotel: beo.responsableHotel, tourLeader: beo.tourLeader,
      tipoMontaje: beo.tipoMontaje, paxFinal: beo.paxFinal,
      departamentos: { ...Object.fromEntries(DEPARTAMENTOS.map(d => [d, ''])), ...beo.departamentos },
      costos: beo.costos,
    });
    setIsEditorOpen(true);
  };

  const handleSelectEvento = (eventoId: string) => {
    const evt = hostDb.eventosConfirmados.getById(eventoId);
    if (evt) {
      setForm(prev => ({
        ...prev,
        eventoId,
        paxFinal: evt.paxConfirmado,
      }));
    }
  };

  const updateCostoItem = (index: number, field: string, value: any) => {
    const items = [...form.costos.items];
    (items[index] as any)[field] = value;
    items[index].total = items[index].cantidad * items[index].precioUnitario;
    const total = items.reduce((s, i) => s + i.total, 0);
    setForm(prev => ({ ...prev, costos: { ...prev.costos, items, total } }));
  };

  const addCostoItem = () => {
    setForm(prev => ({ ...prev, costos: { ...prev.costos, items: [...prev.costos.items, { concepto: '', cantidad: 1, precioUnitario: 0, total: 0 }] } }));
  };

  const removeCostoItem = (index: number) => {
    const items = form.costos.items.filter((_, i) => i !== index);
    const total = items.reduce((s, i) => s + i.total, 0);
    setForm(prev => ({ ...prev, costos: { ...prev.costos, items, total } }));
  };

  const handleSave = () => {
    if (!form.eventoId || !form.responsableHotel) { toast.error('Completa campos obligatorios'); return; }
    const evt = hostDb.eventosConfirmados.getById(form.eventoId);
    if (!evt) return;
    const salon = hostDb.salones.getById(evt.salonId);

    try {
      if (editingBeo) {
        hostDb.beos.update(editingBeo.id, {
          responsableHotel: form.responsableHotel, tourLeader: form.tourLeader,
          tipoMontaje: form.tipoMontaje, paxFinal: form.paxFinal,
          departamentos: form.departamentos, costos: form.costos,
        });
        toast.success('BEO actualizado');
      } else {
        hostDb.beos.create({
          eventoId: form.eventoId, responsableHotel: form.responsableHotel, tourLeader: form.tourLeader,
          fechaElaboracion: new Date().toISOString().split('T')[0],
          fechaEvento: evt.fechaInicio,
          horarioInicio: evt.horaInicio, horarioFin: evt.horaFin,
          lugar: salon?.nombre || '', tipoMontaje: form.tipoMontaje, paxFinal: form.paxFinal,
          departamentos: form.departamentos, costos: form.costos,
          estado: 'borrador', modificado: false,
        });
        toast.success('BEO creado');
      }
      setIsEditorOpen(false);
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEnviar = (beo: BEO) => {
    hostDb.beos.enviar(beo.id);
    toast.success('BEO enviado al cliente');
    loadData();
  };

  const handleAprobar = (beo: BEO) => {
    hostDb.beos.aprobar(beo.id);
    toast.success('BEO aprobado');
    loadData();
  };

  const getEventoName = (id: string) => hostDb.eventosConfirmados.getById(id)?.nombreEvento || '-';
  const getReceptivoFromEvento = (eventoId: string) => {
    const evt = hostDb.eventosConfirmados.getById(eventoId);
    return evt ? hostDb.receptivos.getById(evt.receptivoId)?.nombre || '-' : '-';
  };

  const estadoColors: Record<string, string> = {
    borrador: 'bg-muted text-muted-foreground', enviado_cliente: 'bg-info/10 text-info',
    aprobado: 'bg-accent/10 text-accent', modificado: 'bg-warning/10 text-warning',
    ejecutado: 'bg-primary/10 text-primary',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Banquet Event Orders</h1>
            <p className="text-muted-foreground mt-1">Gestión de órdenes de servicio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/host')}><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
            <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo BEO</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="borrador">Borradores</TabsTrigger>
            <TabsTrigger value="enviado_cliente">Enviados</TabsTrigger>
            <TabsTrigger value="aprobado">Aprobados</TabsTrigger>
            <TabsTrigger value="modificado">Modificados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar BEOs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° BEO</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay BEOs</TableCell></TableRow>
              ) : filtered.map(beo => (
                <TableRow key={beo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedBeo(beo); setIsDetailOpen(true); }}>
                  <TableCell className="font-mono text-xs">{beo.numeroBeo}{beo.modificado && ' MODIFICADO'}</TableCell>
                  <TableCell className="font-medium text-sm">{getEventoName(beo.eventoId)}</TableCell>
                  <TableCell className="text-xs">{getReceptivoFromEvento(beo.eventoId)}</TableCell>
                  <TableCell className="text-xs">{beo.fechaEvento}</TableCell>
                  <TableCell className="text-xs">{beo.lugar}</TableCell>
                  <TableCell>{beo.paxFinal}</TableCell>
                  <TableCell className="text-center">{beo.version}</TableCell>
                  <TableCell><Badge className={`text-xs ${estadoColors[beo.estado] || ''}`}>{beo.estado.replace('_', ' ')}</Badge></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(beo)}><Pencil className="h-4 w-4" /></Button>
                      {beo.estado === 'borrador' && <Button variant="ghost" size="icon" className="h-8 w-8 text-info" onClick={() => handleEnviar(beo)} title="Enviar al cliente"><Send className="h-4 w-4" /></Button>}
                      {beo.estado === 'enviado_cliente' && <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => handleAprobar(beo)} title="Aprobar"><Check className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* BEO EDITOR DIALOG */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBeo ? `Editar BEO ${editingBeo.numeroBeo}` : 'Nuevo BEO'}</DialogTitle>
            <DialogDescription>Banquet Event Order - Orden de Servicio</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Evento *</Label>
                <Select value={form.eventoId} onValueChange={handleSelectEvento} disabled={!!editingBeo}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar evento" /></SelectTrigger>
                  <SelectContent>{eventos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombreEvento} ({e.numeroEvento})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Tipo Montaje</Label><Input value={form.tipoMontaje} onChange={e => setForm({ ...form, tipoMontaje: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Responsable Hotel *</Label><Input value={form.responsableHotel} onChange={e => setForm({ ...form, responsableHotel: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tour Leader</Label><Input value={form.tourLeader} onChange={e => setForm({ ...form, tourLeader: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pax Final</Label><Input type="number" value={form.paxFinal} onChange={e => setForm({ ...form, paxFinal: parseInt(e.target.value) || 0 })} /></div>
            </div>

            {/* Departamentos */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">📋 Detalles por Departamento</Label>
              <Accordion type="multiple" className="w-full">
                {DEPARTAMENTOS.map(dept => (
                  <AccordionItem key={dept} value={dept}>
                    <AccordionTrigger className="text-sm font-medium">{dept}</AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={form.departamentos[dept] || ''}
                        onChange={e => setForm({ ...form, departamentos: { ...form.departamentos, [dept]: e.target.value } })}
                        rows={4}
                        placeholder={`Instrucciones para ${dept}...\nUse • para listar puntos`}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Costos */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">💰 Costos</Label>
              <div className="space-y-2">
                {form.costos.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end">
                    <div><Label className="text-xs">Concepto</Label><Input value={item.concepto} onChange={e => updateCostoItem(i, 'concepto', e.target.value)} className="text-sm" /></div>
                    <div><Label className="text-xs">Cantidad</Label><Input type="number" value={item.cantidad} onChange={e => updateCostoItem(i, 'cantidad', parseInt(e.target.value) || 0)} className="text-sm" /></div>
                    <div><Label className="text-xs">P. Unitario</Label><Input type="number" value={item.precioUnitario} onChange={e => updateCostoItem(i, 'precioUnitario', parseInt(e.target.value) || 0)} className="text-sm" /></div>
                    <div><Label className="text-xs">Total</Label><Input value={item.total.toLocaleString()} disabled className="text-sm" /></div>
                    <Button variant="ghost" size="icon" className="h-10 text-destructive" onClick={() => removeCostoItem(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCostoItem}><Plus className="h-4 w-4 mr-1" />Agregar ítem</Button>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label>Moneda:</Label>
                    <Select value={form.costos.moneda} onValueChange={v => setForm({ ...form, costos: { ...form.costos, moneda: v } })}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUP">CUP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-lg font-bold">TOTAL: {form.costos.total.toLocaleString()} {form.costos.moneda}</div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSave}>{editingBeo ? 'Actualizar' : 'Guardar Borrador'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BEO DETAIL DIALOG (read-only preview) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBeo && (() => {
            const evt = hostDb.eventosConfirmados.getById(selectedBeo.eventoId);
            const receptivo = evt ? hostDb.receptivos.getById(evt.receptivoId) : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    BEO #{selectedBeo.numeroBeo} {selectedBeo.modificado && '(MODIFICADO)'}
                    <Badge className={estadoColors[selectedBeo.estado]}>{selectedBeo.estado.replace('_', ' ')}</Badge>
                  </DialogTitle>
                  <DialogDescription>Versión {selectedBeo.version} · Elaborado: {selectedBeo.fechaElaboracion}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">📋 Información General</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Cuenta:</span> {receptivo?.nombre}</div>
                      <div><span className="text-muted-foreground">Responsable:</span> {selectedBeo.responsableHotel}</div>
                      <div><span className="text-muted-foreground">Tour Leader:</span> {selectedBeo.tourLeader}</div>
                      <div><span className="text-muted-foreground">Fecha evento:</span> {selectedBeo.fechaEvento}</div>
                      <div><span className="text-muted-foreground">Horario:</span> {selectedBeo.horarioInicio} - {selectedBeo.horarioFin}</div>
                      <div><span className="text-muted-foreground">Lugar:</span> {selectedBeo.lugar}</div>
                      <div><span className="text-muted-foreground">Montaje:</span> {selectedBeo.tipoMontaje}</div>
                      <div><span className="text-muted-foreground">Pax:</span> {selectedBeo.paxFinal}</div>
                    </div>
                  </Card>

                  {Object.entries(selectedBeo.departamentos).map(([dept, instrucciones]) => (
                    instrucciones && (
                      <Card key={dept} className="p-4">
                        <h4 className="font-semibold mb-2">{dept}</h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{instrucciones}</div>
                      </Card>
                    )
                  ))}

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">💰 Costos</h4>
                    <Table>
                      <TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead>Cant.</TableHead><TableHead>P.U.</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {selectedBeo.costos.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.concepto}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{item.precioUnitario.toLocaleString()}</TableCell>
                            <TableCell>{item.total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow><TableCell colSpan={3} className="text-right font-bold">TOTAL:</TableCell><TableCell className="font-bold">{selectedBeo.costos.total.toLocaleString()} {selectedBeo.costos.moneda}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openEdit(selectedBeo)}>✏️ Editar</Button>
                  {selectedBeo.estado === 'borrador' && <Button variant="default" onClick={() => { handleEnviar(selectedBeo); setIsDetailOpen(false); }}>📤 Enviar al Cliente</Button>}
                  {selectedBeo.estado === 'enviado_cliente' && <Button variant="success" onClick={() => { handleAprobar(selectedBeo); setIsDetailOpen(false); }}>👍 Aprobar</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
