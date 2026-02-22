import React, { useState, useEffect } from 'react';
import { db, CMSPage } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  FileText,
  Save,
  X,
  Image as ImageIcon,
  Code,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';

const CMSPagesManager: React.FC = () => {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Partial<CMSPage> | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = () => {
    setPages(db.cmsPages.getAll());
  };

  const handleCreateNew = () => {
    setCurrentPage({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'draft',
      author: localStorage.getItem('currentUserId') || '1',
      template: 'default',
      orderIndex: 0,
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (page: CMSPage) => {
    setCurrentPage(page);
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!currentPage?.title || !currentPage?.slug) {
      toast.error('Título y URL son requeridos');
      return;
    }

    try {
      if (currentPage.id) {
        db.cmsPages.update(currentPage.id, currentPage);
      } else {
        db.cmsPages.create(currentPage as Omit<CMSPage, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setIsEditorOpen(false);
      setCurrentPage(null);
      loadPages();
    } catch (error) {
      toast.error('Error al guardar la página');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta página?')) {
      db.cmsPages.delete(id);
      loadPages();
    }
  };

  const handlePublish = (id: string) => {
    db.cmsPages.publish(id);
    loadPages();
    toast.success('Página publicada');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const insertHTMLElement = (element: string) => {
    let htmlToInsert = '';
    
    switch (element) {
      case 'heading1':
        htmlToInsert = '<h1>Título Principal</h1>\n';
        break;
      case 'heading2':
        htmlToInsert = '<h2>Subtítulo</h2>\n';
        break;
      case 'paragraph':
        htmlToInsert = '<p>Nuevo párrafo de texto.</p>\n';
        break;
      case 'image':
        htmlToInsert = '<img src="" alt="Descripción" class="w-full rounded-lg" />\n';
        break;
      case 'button':
        htmlToInsert = '<button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Botón</button>\n';
        break;
      case 'divider':
        htmlToInsert = '<hr class="my-6 border-gray-200" />\n';
        break;
      case 'container':
        htmlToInsert = '<div class="container mx-auto px-4">\n  <!-- Contenido aquí -->\n</div>\n';
        break;
      case 'grid':
        htmlToInsert = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">\n  <div>Columna 1</div>\n  <div>Columna 2</div>\n</div>\n';
        break;
    }
    
    setCurrentPage(prev => ({
      ...prev,
      content: (prev?.content || '') + htmlToInsert
    }));
  };

  const getStatusBadge = (status: CMSPage['status']) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Páginas</h1>
            <p className="text-muted-foreground mt-1">Crea y gestiona las páginas de tu sitio web</p>
          </div>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Página
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Plantilla</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-sm text-gray-600">/{page.slug}</TableCell>
                  <TableCell>{page.template || 'default'}</TableCell>
                  <TableCell>{getStatusBadge(page.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {page.status !== 'published' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(page.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentPage?.id ? 'Editar Página' : 'Nueva Página'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={currentPage?.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCurrentPage(prev => ({
                      ...prev,
                      title,
                      slug: prev?.slug || generateSlug(title)
                    }));
                  }}
                  placeholder="Título de la página"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL (Slug) *</Label>
                <Input
                  id="slug"
                  value={currentPage?.slug || ''}
                  onChange={(e) => setCurrentPage(prev => ({
                    ...prev,
                    slug: generateSlug(e.target.value)
                  }))}
                  placeholder="url-de-la-pagina"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea
                id="excerpt"
                value={currentPage?.excerpt || ''}
                onChange={(e) => setCurrentPage(prev => ({
                  ...prev,
                  excerpt: e.target.value
                }))}
                placeholder="Breve descripción de la página"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={currentPage?.status}
                  onValueChange={(value: any) => setCurrentPage(prev => ({
                    ...prev,
                    status: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Plantilla</Label>
                <Select
                  value={currentPage?.template}
                  onValueChange={(value: any) => setCurrentPage(prev => ({
                    ...prev,
                    template: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Por Defecto</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="full-width">Ancho Completo</SelectItem>
                    <SelectItem value="sidebar">Con Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="orderIndex">Orden</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={currentPage?.orderIndex || 0}
                  onChange={(e) => setCurrentPage(prev => ({
                    ...prev,
                    orderIndex: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Contenido</Label>
                <div className="flex gap-2">
                  <Button
                    variant={editorMode === 'visual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('visual')}
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    Visual
                  </Button>
                  <Button
                    variant={editorMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('html')}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    HTML
                  </Button>
                </div>
              </div>

              {editorMode === 'visual' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('heading1')}
                    >
                      H1
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('heading2')}
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('paragraph')}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Párrafo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('image')}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Imagen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('button')}
                    >
                      Botón
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('divider')}
                    >
                      Separador
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('container')}
                    >
                      Container
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertHTMLElement('grid')}
                    >
                      Grid 2 Col
                    </Button>
                  </div>

                  <Textarea
                    value={currentPage?.content || ''}
                    onChange={(e) => setCurrentPage(prev => ({
                      ...prev,
                      content: e.target.value
                    }))}
                    placeholder="Contenido HTML de la página..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {editorMode === 'html' && (
                <Textarea
                  value={currentPage?.content || ''}
                  onChange={(e) => setCurrentPage(prev => ({
                    ...prev,
                    content: e.target.value
                  }))}
                  placeholder="<div>Contenido HTML aquí...</div>"
                  rows={20}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {/* SEO Settings */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Configuración SEO</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Título</Label>
                  <Input
                    id="metaTitle"
                    value={currentPage?.metaTitle || ''}
                    onChange={(e) => setCurrentPage(prev => ({
                      ...prev,
                      metaTitle: e.target.value
                    }))}
                    placeholder="Título para motores de búsqueda"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Descripción</Label>
                  <Textarea
                    id="metaDescription"
                    value={currentPage?.metaDescription || ''}
                    onChange={(e) => setCurrentPage(prev => ({
                      ...prev,
                      metaDescription: e.target.value
                    }))}
                    placeholder="Descripción para motores de búsqueda"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditorOpen(false);
                  setCurrentPage(null);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSPagesManager;
