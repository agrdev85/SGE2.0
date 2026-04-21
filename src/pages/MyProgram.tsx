import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEventContext } from '@/contexts/EventContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { db, ProgramSession, DelegateProgram } from '@/lib/database';
import { Calendar, Clock, MapPin, Presentation, Coffee, CheckCircle, Search, X, AlertTriangle, GripVertical, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConflictInfo {
  sessionId: string;
  conflictsWith: string[];
  message: string;
}

export default function MyProgram() {
  const { user } = useAuth();
  const { selectedEventId, selectedEvent, eventChangeTrigger } = useEventContext();
  
  const [allSessions, setAllSessions] = useState<ProgramSession[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubEvento, setFilterSubEvento] = useState<string>('all');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  
  // Storage key helper
  const getStorageKey = useCallback(() => {
    return `my_program_${selectedEventId}_${user?.id}`;
  }, [selectedEventId, user?.id]);
  
  // Load data from localStorage or DB
  useEffect(() => {
    if (!user || !selectedEventId) {
      setAllSessions([]);
      setSelectedSessionIds(new Set());
      setIsLoading(false);
      setHasLoadedFromStorage(false);
      return;
    }
    
    setIsLoading(true);
    setHasLoadedFromStorage(false);
    
    const sessions = db.programSessions.getByEvent(selectedEventId);
    setAllSessions(sessions.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
    
    // Priority: localStorage > DB > empty
    const storageKey = getStorageKey();
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedSessionIds(new Set(parsed));
          setHasLoadedFromStorage(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
    
    // Load from DB
    const program = db.delegatePrograms.getByUser(user.id, selectedEventId);
    if (program?.sessionIds && Array.isArray(program.sessionIds)) {
      setSelectedSessionIds(new Set(program.sessionIds));
    } else {
      setSelectedSessionIds(new Set());
    }
    setHasLoadedFromStorage(true);
    setIsLoading(false);
  }, [user, selectedEventId, eventChangeTrigger, getStorageKey]);

  // Auto-save to localStorage whenever selection changes
  useEffect(() => {
    if (!selectedEventId || !user?.id || !hasLoadedFromStorage) return;
    
    const storageKey = getStorageKey();
    const data = Array.from(selectedSessionIds);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [selectedSessionIds, selectedEventId, user?.id, hasLoadedFromStorage, getStorageKey]);

  // Get unique subEventos for filter
  const subEventos = useMemo(() => {
    const ids = new Set(allSessions.map(s => s.thematicId).filter(Boolean));
    return Array.from(ids) as string[];
  }, [allSessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
      if (filterSubEvento !== 'all' && session.thematicId !== filterSubEvento) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          session.title.toLowerCase().includes(query) ||
          session.location?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allSessions, filterSubEvento, searchQuery]);

  // Group by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, ProgramSession[]> = {};
    filteredSessions.forEach(session => {
      if (!grouped[session.date]) grouped[session.date] = [];
      grouped[session.date].push(session);
    });
    return grouped;
  }, [filteredSessions]);

  // Get selected sessions for right panel
  const personalSessions = useMemo(() => {
    return allSessions
      .filter(s => selectedSessionIds.has(s.id) && s.type !== 'BREAK')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [allSessions, selectedSessionIds]);

  // Personal sessions grouped by date for right panel
  const personalByDate = useMemo(() => {
    const grouped: Record<string, ProgramSession[]> = {};
    personalSessions.forEach(session => {
      if (!grouped[session.date]) grouped[session.date] = [];
      grouped[session.date].push(session);
    });
    return grouped;
  }, [personalSessions]);

  // Detect conflicts
  const conflicts = useMemo((): Map<string, ConflictInfo> => {
    const conflictMap = new Map<string, ConflictInfo>();
    
    personalSessions.forEach(session => {
      const conflictsWith: string[] = [];
      personalSessions.forEach(other => {
        if (session.id === other.id) return;
        if (session.date !== other.date) return;
        
        // Check overlap: session A starts before B ends AND A ends after B starts
        if (session.startTime < other.endTime && session.endTime > other.startTime) {
          conflictsWith.push(other.id);
        }
      });
      
      if (conflictsWith.length > 0) {
        conflictMap.set(session.id, {
          sessionId: session.id,
          conflictsWith,
          message: `Solapa con ${conflictsWith.length} sesión(es)`,
        });
      }
    });
    
    return conflictMap;
  }, [personalSessions]);

  // Session selection toggle
  const handleToggleSession = useCallback((sessionId: string) => {
    setSelectedSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    setSelectedSessionIds(new Set());
    // Also clear localStorage
    if (selectedEventId && user?.id) {
      localStorage.removeItem(getStorageKey());
    }
  }, [selectedEventId, user?.id, getStorageKey]);

  // Save to DB
  const handleSaveProgram = useCallback(async () => {
    if (!user || !selectedEventId) return;
    setIsSaving(true);
    try {
      const sessionIds = Array.from(selectedSessionIds);
      db.delegatePrograms.update(user.id, selectedEventId, sessionIds);
      
      // Keep localStorage in sync with DB (source of truth)
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(sessionIds));
      
      toast.success('¡Agenda guardada correctamente!');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [user, selectedEventId, selectedSessionIds, getStorageKey]);

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    if (personalSessions.length === 0) {
      toast.error('No hay sesiones en tu agenda para exportar');
      return;
    }

    const event = selectedEvent;
    const userName = user?.name || 'Asistente';
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin-bottom: 8px; }
          .header h2 { font-size: 18px; color: #666; font-weight: normal; }
          .header .user { margin-top: 10px; font-size: 14px; color: #888; }
          .date-section { margin-bottom: 25px; }
          .date-section h3 { background: #f5f5f5; padding: 10px 15px; font-size: 16px; border-left: 4px solid #333; margin-bottom: 12px; }
          .session { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
          .session-time { min-width: 80px; color: #666; font-size: 14px; font-weight: bold; }
          .session-details { flex: 1; }
          .session-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
          .session-meta { font-size: 13px; color: #888; }
          .session-meta span { margin-right: 15px; }
          .break { background: #fafafa; padding: 10px 15px; color: #888; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #aaa; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mi Agenda Personal</h1>
          <h2>${event?.name || 'Evento'}</h2>
          <div class="user">Generado para: ${userName} | ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
    `;

    const sortedDates = Object.entries(personalByDate).sort(([a], [b]) => a.localeCompare(b));
    
    sortedDates.forEach(([date, sessions]) => {
      const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      htmlContent += `
        <div class="date-section">
          <h3>${dateLabel}</h3>
      `;
      
      sessions.forEach(session => {
        if (session.type === 'BREAK') {
          htmlContent += `
            <div class="break">☕ ${session.title} | ${session.startTime} - ${session.endTime}</div>
          `;
        } else {
          htmlContent += `
            <div class="session">
              <div class="session-time">${session.startTime}<br><span style="font-weight:normal;font-size:12px">${session.endTime}</span></div>
              <div class="session-details">
                <div class="session-title">${session.title}</div>
                <div class="session-meta">
                  <span>📍 ${session.location || 'Por asignar'}</span>
                  ${session.speaker ? `<span>🎤 ${session.speaker}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }
      });
      
      htmlContent += `</div>`;
    });

    htmlContent += `
      <div class="footer">
        Documento generado automáticamente | SGE - Sistema de Gestión de Eventos
      </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-agenda-${(event?.name || 'evento').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Agenda exportada correctamente');
  }, [personalSessions, personalByDate, selectedEvent, user]);

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

  const hasConflict = (sessionId: string) => conflicts.has(sessionId);

  // Stats
  const totalHours = useMemo(() => {
    let total = 0;
    personalSessions.forEach(s => {
      const start = s.startTime.split(':').reduce((h, m, i) => h + parseInt(m) * (i === 0 ? 60 : 1), 0);
      const end = s.endTime.split(':').reduce((h, m, i) => h + parseInt(m) * (i === 0 ? 60 : 1), 0);
      total += (end - start) / 60;
    });
    return Math.round(total * 10) / 10;
  }, [personalSessions]);

  if (!selectedEventId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un evento</h3>
            <p className="text-muted-foreground">Selecciona un evento en el menú lateral para ver su programa</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mi Agenda</h1>
            <p className="text-sm text-muted-foreground">
              {selectedEvent?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={selectedSessionIds.size === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
            <Button variant="hero" size="sm" onClick={handleSaveProgram} disabled={isSaving || selectedSessionIds.size === 0}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {isSaving ? 'Guardando...' : 'Confirmar Agenda'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={personalSessions.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
          {/* LEFT PANEL: Sessions Catalog (60%) */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Presentation className="h-5 w-5" />
                    Sesiones Disponibles
                    <Badge variant="secondary" className="ml-2">{filteredSessions.filter(s => s.type !== 'BREAK').length}</Badge>
                  </CardTitle>
                </div>
                {/* Search and Filter */}
                <div className="flex gap-2 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar sesión..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                  <select 
                    value={filterSubEvento}
                    onChange={e => setFilterSubEvento(e.target.value)}
                    className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">Todos los temas</option>
                    {subEventos.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
                {Object.entries(sessionsByDate).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay sesiones disponibles</p>
                  </div>
                ) : (
                  Object.entries(sessionsByDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, daySessions]) => {
                      const selectedInDay = daySessions.filter(s => selectedSessionIds.has(s.id) && s.type !== 'BREAK').length;
                      const totalInDay = daySessions.filter(s => s.type !== 'BREAK').length;
                      
                      return (
                        <div key={date}>
                          <div className="sticky top-0 bg-background z-10 py-2 border-b">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { 
                                weekday: 'long', month: 'long', day: 'numeric' 
                              })}
                              <Badge variant="outline" className="ml-auto text-xs">
                                {selectedInDay}/{totalInDay}
                              </Badge>
                            </h3>
                          </div>
                          <div className="space-y-2 pt-2">
                            {daySessions.map(session => {
                              const Icon = getSessionIcon(session.type);
                              const isSelected = selectedSessionIds.has(session.id);
                              const isBreak = session.type === 'BREAK';
                              
                              if (isBreak) {
                                return (
                                  <div key={session.id} className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm bg-muted/30 rounded">
                                    <Coffee className="h-4 w-4" />
                                    <span className="flex-1">{session.title}</span>
                                    <span className="text-xs">{session.startTime} - {session.endTime}</span>
                                  </div>
                                );
                              }
                              
                              return (
                                <div 
                                  key={session.id}
                                  onClick={() => !isBreak && handleToggleSession(session.id)}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                    isSelected 
                                      ? "bg-primary/10 border-primary" 
                                      : "hover:bg-muted/50 hover:border-primary/50",
                                    hasConflict(session.id) && "border-destructive/50 bg-destructive/5"
                                  )}
                                >
                                  <Checkbox 
                                    checked={isSelected} 
                                    onCheckedChange={() => handleToggleSession(session.id)}
                                    onClick={e => e.stopPropagation()}
                                    className="mt-0.5"
                                  />
                                  <div className={cn("p-2 rounded-lg", isSelected ? "bg-primary/20" : "bg-muted")}>
                                    <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{session.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                                  {hasConflict(session.id) && (
                                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL: Personal Agenda (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="h-full bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Mi Agenda
                  <Badge variant="default" className="ml-auto">{selectedSessionIds.size}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {totalHours} horas de contenido
                  {conflicts.size > 0 && (
                    <span className="text-destructive ml-2">
                      • {conflicts.size} conflicto(s)
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
                {personalSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Marca las sesiones que te interesan para construir tu agenda personal
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Conflict Warning Banner */}
                    {conflicts.size > 0 && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-destructive">Solapamiento de horario</p>
                            <p className="text-muted-foreground mt-1">
                              Hay sesiones que se superponen en horario. Puedes confirmar igual si lo deseas.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Sessions by Date */}
                    {Object.entries(personalByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, daySessions]) => (
                        <div key={date}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { 
                              weekday: 'short', month: 'short', day: 'numeric' 
                            })}
                          </h4>
                          <div className="space-y-2">
                            {daySessions.map(session => {
                              const Icon = getSessionIcon(session.type);
                              const sessionConflict = conflicts.get(session.id);
                              
                              return (
                                <div 
                                  key={session.id}
                                  className={cn(
                                    "p-2 rounded-lg border transition-all",
                                    sessionConflict 
                                      ? "bg-destructive/10 border-destructive/30" 
                                      : "bg-background border-primary/20"
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-medium truncate">{session.title}</h5>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span>{session.startTime} - {session.endTime}</span>
                                        <span>•</span>
                                        <span className="truncate">{session.location}</span>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleToggleSession(session.id)}
                                      className="p-1 hover:bg-muted rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {sessionConflict && (
                                    <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {sessionConflict.message}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}