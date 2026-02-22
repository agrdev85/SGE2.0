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
import { abstractsApi, reviewsApi, Abstract } from '@/lib/mockApi';
import { ClipboardCheck, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);
  const [reviewData, setReviewData] = useState({
    comment: '',
    score: 75,
    decision: '' as 'APROBADO' | 'APROBADO_CON_CAMBIOS' | 'RECHAZADO' | '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAbstracts();
  }, [user]);

  const loadAbstracts = async () => {
    if (!user) return;
    try {
      const data = await abstractsApi.getPendingReview(user.id);
      setAbstracts(data);
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
      await reviewsApi.create({
        abstractId: selectedAbstract.id,
        reviewerId: user!.id,
        decision: reviewData.decision,
        comment: reviewData.comment,
        score: reviewData.score,
      });
      setSelectedAbstract(null);
      setReviewData({ comment: '', score: 75, decision: '' });
      await loadAbstracts();
    } catch {
      toast.error('Error al enviar la revisión');
    } finally {
      setIsSubmitting(false);
    }
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
                  <p className="text-sm text-muted-foreground">Pendientes de revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abstracts List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : abstracts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-accent" />
              <h3 className="text-lg font-semibold mb-2">¡Todo al día!</h3>
              <p className="text-muted-foreground">
                No tienes resúmenes pendientes de revisión
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {abstracts.map(abstract => (
              <Card key={abstract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 font-display">
                    {abstract.title}
                  </CardTitle>
                  <CardDescription>
                    {abstract.authors.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {abstract.summaryText}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {abstract.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => setSelectedAbstract(abstract)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Revisar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedAbstract} onOpenChange={() => setSelectedAbstract(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedAbstract && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-display pr-8">
                    {selectedAbstract.title}
                  </DialogTitle>
                  <DialogDescription>
                    Por: {selectedAbstract.authors.join(', ')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 my-4">
                  {/* Abstract Content */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="text-sm font-semibold mb-2">Resumen</h4>
                    <p className="text-sm leading-relaxed">
                      {selectedAbstract.summaryText}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Palabras Clave</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAbstract.keywords.map(keyword => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Review Form */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold font-display mb-4">Tu Evaluación</h4>

                    {/* Score */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <Label>Puntuación</Label>
                        <span className="text-2xl font-bold text-primary">{reviewData.score}</span>
                      </div>
                      <Slider
                        value={[reviewData.score]}
                        onValueChange={([value]) => setReviewData({ ...reviewData, score: value })}
                        max={100}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 - Deficiente</span>
                        <span>50 - Regular</span>
                        <span>100 - Excelente</span>
                      </div>
                    </div>

                    {/* Decision */}
                    <div className="space-y-3 mb-6">
                      <Label>Decisión</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {decisions.map(d => (
                          <Button
                            key={d.value}
                            type="button"
                            variant={reviewData.decision === d.value ? 'default' : 'outline'}
                            className={reviewData.decision === d.value ? d.color : ''}
                            onClick={() => setReviewData({ ...reviewData, decision: d.value as any })}
                          >
                            <d.icon className="h-4 w-4 mr-1" />
                            {d.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comentarios</Label>
                      <Textarea
                        id="comment"
                        placeholder="Escribe tus observaciones sobre el trabajo..."
                        value={reviewData.comment}
                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAbstract(null)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enviar Evaluación'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
