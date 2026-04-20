import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hostDb } from '@/lib/hostDatabase';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type ViewType = 'month' | 'week' | 'day' | 'timeline';

export default function HostCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [salonFilter, setSalonFilter] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const salones = hostDb.salones.getAll();

  useEffect(() => {
    loadEvents();
  }, [currentDate, salonFilter, view]);

  const loadEvents = () => {
    let start: string, end: string;
    if (view === 'month') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (view === 'week') {
      const dayOfWeek = currentDate.getDay();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      start = weekStart.toISOString().split('T')[0];
      end = weekEnd.toISOString().split('T')[0];
    } else {
      start = currentDate.toISOString().split('T')[0];
      end = start;
    }
    setEvents(hostDb.getCalendarEvents(start, end, salonFilter === 'all' ? undefined : salonFilter));
  };

  const navigate_prev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const navigate_next = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const today = new Date();
  const isToday = (dateStr: string) => dateStr === today.toISOString().split('T')[0];

  const getEventsForDate = (dateStr: string) => events.filter(e => {
    const eStart = e.start.split('T')[0];
    const eEnd = e.end.split('T')[0];
    return dateStr >= eStart && dateStr <= eEnd;
  });

  const getSalonName = (id: string) => hostDb.salones.getById(id)?.nombre || '-';

  // Month view
  const renderMonthView = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    return (
      <div className="grid grid-cols-7 gap-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 border-b">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="min-h-[100px]" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = getEventsForDate(dateStr);
          return (
            <div key={day} className={`min-h-[100px] border rounded-md p-1 ${isToday(dateStr) ? 'border-primary bg-primary/5' : 'border-border'} hover:bg-muted/30 transition-colors`}>
              <div className={`text-xs font-medium mb-1 ${isToday(dateStr) ? 'text-primary' : ''}`}>{day}</div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} className="truncate rounded px-1 py-0.5 text-[10px] text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: e.color }} title={`${e.title} - ${getSalonName(e.resourceId)}`}>
                    {e.title.replace('📋 ', '')}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const dayOfWeek = currentDate.getDay();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });

    const hours = Array.from({ length: 14 }).map((_, i) => i + 7); // 7am - 8pm

    return (
      <div className="overflow-auto">
        <div className="grid grid-cols-8 min-w-[800px]">
          <div className="border-b p-2 text-xs font-semibold text-muted-foreground">Hora</div>
          {days.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            return (
              <div key={dateStr} className={`border-b p-2 text-center text-xs font-semibold ${isToday(dateStr) ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}>
                {DAYS_SHORT[d.getDay()]} {d.getDate()}
              </div>
            );
          })}
          {hours.map(hour => (
            <>
              <div key={`h-${hour}`} className="border-r border-b p-1 text-[10px] text-muted-foreground">{String(hour).padStart(2, '0')}:00</div>
              {days.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(dateStr).filter(e => {
                  const eHour = parseInt(e.start.split('T')[1]?.split(':')[0] || '0');
                  return eHour === hour;
                });
                return (
                  <div key={`${dateStr}-${hour}`} className="border-b border-r min-h-[40px] p-0.5">
                    {dayEvents.map(e => (
                      <div key={e.id} className="truncate rounded px-1 py-0.5 text-[10px] text-white" style={{ backgroundColor: e.color }}>
                        {e.title.replace('📋 ', '')}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  };

  // Timeline view (salons as columns)
  const renderTimelineView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hours = Array.from({ length: 14 }).map((_, i) => i + 7);
    const activeSalones = salonFilter === 'all' ? salones : salones.filter(s => s.id === salonFilter);

    return (
      <div className="overflow-auto">
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${activeSalones.length}, 1fr)`, minWidth: `${80 + activeSalones.length * 150}px` }}>
          <div className="border-b p-2 text-xs font-semibold text-muted-foreground">Hora</div>
          {activeSalones.map(s => (
            <div key={s.id} className="border-b border-l p-2 text-center text-xs font-semibold" style={{ color: s.color }}>
              {s.nombre}
            </div>
          ))}
          {hours.map(hour => (
            <>
              <div key={`h-${hour}`} className="border-r border-b p-1 text-[10px] text-muted-foreground">{String(hour).padStart(2, '0')}:00</div>
              {activeSalones.map(salon => {
                const salonEvents = events
                  .filter(e => e.resourceId === salon.id)
                  .filter(e => {
                    const eStart = e.start.split('T')[0];
                    const eEnd = e.end.split('T')[0];
                    return dateStr >= eStart && dateStr <= eEnd;
                  })
                  .filter(e => {
                    const eHour = parseInt(e.start.split('T')[1]?.split(':')[0] || '0');
                    return eHour === hour;
                  });
                return (
                  <div key={`${salon.id}-${hour}`} className="border-b border-l min-h-[40px] p-0.5">
                    {salonEvents.map(e => (
                      <div key={e.id} className="truncate rounded px-1 py-1 text-[10px] text-white" style={{ backgroundColor: e.color || salon.color }}>
                        {e.title.replace('📋 ', '')}
                        <div className="opacity-75">{e.data?.paxConfirmado || e.data?.paxEstimado} pax</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = getEventsForDate(dateStr);
    const hours = Array.from({ length: 14 }).map((_, i) => i + 7);

    return (
      <div className="space-y-1">
        <h3 className="font-semibold text-lg mb-4">
          {DAYS_ES[currentDate.getDay()]} {currentDate.getDate()} de {MONTHS_ES[currentDate.getMonth()]}
        </h3>
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(e => {
            const eHour = parseInt(e.start.split('T')[1]?.split(':')[0] || '0');
            const eEndHour = parseInt(e.end.split('T')[1]?.split(':')[0] || '24');
            return hour >= eHour && hour < eEndHour;
          });
          return (
            <div key={hour} className="flex border-b py-2">
              <div className="w-16 text-xs text-muted-foreground shrink-0">{String(hour).padStart(2, '0')}:00</div>
              <div className="flex-1 flex gap-2 flex-wrap">
                {hourEvents.map(e => (
                  <div key={e.id} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: e.color }}>
                    <span className="font-medium">{e.title.replace('📋 ', '')}</span>
                    <span className="ml-2 opacity-75">{getSalonName(e.resourceId)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Calendario</h1>
            <p className="text-muted-foreground mt-1">Vista de ocupación de salones</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/host')}>Volver al Dashboard</Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={navigate_prev}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-lg font-semibold min-w-[200px] text-center">
                  {view === 'day'
                    ? `${currentDate.getDate()} ${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  }
                </h2>
                <Button variant="ghost" size="icon" onClick={navigate_next}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={salonFilter} onValueChange={setSalonFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar salón" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los salones</SelectItem>
                    {salones.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  {(['month', 'week', 'day', 'timeline'] as ViewType[]).map(v => (
                    <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm" className="rounded-none first:rounded-l-md last:rounded-r-md" onClick={() => setView(v)}>
                      {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : v === 'day' ? 'Día' : 'Timeline'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {view === 'timeline' && renderTimelineView()}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <span className="font-medium">Leyenda:</span>
              {salones.map(s => (
                <div key={s.id} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
                  {s.nombre}
                </div>
              ))}
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#eab308]" /> Solicitud pendiente</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
