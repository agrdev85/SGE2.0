import React, { useEffect, useState } from 'react';
import { db, CMSWidget } from '@/lib/database';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CMSWidgetsManager: React.FC = () => {
  const [widgets, setWidgets] = useState<CMSWidget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CMSWidget | null>(null);
  const [formData, setFormData] = useState<Partial<CMSWidget>>({
    name: '',
    type: 'text',
    location: 'sidebar',
    content: '',
    orderIndex: 0,
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = () => {
    const allWidgets = db.cmsWidgets.getAll();
    setWidgets(allWidgets);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingWidget) {
        db.cmsWidgets.update(editingWidget.id, formData);
        toast({
          title: 'Éxito',
          description: 'Widget actualizado correctamente',
        });
      } else {
        db.cmsWidgets.create(formData as Omit<CMSWidget, 'id' | 'createdAt' | 'updatedAt'>);
        toast({
          title: 'Éxito',
          description: 'Widget creado correctamente',
        });
      }
      resetForm();
      loadWidgets();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el widget',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (widget: CMSWidget) => {
    setEditingWidget(widget);
    setFormData(widget);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este widget?')) {
      db.cmsWidgets.delete(id);
      toast({
        title: 'Éxito',
        description: 'Widget eliminado correctamente',
      });
      loadWidgets();
    }
  };

  const resetForm = () => {
    setEditingWidget(null);
    setFormData({
      name: '',
      type: 'text',
      location: 'sidebar',
      content: '',
      orderIndex: 0,
      isActive: true,
    });
  };

  const getWidgetsByLocation = (location: 'sidebar' | 'footer' | 'header') => {
    return widgets.filter(w => w.location === location).sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Texto',
      html: 'HTML',
      'recent-articles': 'Artículos Recientes',
      categories: 'Categorías',
      search: 'Búsqueda',
      custom: 'Personalizado',
    };
    return labels[type] || type;
  };

  const renderWidgetCard = (widget: CMSWidget) => (
    <Card key={widget.id} className={!widget.isActive ? 'opacity-60' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(widget)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(widget.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="secondary">{getTypeLabel(widget.type)}</Badge>
            {widget.isActive ? (
              <Badge variant="default">Activo</Badge>
            ) : (
              <Badge variant="outline">Inactivo</Badge>
            )}
          </div>
          {widget.content && (
            <p className="text-sm text-gray-600 line-clamp-2">{widget.content}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => window.history.back()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Widgets</h1>
              <p className="text-muted-foreground mt-2">
                Administra los widgets que aparecen en el sidebar, header y footer de tu sitio
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWidget ? 'Editar Widget' : 'Nuevo Widget'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Widget</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Artículos Recientes"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Widget</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="recent-articles">Artículos Recientes</SelectItem>
                      <SelectItem value="categories">Categorías</SelectItem>
                      <SelectItem value="search">Búsqueda</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.type === 'text' || formData.type === 'html' || formData.type === 'custom') && (
                  <div>
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={
                        formData.type === 'html'
                          ? 'Escribe el código HTML aquí...'
                          : 'Escribe el contenido del widget...'
                      }
                      rows={6}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="order">Orden</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Los widgets con menor número aparecen primero
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Widget Activo</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingWidget ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Widgets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Sidebar
                <Badge variant="secondary">{getWidgetsByLocation('sidebar').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getWidgetsByLocation('sidebar').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay widgets en el sidebar
                </p>
              ) : (
                getWidgetsByLocation('sidebar').map(widget => renderWidgetCard(widget))
              )}
            </CardContent>
          </Card>

          {/* Header Widgets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Header
                <Badge variant="secondary">{getWidgetsByLocation('header').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getWidgetsByLocation('header').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay widgets en el header
                </p>
              ) : (
                getWidgetsByLocation('header').map(widget => renderWidgetCard(widget))
              )}
            </CardContent>
          </Card>

          {/* Footer Widgets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Footer
                <Badge variant="secondary">{getWidgetsByLocation('footer').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getWidgetsByLocation('footer').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay widgets en el footer
                </p>
              ) : (
                getWidgetsByLocation('footer').map(widget => renderWidgetCard(widget))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CMSWidgetsManager;
