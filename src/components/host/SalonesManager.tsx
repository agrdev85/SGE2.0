import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { ImageGallery } from '@/components/ui/image-gallery';
import { db, Salon, NomHotel } from '@/lib/database';
import { normalizeText, isDuplicate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Image as ImageIcon, Search, Eye, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface SalonFormData {
  hotelId: string;
  codigo: string;
  nombre: string;
  ubicacion: string;
  capacidadMaxima: number;
  estado: 'ACTIVO' | 'INACTIVO';
  imagenes: string[];
}

export function SalonesManager() {
  const [salones, setSalones] = useState<Salon[]>([]);
  const [hoteles, setHoteles] = useState<NomHotel[]>([]);
  const [search, setSearch] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editing, setEditing] = useState<Salon | null>(null);
  const [viewing, setViewing] = useState<Salon | null>(null);
  const [form, setForm] = useState<SalonFormData>({
    hotelId: '',
    codigo: '',
    nombre: '',
    ubicacion: '',
    capacidadMaxima: 0,
    estado: 'ACTIVO',
    imagenes: [],
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    salon: Salon | null;
  }>({ open: false, salon: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSalones(db.salones.getAll());
    setHoteles(db.nomHoteles.getAll());
  };

  const filteredSalones = salones.filter(s => {
    const q = search.toLowerCase();
    const matchHotel = selectedHotel === 'all' || s.hotelId === selectedHotel;
    const matchSearch = !q || 
      s.nombre.toLowerCase().includes(q) || 
      s.codigo.toLowerCase().includes(q) ||
      s.ubicacion.toLowerCase().includes(q);
    return matchHotel && matchSearch;
  });

  const getHotelNombre = (hotelId: string) => {
    const hotel = hoteles.find(h => h.id === hotelId);
    return hotel?.nombre || hotelId;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      hotelId: selectedHotel !== 'all' ? selectedHotel : '',
      codigo: '',
      nombre: '',
      ubicacion: '',
      capacidadMaxima: 0,
      estado: 'ACTIVO',
      imagenes: [],
    });
    setIsDialogOpen(true);
  };

  const openEdit = (s: Salon) => {
    setEditing(s);
    setForm({
      hotelId: s.hotelId,
      codigo: s.codigo,
      nombre: s.nombre,
      ubicacion: s.ubicacion,
      capacidadMaxima: s.capacidadMaxima,
      estado: s.estado,
      imagenes: s.imagenes,
    });
    setIsDialogOpen(true);
  };

  const openView = (s: Salon) => {
    setViewing(s);
    setIsViewOpen(true);
  };

  const handleSave = () => {
    if (!form.hotelId) { toast.error('Seleccione un hotel'); return; }
    if (!form.codigo) { toast.error('El código es obligatorio'); return; }
    if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }
    if (form.capacidadMaxima <= 0) { toast.error('La capacidad debe ser mayor a 0'); return; }

    const salonesDelHotel = salones.filter(s => s.hotelId === form.hotelId);
    const codigoDuplicado = salonesDelHotel.find(s => normalizeText(s.codigo) === normalizeText(form.codigo) && (!editing || s.id !== editing.id));
    if (codigoDuplicado) {
      toast.error(`Ya existe un salón con el código "${codigoDuplicado.codigo}" en este hotel`);
      return;
    }

    try {
      if (editing) {
        db.salones.update(editing.id, form);
        toast.success('Salón actualizado');
      } else {
        db.salones.create(form);
        toast.success('Salón creado');
      }
      setIsDialogOpen(false);
      loadData();
    } catch (e: any) { 
      toast.error(e.message || 'Error al guardar'); 
    }
  };

  const handleDelete = (s: Salon) => {
    const { can, reason } = db.salones.canDelete(s.id);
    if (!can) { 
      toast.error(<div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {reason}</div>); 
      return; 
    }
    setDeleteConfirm({ open: true, salon: s });
  };

  const confirmDeleteSalon = () => {
    if (deleteConfirm.salon) {
      db.salones.delete(deleteConfirm.salon.id);
      toast.success('Salón eliminado');
      loadData();
    }
    setDeleteConfirm({ open: false, salon: null });
  };

  const toggleEstado = (s: Salon) => {
    const newEstado = s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    db.salones.update(s.id, { estado: newEstado });
    toast.success(`Salón ${newEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Salones por Hotel</h1>
          <p className="text-muted-foreground mt-1">Gestión de espacios y capacidades</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Salón
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, código o ubicación..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={selectedHotel} onValueChange={setSelectedHotel}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por hotel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los hoteles</SelectItem>
            {hoteles.map(h => (
              <SelectItem key={h.id} value={h.id}>
                {h.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{salones.length}</div>
            <p className="text-xs text-muted-foreground">Total Salones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{salones.filter(s => s.estado === 'ACTIVO').length}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {salones.reduce((sum, s) => sum + s.capacidadMaxima, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Capacidad Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Imágenes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay salones que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredSalones.map(salon => (
                  <TableRow key={salon.id} className={salon.estado === 'INACTIVO' ? 'opacity-60' : ''}>
                    <TableCell>
                      <Badge variant="outline">{salon.codigo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{salon.nombre}</TableCell>
                    <TableCell>{getHotelNombre(salon.hotelId)}</TableCell>
                    <TableCell className="text-muted-foreground">{salon.ubicacion}</TableCell>
                    <TableCell className="text-center">{salon.capacidadMaxima}</TableCell>
                    <TableCell>
                      <Badge variant={salon.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                        {salon.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {salon.imagenes.length > 0 ? (
                        <Button variant="ghost" size="sm" onClick={() => openView(salon)}>
                          <ImageIcon className="h-4 w-4 mr-1" />
                          {salon.imagenes.length}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin fotos</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(salon)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(salon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(salon)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Salón' : 'Nuevo Salón'}</DialogTitle>
            <DialogDescription>
              Complete la información del salón. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hotel *</Label>
                <Select value={form.hotelId} onValueChange={v => setForm({ ...form, hotelId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.filter(h => h.activo).map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input 
                  value={form.codigo} 
                  onChange={e => setForm({ ...form, codigo: e.target.value })} 
                  placeholder="Ej: SAL-CONV-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Salón *</Label>
                <Input 
                  value={form.nombre} 
                  onChange={e => setForm({ ...form, nombre: e.target.value })} 
                  placeholder="Ej: Salón de Convenciones"
                />
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input 
                  value={form.ubicacion} 
                  onChange={e => setForm({ ...form, ubicacion: e.target.value })} 
                  placeholder="Ej: Piso 1, Ala Norte"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capacidad Máxima *</Label>
              <Input 
                type="number" 
                value={form.capacidadMaxima} 
                onChange={e => setForm({ ...form, capacidadMaxima: parseInt(e.target.value) || 0 })} 
                placeholder="Número máximo de personas"
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Imágenes del Salón</Label>
              <p className="text-xs text-muted-foreground">
                Suba varias fotos del salón en diferentes configuraciones
              </p>
              <MultiImageUpload 
                images={form.imagenes}
                onChange={imagenes => setForm({ ...form, imagenes })}
                maxImages={10}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.estado === 'ACTIVO'} 
                  onCheckedChange={v => setForm({ ...form, estado: v ? 'ACTIVO' : 'INACTIVO' })} 
                />
                <Label>Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.nombre}</DialogTitle>
            <DialogDescription>
              {viewing?.codigo} - {getHotelNombre(viewing?.hotelId || '')}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ubicación</Label>
                  <p className="font-medium">{viewing.ubicacion || 'No especificada'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacidad Máxima</Label>
                  <p className="font-medium">{viewing.capacidadMaxima} personas</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <p className="font-medium">
                    <Badge variant={viewing.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                      {viewing.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Imágenes ({viewing.imagenes.length})</Label>
                <ImageGallery 
                  images={viewing.imagenes}
                  title={`${viewing.nombre} - Configuraciones`}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => { setIsViewOpen(false); if (viewing) openEdit(viewing); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Eliminar Salón"
        description="¿Está seguro de que desea eliminar este salón? Esta acción no se puede deshacer."
        itemName={deleteConfirm.salon?.nombre}
        itemType="Salón"
        variant="danger"
        onConfirm={confirmDeleteSalon}
      />
    </div>
  );
}

export default SalonesManager;
