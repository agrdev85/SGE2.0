import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { JuryAssignmentManager } from '@/components/JuryAssignmentManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, Abstract } from '@/lib/database';
import { Users, FileText, Presentation, Image, Mic, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const categories = [
  { value: 'Ponencia', label: 'Ponencia', icon: Presentation, description: 'Presentación oral de 20 minutos' },
  { value: 'Poster', label: 'Poster', icon: Image, description: 'Presentación en formato póster' },
  { value: 'Conferencia', label: 'Conferencia', icon: Mic, description: 'Charla magistral invitada' },
] as const;

export default function Committee() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);

  useEffect(() => {
    loadAbstracts();
  }, []);

  const loadAbstracts = async () => {
    try {
      const data = db.abstracts.getApproved('1');
      setAbstracts(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCategory = async (category: 'Ponencia' | 'Poster' | 'Conferencia') => {
    if (!selectedAbstract) return;
    try {
      db.abstracts.assignCategory(selectedAbstract.id, category);
      toast.success('Categoría asignada correctamente');
      setSelectedAbstract(null);
      await loadAbstracts();
    } catch {
      toast.error('Error al asignar categoría');
    }
  };

  const categorizedCount = abstracts.filter(a => a.categoryType).length;
  const pendingCount = abstracts.filter(a => !a.categoryType).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Panel del Comité</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona categorías y asignaciones de árbitros
          </p>
        </div>

        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">
              <UserCog className="h-4 w-4 mr-2" />
              Asignación de Árbitros
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FileText className="h-4 w-4 mr-2" />
              Categorías
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            <JuryAssignmentManager eventId="1" />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-info/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-display">{abstracts.length}</p>
                      <p className="text-sm text-muted-foreground">Total aprobados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-warning/20">
                      <Users className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-display">{pendingCount}</p>
                      <p className="text-sm text-muted-foreground">Sin categorizar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/20">
                      <Presentation className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-display">{categorizedCount}</p>
                      <p className="text-sm text-muted-foreground">Categorizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Abstracts Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {abstracts.map(abstract => {
                  const mainAuthor = abstract.authors.find(a => a.isMainAuthor);
                  return (
                    <Card key={abstract.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">{abstract.title}</CardTitle>
                          {abstract.categoryType && (
                            <Badge variant="default">{abstract.categoryType}</Badge>
                          )}
                        </div>
                        <CardDescription>
                          {mainAuthor?.name || 'Sin autor'} • {abstract.createdAt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm line-clamp-3">{abstract.summaryText}</p>
                          <div className="flex flex-wrap gap-1">
                            {abstract.keywords.slice(0, 3).map(keyword => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          {!abstract.categoryType && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setSelectedAbstract(abstract)}
                            >
                              Asignar Categoría
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={!!selectedAbstract} onOpenChange={() => setSelectedAbstract(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Categoría</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de presentación para este trabajo
              </DialogDescription>
            </DialogHeader>

            {selectedAbstract && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Trabajo:</p>
                  <p className="text-sm text-muted-foreground">{selectedAbstract.title}</p>
                </div>

                <div className="grid gap-3">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        onClick={() => handleAssignCategory(category.value)}
                        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{category.label}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
