import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hostDb, Receptivo } from '@/lib/hostDatabase';
import { normalizeText, isDuplicate } from '@/lib/utils';
import { Plus, Pencil, Trash2, ArrowLeft, Search, Building2, Calendar, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

export default function HostReceptivos() {
  const navigate = useNavigate();
  const [receptivos, setReceptivos] = useState<Receptivo[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Receptivo | null>(null);
  const [selectedReceptivo, setSelectedReceptivo] = useState<Receptivo | null>(null);

  const [form, setForm] = useState({
    nombre: '', tipo: 'no_cliente' as 'cliente' | 'no_cliente', contratoActivo: false,
    emailContacto: '', telefono: '', pais: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    receptivo: Receptivo | null;
  }>({ open: false, receptivo: null });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setReceptivos(hostDb.receptivos.getAll());

  const filtered = receptivos.filter(r => {
    const matchTab = activeTab === 'all' || r.tipo === activeTab;
    const q = search.toLowerCase();
    return (!q || r.nombre.toLowerCase().includes(q) || r.emailContacto.toLowerCase().includes(q) || r.pais.toLowerCase().includes(q)) && matchTab;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', tipo: 'no_cliente', contratoActivo: false, emailContacto: '', telefono: '', pais: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (r: Receptivo) => {
    setEditing(r);
    setForm({ nombre: r.nombre, tipo: r.tipo, contratoActivo: r.contratoActivo, emailContacto: r.emailContacto, telefono: r.telefono, pais: r.pais });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }

    const duplicado = receptivos.find(r => normalizeText(r.nombre) === normalizeText(form.nombre) && (!editing || r.id !== editing.id));
    if (duplicado) {
      toast.error(`Ya existe un receptivo con el nombre "${duplicado.nombre}"`);
      return;
    }

    try {
      if (editing) { hostDb.receptivos.update(editing.id, form); toast.success('Receptivo actualizado'); }
      else { hostDb.receptivos.create(form); toast.success('Receptivo creado'); }
      setIsDialogOpen(false);
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = (r: Receptivo) => {
    const evtCount = hostDb.eventosConfirmados.getByReceptivo(r.id).length;
    const solCount = hostDb.solicitudes.getByReceptivo(r.id).length;
    if (evtCount > 0 || solCount > 0) { toast.error(`No se puede eliminar: tiene ${evtCount} evento(s) y ${solCount} solicitud(es)`); return; }
    setDeleteConfirm({ open: true, receptivo: r });
  };

  const confirmDeleteReceptivo = () => {
    if (deleteConfirm.receptivo) {
      hostDb.receptivos.delete(deleteConfirm.receptivo.id);
      toast.success('Eliminado');
      loadData();
    }
    setDeleteConfirm({ open: false, receptivo: null });
  };

  const getEventCount = (id: string) => hostDb.eventosConfirmados.getByReceptivo(id).length;
  const getSolicitudCount = (id: string) => hostDb.solicitudes.getByReceptivo(id).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Receptivos</h1>
            <p className="text-muted-foreground mt-1">Operadores y clientes del hotel</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/host')}><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
            <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo Receptivo</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="cliente">Clientes con Contrato</TabsTrigger>
            <TabsTrigger value="no_cliente">Otros Receptivos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar receptivos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Solicitudes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay receptivos</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell><Badge variant={r.tipo === 'cliente' ? 'default' : 'secondary'}>{r.tipo === 'cliente' ? 'Cliente' : 'No cliente'}</Badge></TableCell>
                  <TableCell>{r.contratoActivo ? <Badge className="bg-accent/10 text-accent">✓ Activo</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                  <TableCell className="text-xs">{r.emailContacto}</TableCell>
                  <TableCell className="text-xs">{r.telefono}</TableCell>
                  <TableCell>{r.pais}</TableCell>
                  <TableCell className="text-center">{getEventCount(r.id)}</TableCell>
                  <TableCell className="text-center">{getSolicitudCount(r.id)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Receptivo' : 'Nuevo Receptivo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: 'cliente' | 'no_cliente') => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="no_cliente">No Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>País</Label><Input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.emailContacto} onChange={e => setForm({ ...form, emailContacto: e.target.value })} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.contratoActivo} onCheckedChange={v => setForm({ ...form, contratoActivo: v })} />
              <Label>Contrato Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Eliminar Receptivo"
        description="¿Está seguro de que desea eliminar este receptivo? Esta acción no se puede deshacer."
        itemName={deleteConfirm.receptivo?.nombre}
        itemType="Receptivo"
        variant="danger"
        onConfirm={confirmDeleteReceptivo}
      />
    </DashboardLayout>
  );
}
