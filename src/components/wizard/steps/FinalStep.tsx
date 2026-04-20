import React, { useState, useMemo } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, AlertCircle, Globe, Building2, MapPin, Users, Bus, Calendar, Layers, Save, Rocket, DollarSign, BedDouble, UserCheck, Ticket, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useConfirmation } from '@/hooks/useConfirmation';

export function FinalStep() {
  const { evento, guardarYContinuar, state, getPasosInfo, irAPaso } = useWizard();
  const { success } = useConfirmation();
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pasosInfo = getPasosInfo();
  const pasosRequeridos = [1, 2, 3, 4, 5, 6, 7];
  const pasosFaltantes = pasosRequeridos.filter(p => !state.pasosCompletados.includes(p));

  const getResumen = () => {
    if (!evento?.id) return null;

    return {
      hoteles: db.eventoHoteles.getByEvento(evento.id).length,
      salones: db.eventoSalones.getByEvento(evento.id).length,
      tiposParticipacion: db.eventoTiposParticipacion.getByEvento(evento.id).length,
      rutasTransporte: db.rutasTransporte.getByEvento(evento.id).length,
      actividadesSociales: db.actividadesSociales.getByEvento(evento.id).length,
      subEventos: db.subEventos.getByEvento(evento.id).length,
      tematicas: db.nomencladoresEvento.getByEventoAndTipo(evento.id, 'TEMATICA').length,
    };
  };

  const resumen = getResumen();

  const preciosDetallados = useMemo(() => {
    if (!evento?.id) return { habitaciones: [], participacion: [], transporte: [], actividades: [], totales: { habitaciones: 0, participacion: 0, transporte: 0, actividades: 0 } };

    const habitacionesData: { hotel: string; tipo: string; precioCUP: number; precioMoneda: number; moneda: string; cupo: number }[] = [];
    const participacionData: { nombre: string; precioCUP: number; precioMoneda: number; moneda: string; capacidad: number }[] = [];
    const transporteData: { nombre: string; precio: number; moneda: string }[] = [];
    const actividadesData: { nombre: string; precio: number; moneda: string; requiereTransporte: boolean; guia: boolean }[] = [];

    let totalHabitacionesCUP = 0;
    let totalHabitacionesUSD = 0;
    let totalParticipacionCUP = 0;
    let totalParticipacionUSD = 0;
    let totalTransporte = 0;
    let totalActividades = 0;

    const eventoHoteles = db.eventoHoteles.getByEvento(evento.id);
    eventoHoteles.forEach(eh => {
      const hotel = db.nomHoteles.getById(eh.hotelId);
      const habitaciones = db.eventoHotelHabitaciones.getByEventoHotel(eh.id);
      habitaciones.forEach(h => {
        const tipo = db.nomTiposHabitacion.getById(h.tipoHabitacionId);
        if (tipo) {
          habitacionesData.push({
            hotel: hotel?.nombre || 'Hotel',
            tipo: tipo.nombre,
            precioCUP: h.precioCUP,
            precioMoneda: h.precioMoneda,
            moneda: h.moneda,
            cupo: h.cupo,
          });
          totalHabitacionesCUP += h.precioCUP * h.cupo;
          totalHabitacionesUSD += h.precioMoneda * h.cupo;
        }
      });
    });

    const tiposParticipacion = db.eventoTiposParticipacion.getByEvento(evento.id);
    tiposParticipacion.forEach(tp => {
      const tipo = db.nomTiposParticipacion.getById(tp.tipoParticipacionId);
      if (tipo) {
        participacionData.push({
          nombre: tipo.nombre,
          precioCUP: tp.precioCUP,
          precioMoneda: tp.precioMoneda,
          moneda: tp.moneda,
          capacidad: tp.capacidad,
        });
        totalParticipacionCUP += tp.precioCUP * tp.capacidad;
        totalParticipacionUSD += tp.precioMoneda * tp.capacidad;
      }
    });

    const rutas = db.rutasTransporte.getByEvento(evento.id);
    rutas.forEach(r => {
      transporteData.push({
        nombre: r.nombre || r.origen + ' - ' + r.destino,
        precio: r.precio?.moneda || 0,
        moneda: r.precio?.monedaSeleccionada || 'USD',
      });
      totalTransporte += r.precio?.moneda || 0;
    });

    const actividades = db.actividadesSociales.getByEvento(evento.id);
    actividades.forEach(a => {
      const precioTotal = a.esGratuita ? 0 : (a.costo?.moneda || 0);
      actividadesData.push({
        nombre: a.nombre,
        precio: precioTotal,
        moneda: a.costo?.monedaSeleccionada || 'USD',
        requiereTransporte: a.requiereTransporte,
        guia: a.guiaIncluido,
      });
      totalActividades += precioTotal;
    });

    return {
      habitaciones: habitacionesData,
      participacion: participacionData,
      transporte: transporteData,
      actividades: actividadesData,
      totales: {
        habitaciones: totalHabitacionesUSD,
        participacion: totalParticipacionUSD,
        transporte: totalTransporte,
        actividades: totalActividades,
      },
    };
  }, [evento?.id]);

  const handleGuardar = async () => {
    setIsSaving(true);
    try {
      await guardarYContinuar(7, {} as any);
      success({ title: '¡Guardado!', description: 'Configuración guardada correctamente' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  const handlePublicar = async () => {
    if (pasosFaltantes.length > 0) {
      toast.error('Complete todos los pasos antes de publicar');
      return;
    }

    setIsPublishing(true);
    try {
      if (evento?.id) {
        db.macroEvents.update(evento.id, { isActive: true } as any);
      }
      await guardarYContinuar(7, {} as any);
      success({ title: '¡Publicado!', description: 'Evento publicado correctamente' });
      navigate('/events');
    } catch (error) {
      toast.error('Error al publicar');
    }
    setIsPublishing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Configuración</CardTitle>
          <CardDescription>
            Revise el resumen de la configuración de su evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {evento && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-lg">{evento.name}</h3>
              {evento.acronym && <Badge variant="outline">{evento.acronym}</Badge>}
              <p className="text-sm text-muted-foreground mt-2">
                {evento.startDate && evento.endDate && (
                  <span>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {evento.startDate} - {evento.endDate}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-blue-500/10 rounded">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.hoteles || 0}</p>
                <p className="text-xs text-muted-foreground">Hoteles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-purple-500/10 rounded">
                <MapPin className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.salones || 0}</p>
                <p className="text-xs text-muted-foreground">Salones</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-green-500/10 rounded">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.tiposParticipacion || 0}</p>
                <p className="text-xs text-muted-foreground">Tipos Participación</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-yellow-500/10 rounded">
                <Bus className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.rutasTransporte || 0}</p>
                <p className="text-xs text-muted-foreground">Rutas Transporte</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-pink-500/10 rounded">
                <Calendar className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.actividadesSociales || 0}</p>
                <p className="text-xs text-muted-foreground">Actividades</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-orange-500/10 rounded">
                <Globe className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.subEventos || 0}</p>
                <p className="text-xs text-muted-foreground">SubEventos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 bg-teal-500/10 rounded">
                <Layers className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen?.tematicas || 0}</p>
                <p className="text-xs text-muted-foreground">Temáticas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Precios */}
      {preciosDetallados.participacion.length > 0 || preciosDetallados.habitaciones.length > 0 || preciosDetallados.transporte.length > 0 || preciosDetallados.actividades.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <CardTitle>Resumen de Precios</CardTitle>
            </div>
            <CardDescription>
              Detalle de precios configurados para este evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="participacion" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {preciosDetallados.participacion.length > 0 && (
                  <TabsTrigger value="participacion" className="gap-1">
                    <UserCheck className="w-4 h-4" />
                    Participación
                  </TabsTrigger>
                )}
                {preciosDetallados.habitaciones.length > 0 && (
                  <TabsTrigger value="habitaciones" className="gap-1">
                    <BedDouble className="w-4 h-4" />
                    Habitaciones
                  </TabsTrigger>
                )}
                {preciosDetallados.transporte.length > 0 && (
                  <TabsTrigger value="transporte" className="gap-1">
                    <Bus className="w-4 h-4" />
                    Transporte
                  </TabsTrigger>
                )}
                {preciosDetallados.actividades.length > 0 && (
                  <TabsTrigger value="actividades" className="gap-1">
                    <Ticket className="w-4 h-4" />
                    Actividades
                  </TabsTrigger>
                )}
              </TabsList>

              {preciosDetallados.participacion.length > 0 && (
                <TabsContent value="participacion" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Participación</TableHead>
                        <TableHead className="text-right">Precio CUP</TableHead>
                        <TableHead className="text-right">Precio Moneda</TableHead>
                        <TableHead className="text-right">Moneda</TableHead>
                        <TableHead className="text-right">Capacidad</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preciosDetallados.participacion.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.nombre}</TableCell>
                          <TableCell className="text-right">{p.precioCUP > 0 ? `${p.precioCUP} CUP` : '-'}</TableCell>
                          <TableCell className="text-right">{p.precioMoneda > 0 ? `${p.precioMoneda}` : '-'}</TableCell>
                          <TableCell className="text-right">{p.moneda}</TableCell>
                          <TableCell className="text-right">{p.capacidad}</TableCell>
                          <TableCell className="text-right font-medium">
                            {p.moneda === 'USD' ? `${p.precioMoneda * p.capacidad} USD` : 
                             p.moneda === 'EUR' ? `${p.precioMoneda * p.capacidad} EUR` :
                             `${p.precioCUP * p.capacidad} CUP`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end p-3 bg-muted rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Participación</p>
                      <p className="text-xl font-bold">{preciosDetallados.totales.participacion} USD (estimado)</p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {preciosDetallados.habitaciones.length > 0 && (
                <TabsContent value="habitaciones" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead>Tipo Habitación</TableHead>
                        <TableHead className="text-right">Precio CUP</TableHead>
                        <TableHead className="text-right">Precio Moneda</TableHead>
                        <TableHead className="text-right">Moneda</TableHead>
                        <TableHead className="text-right">Cupo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preciosDetallados.habitaciones.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{h.hotel}</TableCell>
                          <TableCell>{h.tipo}</TableCell>
                          <TableCell className="text-right">{h.precioCUP > 0 ? `${h.precioCUP} CUP` : '-'}</TableCell>
                          <TableCell className="text-right">{h.precioMoneda > 0 ? `${h.precioMoneda}` : '-'}</TableCell>
                          <TableCell className="text-right">{h.moneda}</TableCell>
                          <TableCell className="text-right">{h.cupo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              )}

              {preciosDetallados.transporte.length > 0 && (
                <TabsContent value="transporte" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ruta</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Moneda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preciosDetallados.transporte.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{t.nombre}</TableCell>
                          <TableCell className="text-right">{t.precio}</TableCell>
                          <TableCell className="text-right">{t.moneda}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end p-3 bg-muted rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Transporte</p>
                      <p className="text-xl font-bold">{preciosDetallados.totales.transporte} USD</p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {preciosDetallados.actividades.length > 0 && (
                <TabsContent value="actividades" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actividad</TableHead>
                        <TableHead className="text-center">Transporte</TableHead>
                        <TableHead className="text-center">Guía</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Moneda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preciosDetallados.actividades.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{a.nombre}</TableCell>
                          <TableCell className="text-center">
                            {a.requiereTransporte ? <Badge variant="outline">Sí</Badge> : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {a.guia ? <Badge variant="outline">Incluido</Badge> : '-'}
                          </TableCell>
                          <TableCell className="text-right">{a.precio > 0 ? `${a.precio}` : 'Gratis'}</TableCell>
                          <TableCell className="text-right">{a.precio > 0 ? a.moneda : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end p-3 bg-muted rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Actividades</p>
                      <p className="text-xl font-bold">{preciosDetallados.totales.actividades} USD</p>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      {/* Gran Total */}
      {(preciosDetallados.participacion.length > 0 || preciosDetallados.habitaciones.length > 0 || preciosDetallados.transporte.length > 0 || preciosDetallados.actividades.length > 0) && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>Gran Total Estimado</CardTitle>
            </div>
            <CardDescription>
              Resumen general de precios del evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {preciosDetallados.participacion.length > 0 && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCheck className="w-4 h-4" /> Participación
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {preciosDetallados.totales.participacion.toLocaleString()} USD
                  </p>
                </div>
              )}
              {preciosDetallados.habitaciones.length > 0 && (
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <BedDouble className="w-4 h-4" /> Habitaciones
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {preciosDetallados.totales.habitaciones.toLocaleString()} USD
                  </p>
                </div>
              )}
              {preciosDetallados.transporte.length > 0 && (
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Bus className="w-4 h-4" /> Transporte
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {preciosDetallados.totales.transporte.toLocaleString()} USD
                  </p>
                </div>
              )}
              {preciosDetallados.actividades.length > 0 && (
                <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Ticket className="w-4 h-4" /> Actividades
                  </p>
                  <p className="text-2xl font-bold text-pink-600">
                    {preciosDetallados.totales.actividades.toLocaleString()} USD
                  </p>
                </div>
              )}
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                <p className="text-sm text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> TOTAL GENERAL
                </p>
                <p className="text-3xl font-bold text-primary">
                  {(
                    preciosDetallados.totales.participacion +
                    preciosDetallados.totales.habitaciones +
                    preciosDetallados.totales.transporte +
                    preciosDetallados.totales.actividades
                  ).toLocaleString()} USD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de Pasos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estado de Configuración</span>
            <span className="text-sm font-normal text-muted-foreground">
              {state.pasosCompletados.length} de {pasosRequeridos.length} pasos completados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {pasosInfo.filter(p => p.numero <= 7).map((paso, index) => (
              <button
                key={paso.numero}
                onClick={() => irAPaso(paso.numero)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  paso.estado === 'completado' 
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400' 
                    : paso.numero === state.pasoActual
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  paso.estado === 'completado' 
                    ? 'bg-green-500 text-white' 
                    : paso.numero === state.pasoActual
                    ? 'bg-primary text-white'
                    : 'bg-muted-foreground/20'
                }`}>
                  {paso.estado === 'completado' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    paso.numero
                  )}
                </div>
                <span className="text-sm font-medium">{paso.titulo}</span>
                {index < pasosInfo.filter(p => p.numero <= 7).length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                )}
              </button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Haz clic en cualquier paso para navegar directamente a él
          </p>
        </CardContent>
      </Card>

      {/* Alertas */}
      {pasosFaltantes.length > 0 && (
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-yellow-700 dark:text-yellow-500">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Pasos incompletos</p>
                <p className="text-sm">
                  Complete los siguientes pasos antes de publicar el evento:
                </p>
                <ul className="list-disc list-inside text-sm mt-2">
                  {pasosFaltantes.map(p => (
                    <li key={p}>{pasosInfo.find(pi => pi.numero === p)?.titulo}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">Acciones</h4>
              <p className="text-sm text-muted-foreground">
                {pasosFaltantes.length === 0 
                  ? '¡Todos los pasos están completados! Ya puede publicar el evento.'
                  : `Faltan ${pasosFaltantes.length} paso(s) por completar.`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Button
                variant="outline"
                onClick={() => irAPaso(state.pasoActual > 1 ? state.pasoActual - 1 : 1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Paso Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleGuardar}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleGuardar();
                  navigate('/events');
                }}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar y Salir
              </Button>
              <Button
                onClick={handlePublicar}
                disabled={isPublishing || pasosFaltantes.length > 0}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                Publicar Evento
              </Button>
            </div>
          </div>
          
          {/* Pasos faltantes como botones clicables */}
          {pasosFaltantes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm font-medium mb-2">Ir a paso pendiente:</p>
              <div className="flex flex-wrap gap-2">
                {pasosFaltantes.map(p => {
                  const info = pasosInfo.find(pi => pi.numero === p);
                  return (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      onClick={() => irAPaso(p)}
                      className="gap-2 text-yellow-600 border-yellow-500/50 hover:bg-yellow-500/10"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {info?.titulo || `Paso ${p}`}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinalStep;
