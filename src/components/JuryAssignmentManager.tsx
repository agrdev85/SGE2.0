import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { db, Abstract, User, Thematic, WorkAssignment } from '@/lib/database';
import { UserCog, Search, CheckCircle, AlertCircle, XCircle, Trash2 } from 'lucide-react';

interface Props {
  eventId: string;
}

export function JuryAssignmentManager({ eventId }: Props) {
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [thematics, setThematics] = useState<Thematic[]>([]);
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterThematic, setFilterThematic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = () => {
    const allAbstracts = db.abstracts.getApproved(eventId);
    const allReviewers = db.users.getReviewers();
    const allThematics = db.thematics.getByEvent(eventId);
    const allAssignments = db.workAssignments.getAll();

    setAbstracts(allAbstracts);
    setReviewers(allReviewers);
    setThematics(allThematics);
    setAssignments(allAssignments);
  };

  const handleAssign = () => {
    if (!selectedAbstract || !selectedReviewer) {
      toast.error('Selecciona un árbitro');
      return;
    }

    try {
      db.workAssignments.create({
        abstractId: selectedAbstract.id,
        reviewerId: selectedReviewer,
        assignedBy: '3', // TODO: get from auth context
        status: 'pending',
        assignedAt: new Date().toISOString(),
      });
      
      toast.success('Trabajo asignado correctamente');
      setShowAssignDialog(false);
      setSelectedAbstract(null);
      setSelectedReviewer('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al asignar el trabajo');
    }
  };

  const handleUnassign = (abstractId: string) => {
    const assignment = assignments.find(a => a.abstractId === abstractId);
    if (assignment) {
      db.workAssignments.delete(assignment.id);
      toast.success('Asignación eliminada');
      loadData();
    }
  };

  const openAssignDialog = (abstract: Abstract) => {
    // Find reviewers for this thematic
    const thematicReviewers = abstract.thematicId 
      ? reviewers.filter(r => r.reviewerThematics?.includes(abstract.thematicId!))
      : reviewers;

    if (thematicReviewers.length === 0) {
      toast.error('No hay árbitros disponibles para esta temática');
      return;
    }

    setSelectedAbstract(abstract);
    setShowAssignDialog(true);
  };

  const getAssignmentForAbstract = (abstractId: string) => {
    return assignments.find(a => a.abstractId === abstractId);
  };

  const getReviewerName = (reviewerId: string) => {
    return reviewers.find(r => r.id === reviewerId)?.name || 'Desconocido';
  };

  const getThematicName = (thematicId?: string) => {
    if (!thematicId) return 'Sin temática';
    return thematics.find(t => t.id === thematicId)?.name || 'Desconocida';
  };

  const filteredAbstracts = abstracts.filter(abstract => {
    const matchesSearch = abstract.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThematic = filterThematic === 'all' || abstract.thematicId === filterThematic;
    
    const assignment = getAssignmentForAbstract(abstract.id);
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'assigned' && assignment) ||
      (filterStatus === 'unassigned' && !assignment);

    return matchesSearch && matchesThematic && matchesStatus;
  });

  const assignedCount = abstracts.filter(a => getAssignmentForAbstract(a.id)).length;
  const unassignedCount = abstracts.length - assignedCount;

  const getReviewerWorkload = (reviewerId: string) => {
    return assignments.filter(a => a.reviewerId === reviewerId).length;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-info/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{abstracts.length}</p>
                <p className="text-sm text-muted-foreground">Total de trabajos</p>
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
                <p className="text-3xl font-bold font-display">{assignedCount}</p>
                <p className="text-sm text-muted-foreground">Asignados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/20">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{unassignedCount}</p>
                <p className="text-sm text-muted-foreground">Sin asignar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterThematic} onValueChange={setFilterThematic}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las temáticas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las temáticas</SelectItem>
                {thematics.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="assigned">Asignados</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviewers Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Carga de Trabajo de Árbitros</CardTitle>
          <CardDescription>
            Distribución de trabajos asignados a cada árbitro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reviewers.map(reviewer => {
              const workload = getReviewerWorkload(reviewer.id);
              const thematics = reviewer.reviewerThematics?.map(tid => 
                getThematicName(tid)
              ).join(', ') || 'Todas las temáticas';

              return (
                <div key={reviewer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {reviewer.avatar && (
                      <img src={reviewer.avatar} alt={reviewer.name} className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{reviewer.name}</p>
                      <p className="text-sm text-muted-foreground">{thematics}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={workload === 0 ? 'secondary' : 'default'}>
                      {workload} {workload === 1 ? 'trabajo' : 'trabajos'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Abstracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trabajos Aprobados</CardTitle>
          <CardDescription>
            Asigna árbitros específicos a cada trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Temática</TableHead>
                <TableHead>Autor Principal</TableHead>
                <TableHead>Árbitro Asignado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbstracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se encontraron trabajos
                  </TableCell>
                </TableRow>
              ) : (
                filteredAbstracts.map(abstract => {
                  const assignment = getAssignmentForAbstract(abstract.id);
                  const mainAuthor = abstract.authors.find(a => a.isMainAuthor);

                  return (
                    <TableRow key={abstract.id}>
                      <TableCell className="font-medium">{abstract.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getThematicName(abstract.thematicId)}</Badge>
                      </TableCell>
                      <TableCell>{mainAuthor?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {assignment ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-accent" />
                            <span className="text-sm">{getReviewerName(assignment.reviewerId)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Sin asignar</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassign(abstract.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(abstract)}
                          >
                            Asignar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Árbitro</DialogTitle>
            <DialogDescription>
              Selecciona el árbitro que revisará este trabajo
            </DialogDescription>
          </DialogHeader>

          {selectedAbstract && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Trabajo:</p>
                <p className="text-sm text-muted-foreground">{selectedAbstract.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Temática:</p>
                <Badge variant="outline">{getThematicName(selectedAbstract.thematicId)}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Árbitro *</Label>
                <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un árbitro" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers
                      .filter(r => 
                        !selectedAbstract.thematicId || 
                        r.reviewerThematics?.includes(selectedAbstract.thematicId)
                      )
                      .map(reviewer => {
                        const workload = getReviewerWorkload(reviewer.id);
                        return (
                          <SelectItem key={reviewer.id} value={reviewer.id}>
                            {reviewer.name} ({workload} {workload === 1 ? 'trabajo' : 'trabajos'})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
