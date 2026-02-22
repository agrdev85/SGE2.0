import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { statsApi, abstractsApi, eventsApi, Abstract, Event } from '@/lib/mockApi';
import { FileText, CheckCircle, Clock, XCircle, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAbstracts: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    events: 0,
  });
  const [recentAbstracts, setRecentAbstracts] = useState<Abstract[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [statsData, abstracts, eventsData] = await Promise.all([
          statsApi.getDashboardStats(user.id, user.role),
          user.role === 'REVIEWER' 
            ? abstractsApi.getPendingReview(user.id)
            : abstractsApi.getMyAbstracts(user.id),
          eventsApi.getAll(),
        ]);
        setStats(statsData);
        setRecentAbstracts(abstracts.slice(0, 5));
        setEvents(eventsData.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const roleGreetings: Record<string, string> = {
    USER: 'Participante',
    REVIEWER: 'Revisor',
    COMMITTEE: 'Miembro del Comité',
    ADMIN: 'Administrador',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              ¡Hola, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Panel de {roleGreetings[user?.role || 'USER']}
            </p>
          </div>
          {user?.role === 'USER' && (
            <Button variant="hero" asChild>
              <Link to="/abstracts/new">
                <Plus className="h-4 w-4" />
                Nuevo Resumen
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Resúmenes"
            value={stats.totalAbstracts}
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="En Proceso"
            value={stats.pendingReview}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Aprobados"
            value={stats.approved}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Eventos Activos"
            value={stats.events}
            icon={Calendar}
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Abstracts */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">
                  {user?.role === 'REVIEWER' ? 'Pendientes de Revisión' : 'Mis Resúmenes Recientes'}
                </CardTitle>
                <CardDescription>
                  {user?.role === 'REVIEWER' 
                    ? 'Resúmenes asignados para tu revisión'
                    : 'Estado actual de tus envíos'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={user?.role === 'REVIEWER' ? '/review' : '/abstracts'}>
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : recentAbstracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay resúmenes aún</p>
                  {user?.role === 'USER' && (
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link to="/abstracts/new">Enviar mi primer resumen</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAbstracts.map(abstract => (
                    <div
                      key={abstract.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium truncate">{abstract.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {abstract.keywords.slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <StatusBadge status={abstract.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Events */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Eventos Activos</CardTitle>
              <CardDescription>Próximos eventos científicos</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay eventos activos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map(event => (
                    <Link key={event.id} to={`/event/${event.id}`} className="group block">
                      <div className="relative rounded-lg overflow-hidden mb-2">
                        <img
                          src={event.bannerImageUrl}
                          alt={event.name}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white/80">
                            {new Date(event.startDate).toLocaleDateString('es-ES', { 
                              month: 'short', 
                              day: 'numeric' 
                            })} - {new Date(event.endDate).toLocaleDateString('es-ES', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{event.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
