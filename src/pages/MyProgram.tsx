import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { db, ProgramSession, DelegateProgram } from '@/lib/database';
import { Calendar, Clock, MapPin, Presentation, Coffee, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MyProgram() {
  const { user } = useAuth();
  const [allSessions, setAllSessions] = useState<ProgramSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [delegateProgram, setDelegateProgram] = useState<DelegateProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user) return;

    try {
      const sessions = db.programSessions.getByEvent('1');
      const program = db.delegatePrograms.getByUser(user.id, '1');
      
      setAllSessions(sessions);
      setDelegateProgram(program || null);
      setSelectedSessions(program?.sessionIds || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const handleSaveProgram = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      db.delegatePrograms.update(user.id, '1', selectedSessions);
      toast.success('Tu programa ha sido guardado correctamente');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el programa');
    } finally {
      setIsSaving(false);
    }
  };

  const getSessionIcon = (type: ProgramSession['type']) => {
    switch (type) {
      case 'SESION_ORAL':
      case 'CONFERENCIA':
      case 'PLENARIA':
        return Presentation;
      case 'BREAK':
        return Coffee;
      default:
        return Calendar;
    }
  };

  const getAbstractsCount = (session: ProgramSession) => {
    return session.abstracts.length;
  };

  // Group sessions by date
  const sessionsByDate = allSessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, ProgramSession[]>);

  // Check for time conflicts
  const hasTimeConflict = (sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return false;

    return selectedSessions.some(selectedId => {
      if (selectedId === sessionId) return false;
      const otherSession = allSessions.find(s => s.id === selectedId);
      if (!otherSession || otherSession.date !== session.date) return false;

      const start1 = session.startTime;
      const end1 = session.endTime;
      const start2 = otherSession.startTime;
      const end2 = otherSession.endTime;

      return (start1 < end2 && end1 > start2);
    });
  };

  const selectedCount = selectedSessions.length;
  const totalCount = allSessions.filter(s => s.type !== 'BREAK').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Mi Programa</h1>
            <p className="text-muted-foreground mt-1">
              Personaliza tu agenda del evento
            </p>
          </div>
          <Button
            variant="hero"
            onClick={handleSaveProgram}
            disabled={isSaving || selectedSessions.length === 0}
          >
            {isSaving ? 'Guardando...' : 'Guardar Mi Programa'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-info/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display">{Object.keys(sessionsByDate).length}</p>
                  <p className="text-sm text-muted-foreground">Días del evento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display">{selectedCount}</p>
                  <p className="text-sm text-muted-foreground">Sesiones seleccionadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/20">
                  <Presentation className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display">{totalCount}</p>
                  <p className="text-sm text-muted-foreground">Total de sesiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Presentation className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Cómo crear tu programa:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Selecciona las sesiones a las que deseas asistir</li>
                  <li>• Evita conflictos de horario (se marcarán en rojo)</li>
                  <li>• Guarda tu programa para tener acceso fácil durante el evento</li>
                  <li>• Puedes modificar tu programa en cualquier momento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : Object.entries(sessionsByDate).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No hay programa disponible</h3>
              <p className="text-muted-foreground">
                El programa del evento aún no ha sido publicado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(sessionsByDate)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, daySessions]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <CardDescription>
                      {daySessions.filter(s => s.type !== 'BREAK' && selectedSessions.includes(s.id)).length} de{' '}
                      {daySessions.filter(s => s.type !== 'BREAK').length} sesiones seleccionadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {daySessions
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(session => {
                        const Icon = getSessionIcon(session.type);
                        const isSelected = selectedSessions.includes(session.id);
                        const hasConflict = hasTimeConflict(session.id);
                        const isBreak = session.type === 'BREAK';

                        if (isBreak) {
                          return (
                            <div
                              key={session.id}
                              className="border-l-4 border-muted-foreground/20 pl-4 py-2"
                            >
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Coffee className="h-4 w-4" />
                                <span className="text-sm font-medium">{session.title}</span>
                                <span className="text-xs">
                                  {session.startTime} - {session.endTime}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={session.id}
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected
                                ? hasConflict
                                  ? 'border-destructive bg-destructive/5'
                                  : 'border-primary bg-primary/5'
                                : 'hover:shadow-md hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSession(session.id)}
                                className="mt-1"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{session.title}</h4>
                                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {session.startTime} - {session.endTime}
                                        </span>
                                        {session.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {session.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {session.type}
                                    </Badge>
                                    {getAbstractsCount(session) > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getAbstractsCount(session)} trabajos
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {hasConflict && isSelected && (
                                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                                    ⚠️ Conflicto de horario con otra sesión seleccionada
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Action Bar */}
        {selectedSessions.length > 0 && (
          <Card className="border-primary/20 bg-primary/5 sticky bottom-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {selectedSessions.length} {selectedSessions.length === 1 ? 'sesión seleccionada' : 'sesiones seleccionadas'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSessions.some(id => hasTimeConflict(id)) && (
                        <span className="text-destructive">Hay conflictos de horario</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSessions([])}
                  >
                    Limpiar Selección
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleSaveProgram}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Mi Programa'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
