import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, Abstract, Thematic } from '@/lib/database';
import { ClipboardCheck, FileText, Loader2, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Review() {
  const { user } = useAuth();
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [thematics, setThematics] = useState<Thematic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);
  const [reviewData, setReviewData] = useState({
    comment: '',
    score: 75,
    decision: '' as 'APROBADO' | 'APROBADO_CON_CAMBIOS' | 'RECHAZADO' | '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThematicDialog, setShowThematicDialog] = useState(false);
  const [abstractToChangeThematic, setAbstractToChangeThematic] = useState<Abstract | null>(null);
  const [newThematicId, setNewThematicId] = useState('');

  useEffect(() => {
    loadAbstracts();
  }, [user]);

  const loadAbstracts = async () => {
    if (!user) return;
    try {
      // Get abstracts assigned to this reviewer
      const assignments = db.workAssignments.getByReviewer(user.id);
      const assignedAbstracts = assignments
        .map(a => db.abstracts.getById(a.abstractId))
        .filter((a): a is Abstract => a !== undefined && a.status === 'EN_PROCESO');
      
      setAbstracts(assignedAbstracts);
      setThematics(db.thematics.getByEvent('1'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedAbstract || !reviewData.decision) {
      toast.error('Selecciona una decisión');
      return;
    }
    if (!reviewData.comment.trim()) {
      toast.error('Añade un comentario');
      return;
    }

    setIsSubmitting(true);
    try {
      db.reviews.create({
        abstractId: selectedAbstract.id,
        reviewerId: user!.id,
        decision: reviewData.decision,
        comment: reviewData.comment,
        score: reviewData.score,
      });
      
      toast.success('Revisión enviada correctamente');
      setSelectedAbstract(null);
      setReviewData({ comment: '', score: 75, decision: '' });
      await loadAbstracts();
    } catch {
      toast.error('Error al enviar la revisión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openThematicDialog = (abstract: Abstract) => {
    setAbstractToChangeThematic(abstract);
    setNewThematicId(abstract.thematicId || '');
    setShowThematicDialog(true);
  };

  const handleChangeThematic = () => {
    if (!abstractToChangeThematic || !newThematicId) {
      toast.error('Selecciona una temática');
      return;
    }

    try {
      const oldThematicId = abstractToChangeThematic.thematicId;
      db.abstracts.update(abstractToChangeThematic.id, { thematicId: newThematicId });

      // Check if there are other reviewers for this new thematic
      const newThematic = thematics.find(t => t.id === newThematicId);
      const reviewersForThematic = db.users.getReviewers()
        .filter(r => r.reviewerThematics?.includes(newThematicId));

      if (reviewersForThematic.length > 1) {
        // Notify coordinator that work needs reassignment
        const committeeMembers = db.committeeMembers.getByRole('1', 'RESPONSABLE_ASIGNACIONES');
        committeeMembers.forEach(cm => {
          db.notifications.create({
            userId: cm.userId,
            type: 'system',
            title: 'Trabajo requiere reasignación',
            message: `El trabajo "${abstractToChangeThematic.title}" cambió de temática y necesita ser reasignado.`,
            link: '/committee',
          });
        });

        toast.success(`Temática cambiada. Se notificó al coordinador para reasignar el trabajo.`);
      } else {
        toast.success('Temática cambiada correctamente');
      }

      setShowThematicDialog(false);
      setAbstractToChangeThematic(null);
      loadAbstracts();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la temática');
    }
  };

  const getThematicName = (thematicId?: string) => {
    if (!thematicId) return 'Sin temática';
    return thematics.find(t => t.id === thematicId)?.name || 'Desconocida';
  };

  const decisions = [
    { value: 'APROBADO', label: 'Aprobar', icon: CheckCircle, color: 'bg-accent hover:bg-accent/90' },
    { value: 'APROBADO_CON_CAMBIOS', label: 'Aprobar con Cambios', icon: AlertCircle, color: 'bg-info hover:bg-info/90' },
    { value: 'RECHAZADO', label: 'Rechazar', icon: XCircle, color: 'bg-destructive hover:bg-destructive/90' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Panel de Revisión</h1>
          <p className="text-muted-foreground mt-1">
            Evalúa los resúmenes asignados
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <ClipboardCheck className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display">{abstracts.length}</p>
                  <p className="text-sm text-muted-foreground">Asignados a ti</p>
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
                  <p className="text-3xl font-bold font-display">{db.reviews.getCountByReviewer(user?.id || '')}</p>
                  <p className="text-sm text-muted-foreground">Revisados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/20">
                  <FileText className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display">
                    {abstracts.length > 0 ? Math.round((db.reviews.getCountByReviewer(user?.id || '') / (abstracts.length + db.reviews.getCountByReviewer(user?.id || ''))) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Completado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abstracts List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : abstracts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ClipboardCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No hay trabajos pendientes</h3>
              <p className="text-muted-foreground">
                Has completado todas tus revisiones asignadas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {abstracts.map(abstract => {
              const mainAuthor = abstract.authors.find(a => a.isMainAuthor);
              return (
                <Card key={abstract.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{abstract.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {mainAuthor?.name || 'Sin autor'} • {abstract.createdAt}
                        </CardDescription>
                      </div>
                      <StatusBadge status={abstract.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{getThematicName(abstract.thematicId)}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openThematicDialog(abstract)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Cambiar
                        </Button>
                      </div>
                      <p className="text-sm line-clamp-3">{abstract.summaryText}</p>
                      <div className="flex flex-wrap gap-1">
                        {abstract.keywords.slice(0, 3).map(keyword => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => setSelectedAbstract(abstract)}
                    >
                      Revisar Trabajo
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedAbstract} onOpenChange={() => setSelectedAbstract(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Revisar Trabajo</DialogTitle>
              <DialogDescription>
                Evalúa el trabajo y proporciona retroalimentación
              </DialogDescription>
            </DialogHeader>

            {selectedAbstract && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">{selectedAbstract.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{getThematicName(selectedAbstract.thematicId)}</Badge>
                    {selectedAbstract.categoryType && (
                      <Badge>{selectedAbstract.categoryType}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Autor(es):</strong> {selectedAbstract.authors.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-sm">{selectedAbstract.summaryText}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedAbstract.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Puntuación: {reviewData.score}</Label>
                  <Slider
                    value={[reviewData.score]}
                    onValueChange={(value) => setReviewData({ ...reviewData, score: value[0] })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = Muy deficiente • 100 = Excelente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comentarios *</Label>
                  <Textarea
                    id="comment"
                    placeholder="Proporciona comentarios detallados sobre el trabajo..."
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Decisión *</Label>
                  <div className="grid gap-2">
                    {decisions.map(decision => {
                      const Icon = decision.icon;
                      return (
                        <button
                          key={decision.value}
                          onClick={() => setReviewData({ ...reviewData, decision: decision.value as any })}
                          className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors ${
                            reviewData.decision === decision.value ? 'border-primary bg-muted' : ''
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{decision.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAbstract(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Revisión'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Thematic Dialog */}
        <Dialog open={showThematicDialog} onOpenChange={setShowThematicDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Temática</DialogTitle>
              <DialogDescription>
                Selecciona la temática correcta para este trabajo
              </DialogDescription>
            </DialogHeader>

            {abstractToChangeThematic && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Trabajo:</p>
                  <p className="text-sm text-muted-foreground">{abstractToChangeThematic.title}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Temática actual:</p>
                  <Badge variant="outline">{getThematicName(abstractToChangeThematic.thematicId)}</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Nueva Temática *</Label>
                  <Select value={newThematicId} onValueChange={setNewThematicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una temática" />
                    </SelectTrigger>
                    <SelectContent>
                      {thematics.map(thematic => (
                        <SelectItem key={thematic.id} value={thematic.id}>
                          {thematic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Si hay múltiples árbitros para la nueva temática, 
                    se notificará al coordinador para que reasigne el trabajo.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowThematicDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangeThematic}>
                Cambiar Temática
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
