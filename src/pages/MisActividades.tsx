import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ui/image-gallery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { db, ActividadSocial, ReservaActividadSocial } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin, Users, DollarSign, Bus, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MisActividades() {
  const { user } = useAuth();
  const [actividades, setActividades] = useState<ActividadSocial[]>([]);
  const [misReservas, setMisReservas] = useState<ReservaActividadSocial[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadSocial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = () => {
    if (!user) return;

    const todasActividades = db.actividadesSociales.getAll().filter(a => a.estado === 'ACTIVO');
    setActividades(todasActividades);

    const reservas = db.reservasActividades.getByUsuario(user.id);
    setMisReservas(reservas);
    setLoading(false);
  };

  const getReservasCount = (actividadId: string) => {
    return db.reservasActividades.countByActividad(actividadId);
  };

  const getMiReserva = (actividadId: string) => {
    return db.reservasActividades.getByActividadAndUsuario(actividadId, user?.id || '');
  };

  const handleReservar = (actividad: ActividadSocial) => {
    if (!user) {
      toast.error('Debe iniciar sesión para reservar');
      return;
    }

    const yaReservada = getMiReserva(actividad.id);
    if (yaReservada) {
      handleCancelar(actividad.id);
      return;
    }

    const count = getReservasCount(actividad.id);
    if (count >= actividad.cupoMaximo) {
      toast.error('Esta actividad está completa');
      return;
    }

    if (new Date() > new Date(actividad.fechaLimiteReserva)) {
      toast.error('La fecha límite de reserva ha pasado');
      return;
    }

    const monto = actividad.esGratuita ? 0 : actividad.costo.moneda;

    db.reservasActividades.create({
      actividadId: actividad.id,
      usuarioId: user.id,
      estadoPago: monto === 0 ? 'COMPLETADO' : 'PENDIENTE',
      montoPagado: 0,
    });

    toast.success('¡Reserva realizada con éxito!');
    loadData();
  };

  const handleCancelar = (actividadId: string) => {
    const reserva = getMiReserva(actividadId);
    if (reserva) {
      db.reservasActividades.delete(reserva.id);
      toast.success('Reserva cancelada');
      loadData();
    }
  };

  const getTotalAPagar = () => {
    return misReservas.reduce((sum, r) => {
      const actividad = actividades.find(a => a.id === r.actividadId);
      if (!actividad) return sum;
      return sum + (actividad.esGratuita ? 0 : actividad.costo.moneda);
    }, 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Programa Social</h1>
          <p className="text-muted-foreground mt-1">
            Reserve sus actividades opcionales
          </p>
        </div>

        {/* Mis Reservas */}
        {misReservas.length > 0 && (
          <Card className="bg-primary/5 border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Mis Reservas ({misReservas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total a pagar:</p>
                  <p className="text-2xl font-bold">${getTotalAPagar()} USD</p>
                </div>
                <Button>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pagar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actividades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actividades.map(actividad => {
            const reservasCount = getReservasCount(actividad.id);
            const miReserva = getMiReserva(actividad.id);
            const disponible = reservasCount < actividad.cupoMaximo;
            const pasoFechaLimite = new Date() > new Date(actividad.fechaLimiteReserva);
            const puedeReservar = disponible && !pasoFechaLimite;

            return (
              <Card key={actividad.id} className={miReserva ? 'border-green-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{actividad.nombre}</CardTitle>
                    {miReserva && (
                      <Badge variant="default" className="bg-green-500">
                        Reservado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {actividad.descripcion || 'Sin descripción'}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{actividad.fecha}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{actividad.horaInicio} - {actividad.horaFin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{actividad.puntoEncuentro}</span>
                    </div>
                    {actividad.requiereTransporte && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bus className="w-4 h-4" />
                        <span>Transporte incluido</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        {reservasCount}/{actividad.cupoMaximo}
                      </p>
                      {!disponible && !miReserva && (
                        <Badge variant="destructive" className="mt-1">Completo</Badge>
                      )}
                    </div>
                    {!actividad.esGratuita && (
                      <p className="text-lg font-bold">
                        ${actividad.costo.moneda} {actividad.costo.monedaSeleccionada}
                      </p>
                    )}
                    {actividad.esGratuita && (
                      <Badge variant="outline">Gratuito</Badge>
                    )}
                  </div>

                  {pasoFechaLimite && !miReserva && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Reservas cerradas</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {actividad.imagenes.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedActividad(actividad);
                          setIsDialogOpen(true);
                        }}
                      >
                        Ver Imágenes
                      </Button>
                    )}
                    <Button
                      variant={miReserva ? 'destructive' : 'default'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReservar(actividad)}
                      disabled={!puedeReservar && !miReserva}
                    >
                      {miReserva ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Reservar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {actividades.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay actividades disponibles en este momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedActividad?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedActividad && selectedActividad.imagenes.length > 0 && (
            <ImageGallery images={selectedActividad.imagenes} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
