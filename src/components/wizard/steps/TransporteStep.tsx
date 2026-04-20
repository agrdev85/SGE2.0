import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { db, NomTipoTransporte, RutaTransporte } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Save, Bus, DollarSign, MapPin, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmation';

interface RutaFormData {
  nombre: string;
  origen: string;
  destino: string;
  tipoVehiculoId: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: 'CUP' | 'USD' | 'EUR';
  activo: boolean;
}

export function TransporteStep() {
  const { evento, guardarYContinuar, state } = useWizard();
  const { confirm, success } = useConfirmation();
  const [tiposVehiculo, setTiposVehiculo] = useState<NomTipoTransporte[]>([]);
  const [rutas, setRutas] = useState<RutaTransporte[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RutaTransporte | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm: RutaFormData = {
    nombre: '',
    origen: '',
    destino: '',
    tipoVehiculoId: '',
    precioCUP: 0,
    precioMoneda: 0,
    moneda: 'USD',
    activo: true,
  };

  const [form, setForm] = useState<RutaFormData>(emptyForm);

  useEffect(() => {
    loadData();
  }, [evento?.id]);

  const loadData = () => {
    setTiposVehiculo(db.nomTiposTransporte.getAll());
    if (evento?.id) {
      setRutas(db.rutasTransporte.getByEvento(evento.id));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (r: RutaTransporte) => {
    setEditing(r);
    setForm({
      nombre: r.nombre,
      origen: r.origen,
      destino: r.destino,
      tipoVehiculoId: r.tipoVehiculoId,
      precioCUP: r.precio.CUP,
      precioMoneda: r.precio.moneda,
      moneda: r.precio.monedaSeleccionada,
      activo: r.activo,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }
    if (!form.origen) { toast.error('El origen es obligatorio'); return; }
    if (!form.destino) { toast.error('El destino es obligatorio'); return; }
    if (!form.tipoVehiculoId) { toast.error('Seleccione tipo de vehículo'); return; }

    try {
      const data = {
        eventoId: evento?.id || '',
        nombre: form.nombre,
        origen: form.origen,
        destino: form.destino,
        tipoVehiculoId: form.tipoVehiculoId,
        precio: { CUP: form.precioCUP, moneda: form.precioMoneda, monedaSeleccionada: form.moneda },
        activo: form.activo,
      };

      if (editing) {
        db.rutasTransporte.update(editing.id, data);
        toast.success('Ruta actualizada');
        success({ title: '¡Guardado!', description: 'Ruta actualizada correctamente' });
      } else {
        db.rutasTransporte.create(data);
        toast.success('Ruta creada');
        success({ title: '¡Guardado!', description: 'Ruta creada correctamente' });
      }
      setIsDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const handleDelete = async (r: RutaTransporte) => {
    await confirm({
      title: '¿Eliminar ruta?',
      description: `¿Está seguro de que desea eliminar "${r.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.rutasTransporte.delete(r.id);
        loadData();
      },
      successMessage: `"${r.nombre}" ha sido eliminada correctamente.`,
    });
  };

  const handleGuardarPaso = async () => {
    setIsSaving(true);
    try {
      await guardarYContinuar(4, {} as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  const getTipoVehiculoNombre = (id: string) => {
    const tipo = tiposVehiculo.find(t => t.id === id);
    return tipo?.nombre || id;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transporte y Logística</CardTitle>
              <CardDescription>
                Configure las rutas de transporte disponibles para este evento
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Ruta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tiposVehiculo.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay tipos de transporte configurados en el sistema.</p>
              <p className="text-sm">Solicite al SuperAdmin que configure los tipos de transporte.</p>
            </div>
          ) : rutas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay rutas de transporte configuradas</p>
              <p className="text-sm">Haga clic en "Nueva Ruta" para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="text-center">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rutas.map(ruta => (
                  <TableRow key={ruta.id}>
                    <TableCell className="font-medium">{ruta.nombre}</TableCell>
                    <TableCell>{ruta.origen}</TableCell>
                    <TableCell>{ruta.destino}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Bus className="w-3 h-3 mr-1" />
                        {getTipoVehiculoNombre(ruta.tipoVehiculoId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span>${ruta.precio.moneda} {ruta.precio.monedaSeleccionada || ruta.precio.monedaSeleccionada}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ruta.activo ? 'default' : 'secondary'}>
                        {ruta.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ruta)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ruta)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rutas.length}</p>
                <p className="text-xs text-muted-foreground">Rutas Configuradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rutas.filter(r => r.activo).length}</p>
                <p className="text-xs text-muted-foreground">Rutas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${rutas.reduce((sum, r) => sum + (r.precio.monedaSeleccionada === 'USD' ? r.precio.moneda : 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total USD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nueva'} Ruta de Transporte</DialogTitle>
            <DialogDescription>
              Complete la información de la ruta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Ruta *</Label>
              <Input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Aeropuerto - Hotel Nacional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen *</Label>
                <Input
                  value={form.origen}
                  onChange={e => setForm({ ...form, origen: e.target.value })}
                  placeholder="Ej: Aeropuerto José Martí"
                />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input
                  value={form.destino}
                  onChange={e => setForm({ ...form, destino: e.target.value })}
                  placeholder="Ej: Hotel Nacional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vehículo *</Label>
              <select
                value={form.tipoVehiculoId}
                onChange={e => setForm({ ...form, tipoVehiculoId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Seleccionar vehículo...</option>
                {tiposVehiculo.filter(t => t.activo).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.capacidadMin}-{t.capacidadMax} pers.)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio CUP</Label>
                <Input
                  type="number"
                  value={form.precioCUP}
                  onChange={e => setForm({ ...form, precioCUP: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Moneda</Label>
                <Input
                  type="number"
                  value={form.precioMoneda}
                  onChange={e => setForm({ ...form, precioMoneda: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <select
                  value={form.moneda}
                  onChange={e => setForm({ ...form, moneda: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CUP">CUP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={e => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="activo">Ruta activa</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-start">
        <Button onClick={handleGuardarPaso} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>

    </div>
  );
}

export default TransporteStep;
