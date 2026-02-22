import React, { useState, useEffect } from 'react';
import { db, CMSArticle, CMSCategory } from '@/lib/database';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Save,
  X,
  Tag,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

const CMSArticlesManager: React.FC = () => {
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [categories, setCategories] = useState<CMSCategory[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<CMSArticle> | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<CMSCategory>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setArticles(db.cmsArticles.getAll());
    setCategories(db.cmsCategories.getAll());
  };

  const handleCreateNew = () => {
    setCurrentArticle({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'draft',
      author: localStorage.getItem('currentUserId') || '1',
      tags: [],
      featured: false,
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (article: CMSArticle) => {
    setCurrentArticle(article);
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!currentArticle?.title || !currentArticle?.slug) {
      toast.error('Título y URL son requeridos');
      return;
    }

    try {
      if (currentArticle.id) {
        db.cmsArticles.update(currentArticle.id, currentArticle);
      } else {
        db.cmsArticles.create(currentArticle as any);
      }
      setIsEditorOpen(false);
      setCurrentArticle(null);
      loadData();
    } catch (error) {
      toast.error('Error al guardar el artículo');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      db.cmsArticles.delete(id);
      loadData();
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error('Nombre y slug son requeridos');
      return;
    }

    db.cmsCategories.create({
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      orderIndex: categories.length,
    });

    setNewCategory({});
    setIsCategoryDialogOpen(false);
    loadData();
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const tags = currentArticle?.tags || [];
    if (!tags.includes(tagInput.trim())) {
      setCurrentArticle(prev => ({
        ...prev,
        tags: [...tags, tagInput.trim()]
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentArticle(prev => ({
      ...prev,
      tags: (prev?.tags || []).filter(t => t !== tag)
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const getStatusBadge = (status: CMSArticle['status']) => {
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
            <h1 className="text-3xl font-bold text-foreground">Gestión de Artículos</h1>
            <p className="text-muted-foreground mt-1">Crea y gestiona artículos para tu blog o noticias</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Categorías
          </Button>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vistas</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {article.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      <span className="font-medium">{article.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName(article.categoryId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {article.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>{article.views}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
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

      {/* Article Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentArticle?.id ? 'Editar Artículo' : 'Nuevo Artículo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={currentArticle?.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCurrentArticle(prev => ({
                      ...prev,
                      title,
                      slug: prev?.slug || generateSlug(title)
                    }));
                  }}
                  placeholder="Título del artículo"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL (Slug) *</Label>
                <Input
                  id="slug"
                  value={currentArticle?.slug || ''}
                  onChange={(e) => setCurrentArticle(prev => ({
                    ...prev,
                    slug: generateSlug(e.target.value)
                  }))}
                  placeholder="url-del-articulo"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea
                id="excerpt"
                value={currentArticle?.excerpt || ''}
                onChange={(e) => setCurrentArticle(prev => ({
                  ...prev,
                  excerpt: e.target.value
                }))}
                placeholder="Breve resumen del artículo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={currentArticle?.categoryId}
                  onValueChange={(value) => setCurrentArticle(prev => ({
                    ...prev,
                    categoryId: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={currentArticle?.status}
                  onValueChange={(value: any) => setCurrentArticle(prev => ({
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
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Agregar tag"
                />
                <Button type="button" onClick={handleAddTag}>
                  Agregar
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(currentArticle?.tags || []).map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={currentArticle?.featured || false}
                onCheckedChange={(checked) => setCurrentArticle(prev => ({
                  ...prev,
                  featured: checked as boolean
                }))}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Destacar este artículo
              </Label>
            </div>

            <div>
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={currentArticle?.content || ''}
                onChange={(e) => setCurrentArticle(prev => ({
                  ...prev,
                  content: e.target.value
                }))}
                placeholder="Contenido HTML del artículo..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditorOpen(false);
                  setCurrentArticle(null);
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

      {/* Category Management Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestión de Categorías</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="catName">Nombre</Label>
                <Input
                  id="catName"
                  value={newCategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewCategory(prev => ({
                      ...prev,
                      name,
                      slug: generateSlug(name)
                    }));
                  }}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div>
                <Label htmlFor="catSlug">Slug</Label>
                <Input
                  id="catSlug"
                  value={newCategory.slug || ''}
                  onChange={(e) => setNewCategory(prev => ({
                    ...prev,
                    slug: generateSlug(e.target.value)
                  }))}
                  placeholder="slug-categoria"
                />
              </div>
              <div>
                <Label htmlFor="catDesc">Descripción</Label>
                <Textarea
                  id="catDesc"
                  value={newCategory.description || ''}
                  onChange={(e) => setNewCategory(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Descripción de la categoría"
                  rows={3}
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Categoría
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Categorías Existentes</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{cat.name}</div>
                      <div className="text-sm text-gray-600">/{cat.slug}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Eliminar esta categoría?')) {
                          db.cmsCategories.delete(cat.id);
                          loadData();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSArticlesManager;
