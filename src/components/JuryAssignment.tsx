import { useState, useEffect } from 'react';
import { db, Event, User, Abstract, JuryAssignment as JuryAssignmentType } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Wand2, Users, FileText, RefreshCw, AlertTriangle, CheckCircle, ClipboardCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface JuryAssignmentProps {
  event: Event;
}

interface ReviewerStats {
  reviewer: User;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  abstracts: Abstract[];
}

export function JuryAssignment({ event }: JuryAssignmentProps) {
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [pendingAbstracts, setPendingAbstracts] = useState<Abstract[]>([]);
  const [assignments, setAssignments] = useState<JuryAssignmentType[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStats[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<{
    assignments: JuryAssignmentType[];
    stats: { reviewerId: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [event.id]);

  const loadData = () => {
    const allReviewers = db.users.getReviewers();
    const pending = db.abstracts.getPendingByEvent(event.id);
    const eventAssignments = db.juryAssignments.getByEvent(event.id);

    setReviewers(allReviewers);
    setPendingAbstracts(pending);
    setAssignments(eventAssignments);

    // Calculate stats per reviewer
    const stats: ReviewerStats[] = allReviewers.map(reviewer => {
      const reviewerAssignments = eventAssignments.filter(a => a.reviewerId === reviewer.id);
      const assignedAbstracts = reviewerAssignments
        .map(a => db.abstracts.getById(a.abstractId))
        .filter(Boolean) as Abstract[];
      const completedReviews = db.reviews.getByReviewer(reviewer.id);

      return {
        reviewer,
        assignedCount: reviewerAssignments.length,
        completedCount: completedReviews.length,
        pendingCount: reviewerAssignments.filter(a => a.status === 'pending').length,
        abstracts: assignedAbstracts,
      };
    });

    setReviewerStats(stats);
  };

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const result = db.juryAssignments.autoAssign(event.id);
      setLastAssignmentResult(result);
      loadData();
      toast.success(`${result.assignments.length} trabajos asignados equitativamente`);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asignar');
    } finally {
      setIsAssigning(false);
    }
  };

  const totalAbstracts = db.abstracts.getByEvent(event.id).length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignmentsCount = assignments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{reviewers.length}</p>
                <p className="text-xs text-muted-foreground">Revisores Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{pendingAbstracts.length}</p>
                <p className="text-xs text-muted-foreground">Trabajos Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <ClipboardCheck className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{pendingAssignmentsCount}</p>
                <p className="text-xs text-muted-foreground">En Revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{completedAssignments}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Assignment Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Asignación Automática Equitativa
              </CardTitle>
              <CardDescription>
                Distribuye los trabajos pendientes equitativamente entre los revisores activos
              </CardDescription>
            </div>
            <Button
              variant="hero"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={pendingAbstracts.length === 0 || reviewers.length === 0}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Asignar Automáticamente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingAbstracts.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-accent" />
              <span>No hay trabajos pendientes para asignar</span>
            </div>
          ) : reviewers.length === 0 ? (
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>No hay revisores activos disponibles</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{pendingAbstracts.length} trabajos</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{reviewers.length} revisores</Badge>
                <span className="text-muted-foreground">=</span>
                <Badge variant="default">
                  ~{Math.ceil(pendingAbstracts.length / reviewers.length)} trabajos/revisor
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                El algoritmo distribuirá los trabajos de forma equitativa. Si hay residuo, 
                algunos revisores recibirán un trabajo adicional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewers Grid */}
      <div>
        <h3 className="text-lg font-display font-semibold mb-4">Estado de Revisores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviewerStats.map(stat => {
            const progress = stat.assignedCount > 0 
              ? (stat.completedCount / stat.assignedCount) * 100 
              : 0;

            return (
              <Card key={stat.reviewer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={stat.reviewer.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {stat.reviewer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{stat.reviewer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.reviewer.specialization || stat.reviewer.affiliation}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Asignados</span>
                      <Badge variant="secondary">{stat.assignedCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completados</span>
                      <Badge variant="default" className="bg-accent">
                        {stat.completedCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pendientes</span>
                      <Badge variant="outline" className="text-warning border-warning">
                        {stat.pendingCount}
                      </Badge>
                    </div>
                    {stat.assignedCount > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progreso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending Abstracts List */}
      {pendingAbstracts.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-semibold mb-4">Trabajos Pendientes de Asignación</h3>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pendingAbstracts.map(abstract => {
                  const author = db.users.getById(abstract.userId);
                  const assignedReviewers = (abstract as any).assignedReviewers || [];
                  
                  return (
                    <div 
                      key={abstract.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{abstract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {author?.name} • {abstract.keywords.slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignedReviewers.length > 0 ? (
                          <Badge variant="default" className="bg-info">
                            {assignedReviewers.length} revisor(es)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning">
                            Sin asignar
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirmar Asignación Automática</DialogTitle>
            <DialogDescription>
              Esta acción asignará los trabajos pendientes a los revisores de forma equitativa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Atención</p>
                  <p className="text-sm text-muted-foreground">
                    Esta acción eliminará las asignaciones previas y creará nuevas asignaciones 
                    equitativas para todos los trabajos pendientes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trabajos a asignar:</span>
                <span className="font-semibold">{pendingAbstracts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Revisores disponibles:</span>
                <span className="font-semibold">{reviewers.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Trabajos por revisor (aprox.):</span>
                <span className="font-semibold">
                  {reviewers.length > 0 ? Math.ceil(pendingAbstracts.length / reviewers.length) : 0}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="hero" 
              onClick={handleAutoAssign}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Confirmar Asignación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
