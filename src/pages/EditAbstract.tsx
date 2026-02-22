import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { db, Abstract } from '@/lib/database';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditAbstract() {
  const { abstractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [abstract, setAbstract] = useState<Abstract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    summaryText: '',
    keywords: '',
    authors: '',
  });

  useEffect(() => {
    if (abstractId) {
      const found = db.abstracts.getById(abstractId);
      if (found) {
        // Only allow editing if status is APROBADO_CON_CAMBIOS and user owns it
        if (found.status === 'APROBADO_CON_CAMBIOS' && found.userId === user?.id) {
          setAbstract(found);
          setFormData({
            title: found.title,
            summaryText: found.summaryText,
            keywords: found.keywords.join(', '),
            authors: found.authors.join(', '),
          });
        } else {
          toast.error('No tienes permiso para editar este resumen');
          navigate('/abstracts');
        }
      } else {
        toast.error('Resumen no encontrado');
        navigate('/abstracts');
      }
    }
    setIsLoading(false);
  }, [abstractId, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abstract) return;

    if (!formData.title.trim() || !formData.summaryText.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSaving(true);

    try {
      db.abstracts.update(abstract.id, {
        title: formData.title.trim(),
        summaryText: formData.summaryText.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        authors: formData.authors.split(',').map((a: string) => ({ id: Date.now().toString(), name: a.trim(), isMainAuthor: false } as any)).filter((a: any) => a.name),
        version: abstract.version + 1,
        status: 'EN_PROCESO', // Reset to pending after changes
      });

      // Create notification
      db.notifications.create({
        userId: user!.id,
        type: 'abstract_status',
        title: 'Resumen Actualizado',
        message: `Tu resumen "${formData.title}" ha sido actualizado y enviado para nueva revisión.`,
        link: '/abstracts',
      });

      toast.success('Resumen actualizado exitosamente');
      navigate('/abstracts');
    } catch (error) {
      toast.error('Error al actualizar el resumen');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!abstract) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Resumen no encontrado</h2>
          <Button asChild>
            <Link to="/abstracts">Volver a mis resúmenes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Get reviews for this abstract to show feedback
  const reviews = db.reviews.getByAbstract(abstract.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/abstracts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Editar Resumen</h1>
            <p className="text-muted-foreground mt-1">
              Realiza los cambios solicitados y reenvía para revisión
            </p>
          </div>
        </div>

        {/* Reviewer Feedback Alert */}
        {reviews.length > 0 && (
          <Alert variant="default" className="bg-warning/10 border-warning">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning">Comentarios del Revisor</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="bg-background/50 p-3 rounded-lg">
                  <p className="text-sm text-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revisado el {new Date(review.reviewedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Version Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Información del Resumen</CardTitle>
                <CardDescription>Versión actual: {abstract.version}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                Aprobado con Cambios
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Editar Contenido</CardTitle>
              <CardDescription>
                Modifica los campos necesarios según los comentarios recibidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Trabajo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ingresa el título completo de tu trabajo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authors">Autores *</Label>
                <Input
                  id="authors"
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  placeholder="Nombre1, Nombre2, Nombre3"
                />
                <p className="text-xs text-muted-foreground">
                  Separa los nombres con comas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summaryText">Resumen del Trabajo *</Label>
                <Textarea
                  id="summaryText"
                  value={formData.summaryText}
                  onChange={(e) => setFormData({ ...formData, summaryText: e.target.value })}
                  placeholder="Describe tu trabajo de investigación..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.summaryText.length} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Palabras Clave</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="palabra1, palabra2, palabra3"
                />
                <p className="text-xs text-muted-foreground">
                  Separa las palabras clave con comas
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/abstracts')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar y Reenviar para Revisión'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
