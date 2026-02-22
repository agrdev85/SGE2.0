import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, ProgramSession, Abstract } from '@/lib/database';
import { Calendar, Clock, MapPin, Presentation, Coffee, Plus, Edit, Trash2, Download, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ProgramManager() {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [sessionForm, setSessionForm] = useState<Partial<ProgramSession>>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'SESION_ORAL',
    abstracts: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allSessions = db.programSessions.getByEvent('1');
      const allAbstracts = db.abstracts.getApproved('1');
      setSessions(allSessions);
      setAbstracts(allAbstracts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProgram = async () => {
    setIsGenerating(true);
    try {
      const generatedSessions = db.programSessions.generateProposal('1');
      toast.success(`Programa generado con ${generatedSessions.length} sesiones`);
      setShowGenerateDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el programa');
    } finally {
      setIsGenerating(false);
    }
  };

  const openNewSessionDialog = () => {
    setSelectedSession(null);
    setSessionForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      type: 'SESION_ORAL',
      abstracts: [],
    });
    setShowSessionDialog(true);
  };

  const openEditSessionDialog = (session: ProgramSession) => {
    setSelectedSession(session);
    setSessionForm(session);
    setShowSessionDialog(true);
  };

  const handleSaveSession = () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      if (selectedSession) {
        db.programSessions.update(selectedSession.id, sessionForm as Partial<ProgramSession>);
        toast.success('Sesión actualizada correctamente');
      } else {
        const maxOrder = Math.max(...sessions.map(s => s.orderIndex), -1);
        db.programSessions.create({
          eventId: '1',
          title: sessionForm.title!,
          date: sessionForm.date!,
          startTime: sessionForm.startTime!,
          endTime: sessionForm.endTime!,
          location: sessionForm.location || '',
          type: sessionForm.type!,
          abstracts: sessionForm.abstracts || [],
          orderIndex: maxOrder + 1,
        });
        toast.success('Sesión creada correctamente');
      }
      
      setShowSessionDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la sesión');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('¿Estás seguro de eliminar esta sesión?')) {
      db.programSessions.delete(sessionId);
      toast.success('Sesión eliminada');
      loadData();
    }
  };

  const handleAddAbstractToSession = (sessionId: string, abstractId: string) => {
    try {
      db.programSessions.addAbstract(sessionId, abstractId);
      toast.success('Trabajo agregado a la sesión');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar el trabajo');
    }
  };

  const handleRemoveAbstractFromSession = (sessionId: string, abstractId: string) => {
    db.programSessions.removeAbstract(sessionId, abstractId);
    toast.success('Trabajo eliminado de la sesión');
    loadData();
  };

  const getSessionIcon = (type: ProgramSession['type']) => {
    switch (type) {
      case 'SESION_ORAL':
      case 'CONFERENCIA':
      case 'PLENARIA':
        return Presentation;
      case 'BREAK':
        return Coffee;
      case 'POSTER':
        return Users;
      default:
        return Calendar;
    }
  };

  const getAbstractById = (id: string) => abstracts.find(a => a.id === id);
  const unassignedAbstracts = abstracts.filter(a => !a.sessionId);

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, ProgramSession[]>);

  const sessionTypes = [
    { value: 'CONFERENCIA', label: 'Conferencia' },
    { value: 'SESION_ORAL', label: 'Sesión Oral' },
    { value: 'POSTER', label: 'Poster' },
    { value: 'PLENARIA', label: 'Plenaria' },
    { value: 'BREAK', label: 'Descanso' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Gestor de Programa</h1>
            <p className="text-muted-foreground mt-1">
              Organiza el programa del evento
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGenerateDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Programa
            </Button>
            <Button variant="hero" onClick={openNewSessionDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(sessionsByDate).length}</p>
                  <p className="text-sm text-muted-foreground">Días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Presentation className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-sm text-muted-foreground">Sesiones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-info" />
                <div>
                  <p className="text-2xl font-bold">{abstracts.length}</p>
                  <p className="text-sm text-muted-foreground">Trabajos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{unassignedAbstracts.length}</p>
                  <p className="text-sm text-muted-foreground">Sin asignar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">Vista de Calendario</TabsTrigger>
            <TabsTrigger value="unassigned">Trabajos Sin Asignar</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            {Object.entries(sessionsByDate).length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No hay sesiones programadas</h3>
                  <p className="text-muted-foreground mb-6">
                    Genera un programa automático o crea sesiones manualmente
                  </p>
                  <Button variant="hero" onClick={() => setShowGenerateDialog(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Programa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(sessionsByDate)
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {daySessions
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(session => {
                          const Icon = getSessionIcon(session.type);
                          return (
                            <div
                              key={session.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
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
                                      <Badge variant="outline" className="text-xs">
                                        {session.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditSessionDialog(session)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSession(session.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {session.type !== 'BREAK' && session.abstracts.length > 0 && (
                                <div className="space-y-2 mt-3 pt-3 border-t">
                                  <p className="text-sm font-medium">Trabajos ({session.abstracts.length}):</p>
                                  {session.abstracts.map(abstractId => {
                                    const abstract = getAbstractById(abstractId);
                                    if (!abstract) return null;
                                    const mainAuthor = abstract.authors.find(a => a.isMainAuthor);
                                    return (
                                      <div
                                        key={abstractId}
                                        className="flex items-start justify-between text-sm p-2 bg-muted/30 rounded"
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium">{abstract.title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {mainAuthor?.name || 'Sin autor'}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveAbstractFromSession(session.id, abstractId)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="unassigned">
            <Card>
              <CardHeader>
                <CardTitle>Trabajos Sin Asignar ({unassignedAbstracts.length})</CardTitle>
                <CardDescription>
                  Estos trabajos no están incluidos en ninguna sesión del programa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unassignedAbstracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Todos los trabajos están asignados a sesiones
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedAbstracts.map(abstract => {
                      const mainAuthor = abstract.authors.find(a => a.isMainAuthor);
                      return (
                        <div key={abstract.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{abstract.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {mainAuthor?.name || 'Sin autor'} • {abstract.categoryType || 'Sin categoría'}
                            </p>
                          </div>
                          <Select onValueChange={(sessionId) => handleAddAbstractToSession(sessionId, abstract.id)}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Agregar a sesión" />
                            </SelectTrigger>
                            <SelectContent>
                              {sessions.filter(s => s.type !== 'BREAK').map(session => (
                                <SelectItem key={session.id} value={session.id}>
                                  {session.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Program Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Programa Automáticamente</DialogTitle>
              <DialogDescription>
                Se generará una propuesta de programa basada en los trabajos aprobados y sus temáticas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>El sistema:</strong>
                </p>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>Agrupará trabajos por temática</li>
                  <li>Creará sesiones distribuidas en los días del evento</li>
                  <li>Asignará tiempos según el tipo de presentación</li>
                  <li>Incluirá descansos automáticamente</li>
                </ul>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning-foreground">
                  <strong>Advertencia:</strong> Esto eliminará el programa actual si existe.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateProgram} disabled={isGenerating}>
                {isGenerating ? 'Generando...' : 'Generar Programa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Session Dialog */}
        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSession ? 'Editar Sesión' : 'Nueva Sesión'}</DialogTitle>
              <DialogDescription>
                {selectedSession ? 'Modifica los detalles de la sesión' : 'Crea una nueva sesión del programa'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Sesión de Biotecnología"
                  value={sessionForm.title || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={sessionForm.date || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={sessionForm.type}
                    onValueChange={(value: any) => setSessionForm({ ...sessionForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora Inicio *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={sessionForm.startTime || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora Fin *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={sessionForm.endTime || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ej: Sala A, Auditorio Principal"
                  value={sessionForm.location || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSession}>
                {selectedSession ? 'Guardar Cambios' : 'Crear Sesión'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
