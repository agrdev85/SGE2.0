import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { abstractsApi, Abstract } from '@/lib/mockApi';
import { Plus, Search, FileText, Eye, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Abstracts() {
  const { user } = useAuth();
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);

  useEffect(() => {
    const loadAbstracts = async () => {
      if (!user) return;
      try {
        const data = await abstractsApi.getMyAbstracts(user.id);
        setAbstracts(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadAbstracts();
  }, [user]);

  const filteredAbstracts = abstracts.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Mis Resúmenes</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus envíos de trabajos científicos
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/abstracts/new">
              <Plus className="h-4 w-4" />
              Nuevo Resumen
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o palabras clave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Abstracts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAbstracts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No hay resúmenes</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No se encontraron resultados' : 'Comienza enviando tu primer trabajo'}
              </p>
              {!searchQuery && (
                <Button variant="hero" asChild>
                  <Link to="/abstracts/new">
                    <Plus className="h-4 w-4" />
                    Enviar mi primer resumen
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAbstracts.map(abstract => (
              <Card key={abstract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 font-display">
                        {abstract.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Versión {abstract.version} • {new Date(abstract.updatedAt).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </div>
                    <StatusBadge status={abstract.status} size="sm" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {abstract.summaryText}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {abstract.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  {abstract.categoryType && (
                    <Badge variant="outline" className="mb-4">
                      {abstract.categoryType}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedAbstract(abstract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    {abstract.status === 'APROBADO_CON_CAMBIOS' && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/abstracts/edit/${abstract.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedAbstract} onOpenChange={() => setSelectedAbstract(null)}>
          <DialogContent className="max-w-2xl">
            {selectedAbstract && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <DialogTitle className="text-xl font-display pr-8">
                      {selectedAbstract.title}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="flex items-center gap-2 pt-2">
                    <StatusBadge status={selectedAbstract.status} />
                    <span className="text-muted-foreground">
                      • Versión {selectedAbstract.version}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Autores</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAbstract.authors.join(', ')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Resumen</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
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
                  {selectedAbstract.categoryType && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Categoría Asignada</h4>
                      <Badge>{selectedAbstract.categoryType}</Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
