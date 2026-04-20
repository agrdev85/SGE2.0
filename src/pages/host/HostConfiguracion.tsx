import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hostDb, Hotel, ConfiguracionHotel } from '@/lib/hostDatabase';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function HostConfiguracion() {
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | undefined>();
  const [config, setConfig] = useState<ConfiguracionHotel | null>(null);

  const [hotelForm, setHotelForm] = useState({ nombre: '', direccion: '', telefono: '', email: '' });
  const [configForm, setConfigForm] = useState({
    horarioAtencionInicio: '09:00', horarioAtencionFin: '18:00',
    emailNotificaciones: '', prefijoBeo: 'BEO', prefijoSolicitud: 'SOL', prefijoEvento: 'EVT',
  });

  useEffect(() => {
    const h = hostDb.hoteles.getFirst();
    const c = hostDb.configuracion.get();
    setHotel(h);
    setConfig(c);
    if (h) setHotelForm({ nombre: h.nombre, direccion: h.direccion, telefono: h.telefono, email: h.email });
    if (c) setConfigForm({
      horarioAtencionInicio: c.horarioAtencionInicio, horarioAtencionFin: c.horarioAtencionFin,
      emailNotificaciones: c.emailNotificaciones, prefijoBeo: c.prefijoBeo, prefijoSolicitud: c.prefijoSolicitud, prefijoEvento: c.prefijoEvento,
    });
  }, []);

  const saveHotel = () => {
    if (hotel) { hostDb.hoteles.update(hotel.id, hotelForm); toast.success('Hotel actualizado'); }
  };

  const saveConfig = () => {
    hostDb.configuracion.update(configForm);
    toast.success('Configuración guardada');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Configuración</h1>
            <p className="text-muted-foreground mt-1">Perfil del hotel y preferencias del sistema</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/host')}><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hotel */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil del Hotel</CardTitle>
              <CardDescription>Datos generales del establecimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nombre</Label><Input value={hotelForm.nombre} onChange={e => setHotelForm({ ...hotelForm, nombre: e.target.value })} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input value={hotelForm.direccion} onChange={e => setHotelForm({ ...hotelForm, direccion: e.target.value })} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={hotelForm.telefono} onChange={e => setHotelForm({ ...hotelForm, telefono: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={hotelForm.email} onChange={e => setHotelForm({ ...hotelForm, email: e.target.value })} /></div>
              <Button variant="hero" onClick={saveHotel}><Save className="h-4 w-4 mr-2" />Guardar Hotel</Button>
            </CardContent>
          </Card>

          {/* Config */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias del Sistema</CardTitle>
              <CardDescription>Configuración de horarios y formatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Horario Atención Inicio</Label><Input type="time" value={configForm.horarioAtencionInicio} onChange={e => setConfigForm({ ...configForm, horarioAtencionInicio: e.target.value })} /></div>
                <div className="space-y-2"><Label>Horario Atención Fin</Label><Input type="time" value={configForm.horarioAtencionFin} onChange={e => setConfigForm({ ...configForm, horarioAtencionFin: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Email de Notificaciones</Label><Input value={configForm.emailNotificaciones} onChange={e => setConfigForm({ ...configForm, emailNotificaciones: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Prefijo BEO</Label><Input value={configForm.prefijoBeo} onChange={e => setConfigForm({ ...configForm, prefijoBeo: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prefijo Solicitud</Label><Input value={configForm.prefijoSolicitud} onChange={e => setConfigForm({ ...configForm, prefijoSolicitud: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prefijo Evento</Label><Input value={configForm.prefijoEvento} onChange={e => setConfigForm({ ...configForm, prefijoEvento: e.target.value })} /></div>
              </div>
              <Button variant="hero" onClick={saveConfig}><Save className="h-4 w-4 mr-2" />Guardar Configuración</Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-3xl font-bold">{hostDb.salones.getAll().length}</p><p className="text-sm text-muted-foreground">Salones activos</p></div>
              <div><p className="text-3xl font-bold">{hostDb.receptivos.getAll().length}</p><p className="text-sm text-muted-foreground">Receptivos</p></div>
              <div><p className="text-3xl font-bold">{hostDb.eventosConfirmados.getAll().length}</p><p className="text-sm text-muted-foreground">Eventos totales</p></div>
              <div><p className="text-3xl font-bold">{hostDb.beos.getAll().length}</p><p className="text-sm text-muted-foreground">BEOs generados</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
