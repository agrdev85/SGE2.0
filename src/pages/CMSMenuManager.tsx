import React, { useState, useEffect } from 'react';
import { db, CMSMenu, CMSMenuItem, CMSPage, CMSArticle, CMSCategory } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Menu as MenuIcon,
  Link2,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

const CMSMenuManager: React.FC = () => {
  const [menus, setMenus] = useState<CMSMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<CMSMenu | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<Partial<CMSMenuItem> | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocation, setNewMenuLocation] = useState<CMSMenu['location']>('header');
  
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [categories, setCategories] = useState<CMSCategory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMenus(db.cmsMenus.getAll());
    setPages(db.cmsPages.getPublished());
    setArticles(db.cmsArticles.getPublished());
    setCategories(db.cmsCategories.getAll());
  };

  const handleCreateMenu = () => {
    if (!newMenuName) {
      toast.error('El nombre del menú es requerido');
      return;
    }

    const newMenu = db.cmsMenus.create({
      name: newMenuName,
      location: newMenuLocation,
      items: [],
      isActive: true,
    });

    setNewMenuName('');
    setNewMenuLocation('header');
    setIsMenuDialogOpen(false);
    loadData();
    setSelectedMenu(newMenu);
  };

  const handleDeleteMenu = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este menú?')) {
      db.cmsMenus.delete(id);
      if (selectedMenu?.id === id) {
        setSelectedMenu(null);
      }
      loadData();
    }
  };

  const handleAddMenuItem = () => {
    setCurrentMenuItem({
      label: '',
      type: 'custom',
      orderIndex: selectedMenu?.items.length || 0,
      openInNewTab: false,
    });
    setIsItemDialogOpen(true);
  };

  const handleEditMenuItem = (item: CMSMenuItem) => {
    setCurrentMenuItem(item);
    setIsItemDialogOpen(true);
  };

  const handleSaveMenuItem = () => {
    if (!currentMenuItem?.label) {
      toast.error('La etiqueta es requerida');
      return;
    }

    if (!selectedMenu) return;

    const newItem: CMSMenuItem = {
      id: currentMenuItem.id || db['generateId'](),
      label: currentMenuItem.label,
      type: currentMenuItem.type || 'custom',
      url: currentMenuItem.url,
      pageId: currentMenuItem.pageId,
      articleId: currentMenuItem.articleId,
      categoryId: currentMenuItem.categoryId,
      parentId: currentMenuItem.parentId,
      orderIndex: currentMenuItem.orderIndex || 0,
      openInNewTab: currentMenuItem.openInNewTab || false,
      cssClass: currentMenuItem.cssClass,
      icon: currentMenuItem.icon,
    };

    let updatedItems = [...selectedMenu.items];
    
    if (currentMenuItem.id) {
      // Update existing item
      const index = updatedItems.findIndex(i => i.id === currentMenuItem.id);
      if (index !== -1) {
        updatedItems[index] = newItem;
      }
    } else {
      // Add new item
      updatedItems.push(newItem);
    }

    db.cmsMenus.update(selectedMenu.id, { items: updatedItems });
    setIsItemDialogOpen(false);
    setCurrentMenuItem(null);
    
    // Reload menu
    const updated = db.cmsMenus.getById(selectedMenu.id);
    setSelectedMenu(updated || null);
    loadData();
  };

  const handleDeleteMenuItem = (itemId: string) => {
    if (!selectedMenu) return;
    
    if (confirm('¿Eliminar este elemento del menú?')) {
      const updatedItems = selectedMenu.items.filter(i => i.id !== itemId && i.parentId !== itemId);
      db.cmsMenus.update(selectedMenu.id, { items: updatedItems });
      
      const updated = db.cmsMenus.getById(selectedMenu.id);
      setSelectedMenu(updated || null);
      loadData();
    }
  };

  const moveMenuItem = (itemId: string, direction: 'up' | 'down') => {
    if (!selectedMenu) return;

    const items = [...selectedMenu.items].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = items.findIndex(i => i.id === itemId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    
    // Reorder indices
    items.forEach((item, idx) => {
      item.orderIndex = idx;
    });

    db.cmsMenus.update(selectedMenu.id, { items });
    
    const updated = db.cmsMenus.getById(selectedMenu.id);
    setSelectedMenu(updated || null);
    loadData();
  };

  const getItemUrl = (item: CMSMenuItem): string => {
    switch (item.type) {
      case 'page':
        const page = pages.find(p => p.id === item.pageId);
        return page ? `/${page.slug}` : '#';
      case 'article':
        const article = articles.find(a => a.id === item.articleId);
        return article ? `/articulos/${article.slug}` : '#';
      case 'category':
        const category = categories.find(c => c.id === item.categoryId);
        return category ? `/categoria/${category.slug}` : '#';
      case 'external':
      case 'custom':
        return item.url || '#';
      default:
        return '#';
    }
  };

  const renderMenuItems = (items: CMSMenuItem[], level = 0) => {
    const parentItems = items
      .filter(i => !i.parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return parentItems.map((item) => {
      const childItems = items.filter(i => i.parentId === item.id);

      return (
        <div key={item.id} className={`${level > 0 ? 'ml-6 border-l-2 pl-4' : ''}`}>
          <div className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2 hover:bg-gray-50">
            <div className="flex items-center gap-3 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              {level > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{getItemUrl(item)}</div>
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">{item.type}</span>
                {item.openInNewTab && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Nueva pestaña</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveMenuItem(item.id, 'up')}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveMenuItem(item.id, 'down')}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditMenuItem(item)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMenuItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {childItems.length > 0 && renderMenuItems(items, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Menús</h1>
            <p className="text-muted-foreground mt-1">Crea y organiza los menús de navegación</p>
          </div>
        </div>
        <Button onClick={() => setIsMenuDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Menú
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Menus List */}
        <Card>
          <CardHeader>
            <CardTitle>Menús Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedMenu?.id === menu.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMenu(menu)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{menu.name}</div>
                      <div className="text-sm text-gray-600">{menu.location}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {menu.items.length} elementos
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMenu(menu.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedMenu ? `Elementos de ${selectedMenu.name}` : 'Selecciona un menú'}
              </CardTitle>
              {selectedMenu && (
                <Button onClick={handleAddMenuItem} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Elemento
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedMenu ? (
              selectedMenu.items.length > 0 ? (
                <div className="space-y-2">
                  {renderMenuItems(selectedMenu.items)}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MenuIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay elementos en este menú</p>
                  <Button onClick={handleAddMenuItem} className="mt-4">
                    Agregar Primer Elemento
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MenuIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona un menú de la lista para ver sus elementos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Menu Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Menú</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="menuName">Nombre del Menú</Label>
              <Input
                id="menuName"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="Ej: Menú Principal"
              />
            </div>
            <div>
              <Label htmlFor="menuLocation">Ubicación</Label>
              <Select
                value={newMenuLocation}
                onValueChange={(value: any) => setNewMenuLocation(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Cabecera</SelectItem>
                  <SelectItem value="footer">Pie de Página</SelectItem>
                  <SelectItem value="sidebar">Barra Lateral</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMenu}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Menú
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentMenuItem?.id ? 'Editar Elemento' : 'Nuevo Elemento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemLabel">Etiqueta *</Label>
              <Input
                id="itemLabel"
                value={currentMenuItem?.label || ''}
                onChange={(e) => setCurrentMenuItem(prev => ({
                  ...prev,
                  label: e.target.value
                }))}
                placeholder="Texto que se mostrará"
              />
            </div>

            <div>
              <Label htmlFor="itemType">Tipo de Enlace</Label>
              <Select
                value={currentMenuItem?.type}
                onValueChange={(value: any) => setCurrentMenuItem(prev => ({
                  ...prev,
                  type: value,
                  url: undefined,
                  pageId: undefined,
                  articleId: undefined,
                  categoryId: undefined,
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Página</SelectItem>
                  <SelectItem value="article">Artículo</SelectItem>
                  <SelectItem value="category">Categoría</SelectItem>
                  <SelectItem value="custom">Enlace Personalizado</SelectItem>
                  <SelectItem value="external">Enlace Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentMenuItem?.type === 'page' && (
              <div>
                <Label htmlFor="pageSelect">Seleccionar Página</Label>
                <Select
                  value={currentMenuItem.pageId}
                  onValueChange={(value) => setCurrentMenuItem(prev => ({
                    ...prev,
                    pageId: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar página" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentMenuItem?.type === 'article' && (
              <div>
                <Label htmlFor="articleSelect">Seleccionar Artículo</Label>
                <Select
                  value={currentMenuItem.articleId}
                  onValueChange={(value) => setCurrentMenuItem(prev => ({
                    ...prev,
                    articleId: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar artículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.map(article => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentMenuItem?.type === 'category' && (
              <div>
                <Label htmlFor="categorySelect">Seleccionar Categoría</Label>
                <Select
                  value={currentMenuItem.categoryId}
                  onValueChange={(value) => setCurrentMenuItem(prev => ({
                    ...prev,
                    categoryId: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(currentMenuItem?.type === 'custom' || currentMenuItem?.type === 'external') && (
              <div>
                <Label htmlFor="itemUrl">URL</Label>
                <Input
                  id="itemUrl"
                  value={currentMenuItem?.url || ''}
                  onChange={(e) => setCurrentMenuItem(prev => ({
                    ...prev,
                    url: e.target.value
                  }))}
                  placeholder={currentMenuItem?.type === 'external' ? 'https://ejemplo.com' : '/ruta/personalizada'}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="openInNewTab"
                checked={currentMenuItem?.openInNewTab || false}
                onCheckedChange={(checked) => setCurrentMenuItem(prev => ({
                  ...prev,
                  openInNewTab: checked as boolean
                }))}
              />
              <Label htmlFor="openInNewTab" className="cursor-pointer">
                Abrir en nueva pestaña
              </Label>
            </div>

            <div>
              <Label htmlFor="cssClass">Clase CSS (opcional)</Label>
              <Input
                id="cssClass"
                value={currentMenuItem?.cssClass || ''}
                onChange={(e) => setCurrentMenuItem(prev => ({
                  ...prev,
                  cssClass: e.target.value
                }))}
                placeholder="clase-css personalizada"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsItemDialogOpen(false);
                  setCurrentMenuItem(null);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveMenuItem}>
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

export default CMSMenuManager;
