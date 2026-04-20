import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hostDb, SolicitudEvento, EventoConfirmado } from '@/lib/hostDatabase';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ClipboardList, CheckCircle, Clock, Bell, FileText, Eye,
  ChevronLeft, ChevronRight, Building2, Users, TrendingUp, AlertCircle,
} from 'lucide-react';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function HostDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(hostDb.getStats());
  const [pendientes, setPendientes] = useState<SolicitudEvento[]>([]);
  const [proximos, setProximos] = useState<EventoConfirmado[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = () => {
    setStats(hostDb.getStats());
    setPendientes(hostDb.solicitudes.getPendientes().slice(0, 5));
    setProximos(hostDb.eventosConfirmados.getProximos(14));
    // Calendar events for current month
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    setCalendarEvents(hostDb.getCalendarEvents(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    ));
  };

  const handleAceptar = (sol: SolicitudEvento) => {
    try {
      hostDb.solicitudes.aceptar(sol.id);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRechazar = (sol: SolicitudEvento) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo) {
      hostDb.solicitudes.rechazar(sol.id, motivo);
      loadData();
    }
  };

  // Mini calendar
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(e => {
      const eStart = e.start.split('T')[0];
      const eEnd = e.end.split('T')[0];
      return dateStr >= eStart && dateStr <= eEnd;
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getReceptivoName = (id: string) => hostDb.receptivos.getById(id)?.nombre || 'Desconocido';
  const getSalonName = (id: string) => hostDb.salones.getById(id)?.nombre || '-';

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-warning/10 text-warning',
    aceptada: 'bg-accent/10 text-accent',
    rechazada: 'bg-destructive/10 text-destructive',
    convertida: 'bg-primary/10 text-primary',
    confirmado: 'bg-accent/10 text-accent',
    en_planificacion: 'bg-info/10 text-info',
    en_curso: 'bg-primary/10 text-primary',
    finalizado: 'bg-muted text-muted-foreground',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Módulo Anfitrión</h1>
            <p className="text-muted-foreground mt-1">
              📅 Hoy: {today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {stats.notificacionesNoLeidas > 0 && (
                <Badge className="ml-3 bg-destructive">{stats.notificacionesNoLeidas} nueva(s)</Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/host/calendario')}>
              <Calendar className="h-4 w-4 mr-2" />Calendario
            </Button>
            <Button variant="hero" onClick={() => navigate('/host/solicitudes')}>
              <ClipboardList className="h-4 w-4 mr-2" />Solicitudes
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/host/solicitudes')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.solicitudesPendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/host/eventos')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.eventosConfirmados}</p>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/host/beos')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.beoBorradores + stats.beoEnviados}</p>
                  <p className="text-xs text-muted-foreground">BEOs activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/host/salones')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hostDb.salones.getAll().length}</p>
                  <p className="text-xs text-muted-foreground">Salones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Solicitudes Pendientes */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Solicitudes Pendientes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/host/solicitudes')}>Ver todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                {pendientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendientes.map(sol => (
                      <div key={sol.id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{sol.nombreEvento}</p>
                            <p className="text-xs text-muted-foreground">{getReceptivoName(sol.receptivoId)}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{sol.origen === 'email' ? '📧' : '💻'}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span>{sol.fechaInicio} — {sol.paxEstimado} pax</span>
                          {sol.salonSugeridoId && <span className="ml-2">· {getSalonName(sol.salonSugeridoId)}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" className="h-7 text-xs flex-1" onClick={() => handleAceptar(sol)}>✓ Aceptar</Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => handleRechazar(sol)}>✗ Rechazar</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate('/host/solicitudes')}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Mini Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Calendario de Ocupación</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center">
                    {MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_ES.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day}
                      className={`relative min-h-[60px] border rounded-md p-1 text-xs cursor-pointer hover:bg-muted/50 transition-colors ${
                        isToday(day) ? 'border-primary bg-primary/5 font-bold' : 'border-border'
                      }`}
                      onClick={() => navigate('/host/calendario')}
                    >
                      <span className={`${isToday(day) ? 'text-primary' : ''}`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map(e => (
                          <div
                            key={e.id}
                            className="truncate rounded px-1 py-0.5 text-[10px] text-white leading-tight"
                            style={{ backgroundColor: e.color }}
                            title={e.title}
                          >
                            {e.title.replace('📋 ', '')}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} más</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#22c55e]" /> Confirmado</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#eab308]" /> Pendiente</div>
                {hostDb.salones.getAll().slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} /> {s.nombre.split(' ').slice(-1)}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Eventos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Próximos Eventos (14 días)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/host/eventos')}>Ver todos</Button>
            </div>
          </CardHeader>
          <CardContent>
            {proximos.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">No hay eventos próximos</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {proximos.map(evt => (
                  <div key={evt.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/host/eventos')}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{evt.nombreEvento}</p>
                      <Badge className={`text-xs ${estadoColors[evt.estado] || ''}`}>{evt.estado}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>📅 {evt.fechaInicio} · {evt.horaInicio} - {evt.horaFin}</p>
                      <p>📍 {getSalonName(evt.salonId)} · {evt.paxConfirmado} pax</p>
                      <p>🏢 {getReceptivoName(evt.receptivoId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
