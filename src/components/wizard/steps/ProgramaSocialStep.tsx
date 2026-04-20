import React, { useState, useEffect } from 'react';
import { db, ActividadSocial, ReservaActividadSocial } from '@/lib/database';
import { useWizard } from '@/contexts/WizardContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Plus, Pencil, Trash2, Users, Calendar, Clock, DollarSign, Bus, Globe, Save, Eye, ChevronRight, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmation';

const TIPOS_VEHICULO = [
  { id: 'tt1', nombre: 'Autobús' },
  { id: 'tt2', nombre: 'Minivan' },
  { id: 'tt3', nombre: 'Taxi' },
  { id: 'tt4', nombre: 'Transfer VIP' },
];

const IDIOMAS = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán'];

interface ActividadFormData {
  nombre: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  puntoEncuentro: string;
  horaEncuentro: string;
  destino: string;
  direccionExacta: string;
  esGratuita: boolean;
  costoCUP: number;
  costoMoneda: number;
  monedaSeleccionada: 'CUP' | 'USD' | 'EUR';
  cupoMaximo: number;
  cupoMinimo: number;
  fechaLimiteReserva: string;
  requiereTransporte: boolean;
  tipoVehiculo: string;
  guiaIncluido: boolean;
  idiomaGuia: string[];
  imagenes: string[];
}

export function ProgramaSocialStep() {
  const { evento, guardarYContinuar, state } = useWizard();
  const { confirm, success } = useConfirmation();
  const [actividades, setActividades] = useState<ActividadSocial[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editing, setEditing] = useState<ActividadSocial | null>(null);
  const [viewing, setViewing] = useState<ActividadSocial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm: ActividadFormData = {
    nombre: '',
    descripcion: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    puntoEncuentro: '',
    horaEncuentro: '',
    destino: '',
    direccionExacta: '',
    esGratuita: false,
    costoCUP: 0,
    costoMoneda: 0,
    monedaSeleccionada: 'USD',
    cupoMaximo: 0,
    cupoMinimo: 0,
    fechaLimiteReserva: '',
    requiereTransporte: false,
    tipoVehiculo: '',
    guiaIncluido: false,
    idiomaGuia: [],
    imagenes: [],
  };

  const [form, setForm] = useState<ActividadFormData>(emptyForm);

  useEffect(() => {
    loadActividades();
  }, [evento?.id]);

  const loadActividades = () => {
    if (evento?.id) {
      setActividades(db.actividadesSociales.getByEvento(evento.id));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (a: ActividadSocial) => {
    setEditing(a);
    setForm({
      nombre: a.nombre,
      descripcion: a.descripcion,
      fecha: a.fecha,
      horaInicio: a.horaInicio,
      horaFin: a.horaFin,
      puntoEncuentro: a.puntoEncuentro,
      horaEncuentro: a.horaEncuentro,
      destino: a.destino,
      direccionExacta: a.direccionExacta,
      esGratuita: a.esGratuita,
      costoCUP: a.costo.CUP,
      costoMoneda: a.costo.moneda,
      monedaSeleccionada: a.costo.monedaSeleccionada,
      cupoMaximo: a.cupoMaximo,
      cupoMinimo: a.cupoMinimo,
      fechaLimiteReserva: a.fechaLimiteReserva,
      requiereTransporte: a.requiereTransporte,
      tipoVehiculo: a.tipoVehiculo || '',
      guiaIncluido: a.guiaIncluido,
      idiomaGuia: a.idiomaGuia || [],
      imagenes: a.imagenes,
    });
    setIsDialogOpen(true);
  };

  const openView = (a: ActividadSocial) => {
    setViewing(a);
    setIsViewOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }
    if (!form.fecha) { toast.error('La fecha es obligatoria'); return; }
    if (form.cupoMaximo <= 0) { toast.error('El cupo máximo debe ser mayor a 0'); return; }

    try {
      const data: Omit<ActividadSocial, 'id' | 'createdAt'> = {
        eventoId: evento?.id || '',
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        puntoEncuentro: form.puntoEncuentro,
        horaEncuentro: form.horaEncuentro,
        destino: form.destino,
        direccionExacta: form.direccionExacta,
        esGratuita: form.esGratuita,
        costo: {
          CUP: form.costoCUP,
          moneda: form.costoMoneda,
          monedaSeleccionada: form.monedaSeleccionada,
        },
        cupoMaximo: form.cupoMaximo,
        cupoMinimo: form.cupoMinimo,
        fechaLimiteReserva: form.fechaLimiteReserva,
        requiereTransporte: form.requiereTransporte,
        tipoVehiculo: form.tipoVehiculo,
        guiaIncluido: form.guiaIncluido,
        idiomaGuia: form.idiomaGuia,
        imagenes: form.imagenes,
        estado: 'ACTIVO',
      };

      if (editing) {
        db.actividadesSociales.update(editing.id, data);
        toast.success('Actividad actualizada');
        success({ title: '¡Guardado!', description: 'Actividad actualizada correctamente' });
      } else {
        db.actividadesSociales.create(data);
        toast.success('Actividad creada');
        success({ title: '¡Guardado!', description: 'Actividad creada correctamente' });
      }
      setIsDialogOpen(false);
      loadActividades();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const handleDelete = async (a: ActividadSocial) => {
    await confirm({
      title: '¿Eliminar actividad?',
      description: `¿Está seguro de que desea eliminar "${a.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.actividadesSociales.delete(a.id);
        loadActividades();
      },
      successMessage: `"${a.nombre}" ha sido eliminada correctamente.`,
    });
  };

  const toggleIdioma = (idioma: string) => {
    setForm(prev => ({
      ...prev,
      idiomaGuia: prev.idiomaGuia.includes(idioma)
        ? prev.idiomaGuia.filter(i => i !== idioma)
        : [...prev.idiomaGuia, idioma],
    }));
  };

  const getReservasCount = (actividadId: string) => {
    return db.reservasActividades.countByActividad(actividadId);
  };

  const getIngresosEstimados = (actividadId: string) => {
    const reservas = db.reservasActividades.getByActividad(actividadId);
    return reservas.reduce((sum, r) => sum + r.montoPagado, 0);
  };

  const handleGuardarPaso = async () => {
    setIsSaving(true);
    try {
      await guardarYContinuar(5, {} as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{actividades.length}</p>
                <p className="text-xs text-muted-foreground">Actividades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {actividades.reduce((sum, a) => sum + getReservasCount(a.id), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Reservas</p>
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
                  ${actividades.reduce((sum, a) => sum + getIngresosEstimados(a.id), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Ingresos USD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actividades Configuradas</CardTitle>
              <CardDescription>
                Gestione las excursiones y actividades opcionales
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Actividad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actividades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay actividades configuradas</p>
              <p className="text-sm">Haga clic en "Nueva Actividad" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actividades.map(actividad => {
                const reservas = getReservasCount(actividad.id);
                const ingresos = getIngresosEstimados(actividad.id);
                return (
                  <div key={actividad.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{actividad.nombre}</h4>
                          <Badge variant={actividad.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                            {actividad.estado === 'ACTIVO' ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {actividad.esGratuita && (
                            <Badge variant="outline">Gratuita</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {actividad.fecha}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {actividad.horaInicio} - {actividad.horaFin}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {reservas}/{actividad.cupoMaximo}
                          </span>
                          {!actividad.esGratuita && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${actividad.costo.moneda} {actividad.costo.monedaSeleccionada}
                            </span>
                          )}
                          {actividad.requiereTransporte && (
                            <span className="flex items-center gap-1">
                              <Bus className="w-4 h-4" />
                              Transporte
                            </span>
                          )}
                        </div>
                        {actividad.imagenes.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {actividad.imagenes.slice(0, 3).map((img, i) => (
                              <img key={i} src={img} alt="" className="w-12 h-12 rounded object-cover" />
                            ))}
                            {actividad.imagenes.length > 3 && (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs">
                                +{actividad.imagenes.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(actividad)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(actividad)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(actividad)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Actividad' : 'Nueva Actividad Social'}</DialogTitle>
            <DialogDescription>
              Complete la información de la actividad o excursión
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Nombre de la Actividad *</Label>
              <Input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Excursión a Viñales"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describa la actividad..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={e => setForm({ ...form, horaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={form.horaFin}
                  onChange={e => setForm({ ...form, horaFin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Punto de Encuentro</Label>
                <Input
                  value={form.puntoEncuentro}
                  onChange={e => setForm({ ...form, puntoEncuentro: e.target.value })}
                  placeholder="Ej: Lobby del Hotel Nacional"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Encuentro</Label>
                <Input
                  type="time"
                  value={form.horaEncuentro}
                  onChange={e => setForm({ ...form, horaEncuentro: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  value={form.destino}
                  onChange={e => setForm({ ...form, destino: e.target.value })}
                  placeholder="Ej: Valle de Viñales"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección Exacta</Label>
                <Input
                  value={form.direccionExacta}
                  onChange={e => setForm({ ...form, direccionExacta: e.target.value })}
                  placeholder="Carretera a Viñales, km 5"
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.esGratuita}
                    onCheckedChange={v => setForm({ ...form, esGratuita: v })}
                  />
                  <Label>Actividad Gratuita</Label>
                </div>
              </div>

              {!form.esGratuita && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Precio CUP</Label>
                    <Input
                      type="number"
                      value={form.costoCUP}
                      onChange={e => setForm({ ...form, costoCUP: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Moneda</Label>
                    <Input
                      type="number"
                      value={form.costoMoneda}
                      onChange={e => setForm({ ...form, costoMoneda: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={form.monedaSeleccionada} onValueChange={v => setForm({ ...form, monedaSeleccionada: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="CUP">CUP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cupo Máximo *</Label>
                <Input
                  type="number"
                  value={form.cupoMaximo}
                  onChange={e => setForm({ ...form, cupoMaximo: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cupo Mínimo</Label>
                <Input
                  type="number"
                  value={form.cupoMinimo}
                  onChange={e => setForm({ ...form, cupoMinimo: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Límite Reserva</Label>
                <Input
                  type="date"
                  value={form.fechaLimiteReserva}
                  onChange={e => setForm({ ...form, fechaLimiteReserva: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <Label>Logística</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.requiereTransporte}
                    onCheckedChange={v => setForm({ ...form, requiereTransporte: v })}
                  />
                  <Label>Requiere Transporte</Label>
                </div>
              </div>

              {form.requiereTransporte && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Vehículo</Label>
                      <Select value={form.tipoVehiculo} onValueChange={v => setForm({ ...form, tipoVehiculo: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_VEHICULO.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.guiaIncluido}
                        onCheckedChange={v => setForm({ ...form, guiaIncluido: v })}
                      />
                      <Label>Guía Incluido</Label>
                    </div>
                  </div>
                  {form.guiaIncluido && (
                    <div className="space-y-2">
                      <Label>Idiomas del Guía</Label>
                      <div className="flex flex-wrap gap-2">
                        {IDIOMAS.map(idioma => (
                          <Button
                            key={idioma}
                            variant={form.idiomaGuia.includes(idioma) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleIdioma(idioma)}
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            {idioma}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imágenes</Label>
              <MultiImageUpload
                images={form.imagenes}
                onChange={imagenes => setForm({ ...form, imagenes })}
                maxImages={10}
              />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.nombre}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <p className="text-muted-foreground">{viewing.descripcion}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p>{viewing.fecha}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horario</Label>
                  <p>{viewing.horaInicio} - {viewing.horaFin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Punto de Encuentro</Label>
                  <p>{viewing.puntoEncuentro}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p>{viewing.destino}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cupo</Label>
                  <p>{getReservasCount(viewing.id)} / {viewing.cupoMaximo}</p>
                </div>
                {!viewing.esGratuita && (
                  <div>
                    <Label className="text-muted-foreground">Precio</Label>
                    <p>${viewing.costo.moneda} {viewing.costo.monedaSeleccionada}</p>
                  </div>
                )}
              </div>

              {viewing.imagenes.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Imágenes</Label>
                  <ImageGallery images={viewing.imagenes} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
            <Button onClick={() => { setIsViewOpen(false); if (viewing) openEdit(viewing); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
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

export default ProgramaSocialStep;
