import React, { useState, useEffect } from 'react';
import { db, CMSSettings, User, Event, NomReceptivo, NomEmpresa, NomTipoParticipacion, NomTipoTransporte, NomHotel, NomTipoHabitacion, HotelTipoHabitacion, Salon, AuditLog, UserRole } from '@/lib/database';
import { normalizeText, isDuplicate, findSimilarItems, cn } from '@/lib/utils';
import { useAuth, roleLabels } from '@/contexts/AuthContext';
import { seedCMSData } from '@/lib/seedCMS';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Save, Settings, Palette, Globe, Shield, Users, Calendar, FileText, Database, Download, Plus, Pencil, Trash2, Search, BookOpen, Hotel, Bus, BedDouble, Briefcase, UserCheck, Eye, History, Building2, Handshake, Lightbulb, Image, Shuffle, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { NomenclatorModal } from '@/components/ui/NomenclatorModal';
import { ConfirmationDialog, ConfirmationVariant, useConfirmation } from '@/components/ui/ConfirmationDialog';
import { useWallpaperConfig, AURORA_PRESETS, type WallpaperMode, type BackgroundType } from '@/hooks/useWallpaperConfig';

// Generic CRUD Table component for nomencladores
function NomencladorTable<T extends { id: string }>({
  title, description, items, columns, onEdit, onDelete, onCreate, searchFields, renderBadge,
}: {
  title: string;
  description: string;
  items: T[];
  columns: { key: keyof T | string; label: string; render?: (item: T) => React.ReactNode }[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onCreate: () => void;
  searchFields?: (keyof T)[];
  renderBadge?: (item: T) => React.ReactNode;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? items.filter(item => {
        const q = search.toLowerCase();
        return (searchFields || Object.keys(item) as (keyof T)[]).some(
          k => String((item as any)[k] || '').toLowerCase().includes(q)
        );
      })
    : items;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />Nuevo
          </Button>
        </div>
        <div className="relative max-w-sm mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => <TableHead key={String(col.key)}>{col.label}</TableHead>)}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">Sin registros</TableCell></TableRow>
            ) : filtered.map(item => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={String(col.key)}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const SuperAdminPanel: React.FC = () => {
  const { user: currentUser, impersonateUser } = useAuth();
  const { config: wallpaperConfig, updateConfig, wallpapers } = useWallpaperConfig();
  const { confirm, success } = useConfirmation();
  const [activeTab, setActiveTab] = useState('overview');

  const handleDeleteWithConfirmation = async (itemType: string, itemName: string, onDelete: () => void) => {
    const confirmed = await confirm({
      title: `¿Eliminar ${itemType}?`,
      description: `¿Está seguro de que desea eliminar este ${itemType}? Esta acción no se puede deshacer.`,
      itemName,
      itemType,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    
    if (confirmed) {
      onDelete();
      await success({
        title: '¡Eliminado!',
        description: `${itemType} "${itemName}" ha sido eliminado correctamente.`,
        autoClose: 2000,
      });
    }
  };

  const handleInitCMS = async () => {
    const confirmed = await confirm({
      title: '¿Inicializar datos CMS?',
      description: 'Se crearán los datos iniciales del CMS. Esta acción puede sobrescribir datos existentes.',
      variant: 'warning',
      confirmText: 'Inicializar',
      cancelText: 'Cancelar',
    });
    
    if (confirmed) {
      seedCMSData();
      window.location.reload();
    }
  };

  const handleResetSystem = async () => {
    const confirmed = await confirm({
      title: '¿Restablecer Sistema?',
      description: '¿Está seguro de que desea borrar TODOS los datos del sistema? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Borrar Todo',
      cancelText: 'Cancelar',
    });
    
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [receptivos, setReceptivos] = useState<NomReceptivo[]>([]);
  const [empresas, setEmpresas] = useState<NomEmpresa[]>([]);
  const [tiposParticipacion, setTiposParticipacion] = useState<NomTipoParticipacion[]>([]);
  const [tiposTransporte, setTiposTransporte] = useState<NomTipoTransporte[]>([]);
  const [hoteles, setHoteles] = useState<NomHotel[]>([]);
  const [tiposHabitacion, setTiposHabitacion] = useState<NomTipoHabitacion[]>([]);
  const [hotelTiposHab, setHotelTiposHab] = useState<HotelTipoHabitacion[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<CMSSettings | null>(null);

  // Dialog states
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Suggestion dialog state
  const [suggestionDialog, setSuggestionDialog] = useState<{
    isOpen: boolean;
    itemType: string;
    itemLabel: string;
    newName: string;
    suggestions: any[];
    onSelectExisting: (item: any) => void;
    onCreateAnyway: () => void;
  }>({
    isOpen: false,
    itemType: '',
    itemLabel: '',
    newName: '',
    suggestions: [],
    onSelectExisting: () => {},
    onCreateAnyway: () => {},
  });

  // Delete confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    itemType: string;
    itemName: string;
    itemId: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemType: '',
    itemName: '',
    itemId: '',
    onConfirm: () => {},
  });



  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const handleDataChange = () => {
      loadAll();
    };
    window.addEventListener('sge-data-change', handleDataChange);
    return () => window.removeEventListener('sge-data-change', handleDataChange);
  }, []);

  const loadAll = () => {
    setUsers(db.users.getAll());
    setReceptivos(db.nomReceptivos.getAll());
    setEmpresas(db.nomEmpresas.getAll());
    setTiposParticipacion(db.nomTiposParticipacion.getAll());
    setTiposTransporte(db.nomTiposTransporte.getAll());
    setHoteles(db.nomHoteles.getAll());
    setTiposHabitacion(db.nomTiposHabitacion.getAll());
    setHotelTiposHab(db.hotelTiposHabitacion.getAll());
    setSalones(db.salones.getAll());
    setAuditLogs(db.auditLog.getAll());
    const s = db.cmsSettings.get();
    if (!s) {
      db.cmsSettings.update({ siteName: 'Sistema de Gestión de Eventos', siteDescription: 'Plataforma integral', primaryColor: '#3b82f6', secondaryColor: '#10b981', accentColor: '#f59e0b', fontFamily: 'Inter', headerStyle: 'default', footerStyle: 'default', socialLinks: {}, contactInfo: {}, seoSettings: {}, maintenanceMode: false, allowRegistration: true, moderateComments: false });
    }
    setSettings(db.cmsSettings.get() || null);
  };

  // Stats
  const stats = {
    totalUsers: users.length,
    totalReceptivos: receptivos.length,
    totalEmpresas: empresas.length,
    totalHoteles: hoteles.length,
    activeUsers: users.filter(u => u.isActive).length,
  };

  const openDialog = (type: string, item?: any) => {
    setDialogType(type);
    setEditingItem(item || null);
    setFormData(item ? { ...item } : {});
  };
  const closeDialog = () => { setDialogType(null); setEditingItem(null); setFormData({}); };

  // ===== CRUD HANDLERS WITH DUPLICATE VALIDATION =====
  const handleSaveReceptivo = () => {
    if (!editingItem) {
      const nombreField = formData.nombre;
      if (nombreField) {
        const existe = isDuplicate(receptivos, nombreField, r => r.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(receptivos, nombreField, r => r.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'receptivo',
            itemLabel: 'Receptivo',
            newName: nombreField,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearReceptivo();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearReceptivo();
  };

  const crearReceptivo = () => {
    try {
      if (editingItem) db.nomReceptivos.update(editingItem.id, formData);
      else db.nomReceptivos.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizado' : 'Creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Actualizado correctamente' : 'Creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteReceptivo = (r: NomReceptivo) => {
    handleDeleteWithConfirmation('receptivo', r.nombre, () => {
      db.nomReceptivos.delete(r.id);
      loadAll();
    });
  };

  const handleDeleteEmpresa = (e: NomEmpresa) => {
    handleDeleteWithConfirmation('empresa', e.nombre, () => {
      db.nomEmpresas.delete(e.id);
      loadAll();
    });
  };

  const handleSaveEmpresa = () => {
    if (!editingItem) {
      const nombreField = formData.nombre;
      if (nombreField) {
        const existe = isDuplicate(empresas, nombreField, e => e.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(empresas, nombreField, e => e.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'empresa',
            itemLabel: 'Empresa',
            newName: nombreField,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearEmpresa();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearEmpresa();
  };

  const crearEmpresa = () => {
    try {
      if (editingItem) db.nomEmpresas.update(editingItem.id, formData);
      else db.nomEmpresas.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizada' : 'Creada');
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveTipoParticipacion = () => {
    if (!editingItem) {
      if (formData.nombre) {
        const existe = isDuplicate(tiposParticipacion, formData.nombre, t => t.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(tiposParticipacion, formData.nombre, t => t.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'tipoParticipacion',
            itemLabel: 'Tipo de Participación',
            newName: formData.nombre,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearTipoParticipacion();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearTipoParticipacion();
  };

  const crearTipoParticipacion = () => {
    try {
      if (editingItem) db.nomTiposParticipacion.update(editingItem.id, formData);
      else db.nomTiposParticipacion.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizado' : 'Creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Actualizado correctamente' : 'Creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveTipoTransporte = () => {
    if (!editingItem) {
      if (formData.nombre) {
        const existe = isDuplicate(tiposTransporte, formData.nombre, t => t.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(tiposTransporte, formData.nombre, t => t.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'tipoTransporte',
            itemLabel: 'Tipo de Transporte',
            newName: formData.nombre,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearTipoTransporte();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearTipoTransporte();
  };

  const crearTipoTransporte = () => {
    try {
      if (editingItem) db.nomTiposTransporte.update(editingItem.id, formData);
      else db.nomTiposTransporte.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizado' : 'Creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Actualizado correctamente' : 'Creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveHotel = () => {
    if (!editingItem) {
      if (formData.nombre) {
        const existe = isDuplicate(hoteles, formData.nombre, h => h.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(hoteles, formData.nombre, h => h.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'hotel',
            itemLabel: 'Hotel',
            newName: formData.nombre,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearHotel();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearHotel();
  };

  const crearHotel = () => {
    try {
      if (editingItem) db.nomHoteles.update(editingItem.id, formData);
      else db.nomHoteles.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizado' : 'Creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Actualizado correctamente' : 'Creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteHotel = (h: NomHotel) => {
    handleDeleteWithConfirmation('hotel', h.nombre, () => {
      db.nomHoteles.delete(h.id);
      loadAll();
    });
  };

  const handleSaveSalon = () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('El código y nombre son obligatorios');
      return;
    }
    if (formData.capacidadMaxima <= 0) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }
    try {
      if (editingItem) db.salones.update(editingItem.id, formData);
      else db.salones.create({ ...formData, estado: formData.estado || 'ACTIVO', imagenes: [] });
      toast.success(editingItem ? 'Salón actualizado' : 'Salón creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Salón actualizado correctamente' : 'Salón creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteSalon = (s: Salon) => {
    handleDeleteWithConfirmation('salón', s.nombre || s.codigo, () => {
      db.salones.delete(s.id);
      loadAll();
    });
  };

  const handleSaveTipoHabitacion = () => {
    if (!editingItem) {
      if (formData.nombre) {
        const existe = isDuplicate(tiposHabitacion, formData.nombre, t => t.nombre);
        if (existe) {
          toast.error(`"${existe.nombre}" ya existe`);
          return;
        }
        const similares = findSimilarItems(tiposHabitacion, formData.nombre, t => t.nombre, 0.5);
        if (similares.length > 0) {
          setSuggestionDialog({
            isOpen: true,
            itemType: 'tipoHabitacion',
            itemLabel: 'Tipo de Habitación',
            newName: formData.nombre,
            suggestions: similares.map(s => s.item),
            onSelectExisting: () => {
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
              closeDialog();
            },
            onCreateAnyway: () => {
              crearTipoHabitacion();
              setSuggestionDialog(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }
      }
    }
    crearTipoHabitacion();
  };

  const crearTipoHabitacion = () => {
    try {
      if (editingItem) db.nomTiposHabitacion.update(editingItem.id, formData);
      else db.nomTiposHabitacion.create({ ...formData, activo: formData.activo ?? true });
      toast.success(editingItem ? 'Actualizado' : 'Creado');
      success({ title: '¡Guardado!', description: editingItem ? 'Actualizado correctamente' : 'Creado correctamente' });
      closeDialog(); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const changeUserRole = (userId: string, newRole: UserRole) => {
    db.users.update(userId, { role: newRole });
    db.auditLog.create({ userId: currentUser?.id || '', action: 'CHANGE_ROLE', entity: 'user', entityId: userId, details: `Rol cambiado a ${newRole}` });
    loadAll();
    toast.success('Rol actualizado');
    success({ title: '¡Guardado!', description: 'Rol actualizado correctamente' });
  };

  const handleDeleteTipoParticipacion = (t: NomTipoParticipacion) => {
    handleDeleteWithConfirmation('tipo de participación', t.nombre, () => {
      db.nomTiposParticipacion.delete(t.id);
      loadAll();
    });
  };

  const handleDeleteTipoTransporte = (t: NomTipoTransporte) => {
    handleDeleteWithConfirmation('tipo de transporte', t.nombre, () => {
      db.nomTiposTransporte.delete(t.id);
      loadAll();
    });
  };

  const handleDeleteTipoHabitacion = (t: NomTipoHabitacion) => {
    handleDeleteWithConfirmation('tipo de habitación', t.nombre, () => {
      db.nomTiposHabitacion.delete(t.id);
      loadAll();
    });
  };

  const toggleUserActive = (userId: string, isActive: boolean) => {
    db.users.update(userId, { isActive });
    loadAll();
    toast.success(`Usuario ${isActive ? 'activado' : 'desactivado'}`);
    success({ title: '¡Guardado!', description: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente` });
  };

  const handleExportData = () => {
    const data = { users: db.users.getAll(), events: db.events.getAll(), macroEvents: db.macroEvents.getAll(), receptivos, empresas, hoteles, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados');
  };

  const handleSaveSettings = () => {
    if (!settings) return;
    db.cmsSettings.update(settings);
    toast.success('Configuración guardada');
  };

  const handleUpdateSetting = (key: keyof CMSSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />Panel SuperAdmin
            </h1>
            <p className="text-muted-foreground mt-1">Gestión de nomencladores, roles, permisos y configuración global</p>
          </div>
          <Button onClick={handleExportData} variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar Datos</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { icon: Users, label: 'Usuarios', value: stats.totalUsers, color: 'text-primary' },
            { icon: Handshake, label: 'Receptivos', value: stats.totalReceptivos, color: 'text-info' },
            { icon: Briefcase, label: 'Empresas', value: stats.totalEmpresas, color: 'text-accent' },
            { icon: Hotel, label: 'Hoteles', value: stats.totalHoteles, color: 'text-warning' },
            { icon: UserCheck, label: 'Activos', value: stats.activeUsers, color: 'text-success' },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-6 text-center">
              <s.icon className={`h-8 w-8 mx-auto ${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent></Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="receptivos">Receptivos</TabsTrigger>
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="hoteles">Hoteles</TabsTrigger>
            <TabsTrigger value="salones">Salones</TabsTrigger>
            <TabsTrigger value="tiposParticipacion">Tipos Participación</TabsTrigger>
            <TabsTrigger value="tiposTransporte">Tipos Transporte</TabsTrigger>
            <TabsTrigger value="tiposHabitacion">Tipos Habitación</TabsTrigger>
            <TabsTrigger value="users">Usuarios & Roles</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle>Matriz de Roles</CardTitle></CardHeader><CardContent>
                <Table><TableHeader><TableRow><TableHead>Rol</TableHead><TableHead>Alcance</TableHead><TableHead>Usuarios</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(['SUPERADMIN', 'ADMIN_RECEPTIVO', 'ADMIN_EMPRESA', 'COORDINADOR_HOTEL', 'LECTOR_RECEPTIVO', 'LECTOR_EMPRESA', 'COMMITTEE', 'REVIEWER', 'USER'] as UserRole[]).map(role => (
                    <TableRow key={role}><TableCell><Badge variant="outline">{roleLabels[role]}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{
                      role === 'SUPERADMIN' ? 'Global' : role === 'ADMIN_RECEPTIVO' ? 'Su receptivo' : role === 'ADMIN_EMPRESA' ? 'Su empresa' : role === 'COORDINADOR_HOTEL' ? 'Eventos en su hotel' : role.includes('LECTOR') ? 'Solo lectura' : 'Funciones específicas'
                    }</TableCell>
                    <TableCell className="text-center font-bold">{users.filter(u => u.role === role).length}</TableCell></TableRow>
                  ))}
                </TableBody></Table>
              </CardContent></Card>

              <Card><CardHeader><CardTitle>Reglas de Aislamiento</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
                {[
                  { id: 'RB-SEG-01', rule: 'Aislamiento por Receptivo', desc: 'Admin Receptivo NO ve datos de otros receptivos' },
                  { id: 'RB-SEG-02', rule: 'Aislamiento por Empresa', desc: 'Admin Empresa NO ve datos de otras empresas' },
                  { id: 'RB-SEG-03', rule: 'Aislamiento por Hotel', desc: 'Coordinador Hotel SOLO ve eventos en su hotel' },
                  { id: 'RB-SEG-04', rule: 'Herencia de Permisos', desc: 'Submódulos heredan aislamiento del evento padre' },
                  { id: 'RB-SEG-05', rule: 'Validación de Propiedad', desc: 'Toda consulta valida IDs de aislamiento' },
                  { id: 'RB-SEG-06', rule: 'SuperAdmin Impersonar', desc: 'SuperAdmin puede actuar como cualquier rol' },
                ].map(r => (
                  <div key={r.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2"><Badge className="text-[10px]">{r.id}</Badge><span className="font-medium">{r.rule}</span></div>
                    <p className="text-muted-foreground mt-1">{r.desc}</p>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          </TabsContent>

          {/* Receptivos */}
          <TabsContent value="receptivos">
            <NomencladorTable
              title="Catálogo de Receptivos" description="Agencias o grupos turísticos (RB-NOM-01: siglas únicas)"
              items={receptivos}
              columns={[
                { key: 'siglas', label: 'Siglas', render: r => <Badge variant="outline">{r.siglas}</Badge> },
                { key: 'nombre', label: 'Nombre', render: r => <span className="font-medium">{r.nombre}</span> },
                { key: 'contactoEmail', label: 'Email' },
                { key: 'contactoTelefono', label: 'Teléfono' },
                { key: 'activo', label: 'Estado', render: r => <Badge variant={r.activo ? 'default' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge> },
                { key: 'empresas', label: 'Empresas', render: r => <span className="text-center">{empresas.filter(e => e.receptivoId === r.id).length}</span> },
              ]}
              searchFields={['siglas', 'nombre', 'contactoEmail']}
              onEdit={r => openDialog('receptivo', r)}
              onDelete={handleDeleteReceptivo}
              onCreate={() => openDialog('receptivo')}
            />
          </TabsContent>

          {/* Empresas */}
          <TabsContent value="empresas">
            <NomencladorTable
              title="Catálogo de Empresas" description="Sub-agencias por receptivo (RB-NOM-04: código único por receptivo)"
              items={empresas}
              columns={[
                { key: 'codigo', label: 'Código', render: e => <Badge variant="outline">{e.codigo}</Badge> },
                { key: 'nombre', label: 'Nombre', render: e => <span className="font-medium">{e.nombre}</span> },
                { key: 'receptivoId', label: 'Receptivo', render: e => { const r = receptivos.find(r => r.id === e.receptivoId); return r ? r.nombre : '-'; } },
                { key: 'contactoPrincipal', label: 'Contacto' },
                { key: 'contactoEmail', label: 'Email' },
                { key: 'activo', label: 'Estado', render: e => <Badge variant={e.activo ? 'default' : 'secondary'}>{e.activo ? 'Activa' : 'Inactiva'}</Badge> },
              ]}
              searchFields={['codigo', 'nombre', 'contactoEmail']}
              onEdit={e => openDialog('empresa', e)}
              onDelete={handleDeleteEmpresa}
              onCreate={() => openDialog('empresa')}
            />
          </TabsContent>

          {/* Hoteles */}
          <TabsContent value="hoteles">
            <NomencladorTable
              title="Catálogo de Hoteles" description="Hoteles globales del sistema (RB-NOM-06: Solo SuperAdmin)"
              items={hoteles}
              columns={[
                { key: 'nombre', label: 'Nombre', render: h => <span className="font-medium">{h.nombre}</span> },
                { key: 'cadenaHotelera', label: 'Cadena' },
                { key: 'categoriaEstrellas', label: 'Estrellas', render: h => <span>{'⭐'.repeat(h.categoriaEstrellas)}</span> },
                { key: 'ciudad', label: 'Ciudad' },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'activo', label: 'Estado', render: h => <Badge variant={h.activo ? 'default' : 'secondary'}>{h.activo ? 'Activo' : 'Inactivo'}</Badge> },
              ]}
              searchFields={['nombre', 'cadenaHotelera', 'ciudad']}
              onEdit={h => openDialog('hotel', h)}
              onDelete={handleDeleteHotel}
              onCreate={() => openDialog('hotel')}
            />
          </TabsContent>

          {/* Salones */}
          <TabsContent value="salones">
            <NomencladorTable
              title="Catálogo de Salones" description="Salones de hoteles del sistema"
              items={salones}
              columns={[
                { key: 'codigo', label: 'Código', render: s => <Badge variant="outline">{s.codigo}</Badge> },
                { key: 'nombre', label: 'Nombre', render: s => <span className="font-medium">{s.nombre}</span> },
                { key: 'hotelId', label: 'Hotel', render: s => { const h = hoteles.find(h => h.id === s.hotelId); return h ? h.nombre : '-'; } },
                { key: 'ubicacion', label: 'Ubicación' },
                { key: 'capacidadMaxima', label: 'Capacidad' },
                { key: 'estado', label: 'Estado', render: s => <Badge variant={s.estado === 'ACTIVO' ? 'default' : 'secondary'}>{s.estado}</Badge> },
              ]}
              searchFields={['codigo', 'nombre', 'ubicacion']}
              onEdit={s => openDialog('salon', s)}
              onDelete={handleDeleteSalon}
              onCreate={() => openDialog('salon')}
            />
          </TabsContent>

          {/* Tipos Participación */}
          <TabsContent value="tiposParticipacion">
            <NomencladorTable
              title="Tipos de Participación" description="Categorías de participantes"
              items={tiposParticipacion}
              columns={[
                { key: 'nombre', label: 'Nombre', render: t => <Badge>{t.nombre}</Badge> },
                { key: 'descripcion', label: 'Descripción' },
                { key: 'requierePago', label: 'Pago', render: t => t.requierePago ? <Badge variant="destructive">Sí</Badge> : <Badge variant="outline">No</Badge> },
                { key: 'apareceEnListadoPublico', label: 'Público', render: t => t.apareceEnListadoPublico ? '✓' : '—' },
                { key: 'activo', label: 'Estado', render: t => <Badge variant={t.activo ? 'default' : 'secondary'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge> },
              ]}
              onEdit={t => openDialog('tipoParticipacion', t)}
              onDelete={handleDeleteTipoParticipacion}
              onCreate={() => openDialog('tipoParticipacion')}
            />
          </TabsContent>

          {/* Tipos Transporte */}
          <TabsContent value="tiposTransporte">
            <NomencladorTable
              title="Tipos de Transporte" description="Vehículos y servicios de transporte"
              items={tiposTransporte}
              columns={[
                { key: 'nombre', label: 'Nombre', render: t => <span className="font-medium">{t.nombre}</span> },
                { key: 'descripcion', label: 'Descripción' },
                { key: 'capacidadMin', label: 'Cap. Mín' },
                { key: 'capacidadMax', label: 'Cap. Máx' },
                { key: 'requiereChofer', label: 'Chófer', render: t => t.requiereChofer ? '✓' : '—' },
                { key: 'activo', label: 'Estado', render: t => <Badge variant={t.activo ? 'default' : 'secondary'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge> },
              ]}
              onEdit={t => openDialog('tipoTransporte', t)}
              onDelete={handleDeleteTipoTransporte}
              onCreate={() => openDialog('tipoTransporte')}
            />
          </TabsContent>

          {/* Tipos Habitación */}
          <TabsContent value="tiposHabitacion">
            <NomencladorTable
              title="Tipos de Habitación" description="Categorías de alojamiento"
              items={tiposHabitacion}
              columns={[
                { key: 'nombre', label: 'Nombre', render: t => <span className="font-medium">{t.nombre}</span> },
                { key: 'descripcion', label: 'Descripción' },
                { key: 'capacidadMaxPersonas', label: 'Capacidad Máx.' },
                { key: 'activo', label: 'Estado', render: t => <Badge variant={t.activo ? 'default' : 'secondary'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge> },
              ]}
              onEdit={t => openDialog('tipoHabitacion', t)}
              onDelete={handleDeleteTipoHabitacion}
              onCreate={() => openDialog('tipoHabitacion')}
            />
          </TabsContent>

          {/* Users & Roles */}
          <TabsContent value="users">
            <Card><CardHeader><CardTitle>Gestión de Usuarios y Roles</CardTitle><CardDescription>Asigna roles, activa/desactiva usuarios e impersona (RB-SEG-06)</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">{u.name.charAt(0)}</div>
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}{u.receptivoId ? ` • Receptivo: ${receptivos.find(r => r.id === u.receptivoId)?.siglas || u.receptivoId}` : ''}{u.hotelId ? ` • Hotel: ${hoteles.find(h => h.id === u.hotelId)?.nombre || u.hotelId}` : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={u.role} onValueChange={(v: UserRole) => changeUserRole(u.id, v)}>
                        <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(['SUPERADMIN', 'ADMIN_RECEPTIVO', 'ADMIN_EMPRESA', 'COORDINADOR_HOTEL', 'LECTOR_RECEPTIVO', 'LECTOR_EMPRESA', 'COMMITTEE', 'REVIEWER', 'USER'] as UserRole[]).map(role => (
                            <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Switch checked={u.isActive} onCheckedChange={c => toggleUserActive(u.id, c)} />
                      {currentUser?.role === 'SUPERADMIN' && u.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => impersonateUser(u.id)} title="Impersonar"><Eye className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Config */}
          <TabsContent value="config">
            {/* Wallpaper Configuration */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Fondo de Diálogos
                </CardTitle>
                <CardDescription>
                  Personaliza el fondo difuminado que se muestra detrás de todos los diálogos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type selector */}
                <div className="space-y-3">
                  <Label>Tipo de Fondo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateConfig({ backgroundType: 'wallpaper' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        wallpaperConfig.backgroundType === 'wallpaper'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500" />
                        <div>
                          <p className="font-medium">Wallpaper</p>
                          <p className="text-xs text-muted-foreground">Imágenes de paisajes</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => updateConfig({ backgroundType: 'aurora' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        wallpaperConfig.backgroundType === 'aurora'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-green-400 via-cyan-400 to-purple-500 animate-pulse" />
                        <div>
                          <p className="font-medium">Aurora</p>
                          <p className="text-xs text-muted-foreground">Efecto boreal animado</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mode selector */}
                <div className="space-y-3">
                  <Label>Modo</Label>
                  <div className="flex gap-2">
                    {([
                      { value: 'random', label: 'Aleatorio', icon: Shuffle },
                      { value: 'sequential', label: 'Secuencial', icon: Palette },
                      { value: 'fixed', label: 'Fijo', icon: Check },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => updateConfig({ wallpaperMode: value })}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all',
                          wallpaperConfig.wallpaperMode === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallpaper selector */}
                {wallpaperConfig.backgroundType === 'wallpaper' && (
                  <div className="space-y-3">
                    <Label>Seleccionar Wallpaper</Label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                      {wallpapers.map((wp, idx) => (
                        <button
                          key={idx}
                          onClick={() => updateConfig({ fixedWallpaper: wp })}
                          className={cn(
                            'relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                            wallpaperConfig.fixedWallpaper === wp
                              ? 'border-primary ring-2 ring-primary/50'
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                        >
                          <img src={wp} alt="" className="w-full h-full object-cover" />
                          {wallpaperConfig.fixedWallpaper === wp && (
                            <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aurora preset selector */}
                {wallpaperConfig.backgroundType === 'aurora' && (
                  <div className="space-y-3">
                    <Label>Estilo de Aurora</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {AURORA_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateConfig({ fixedAuroraPreset: preset.id })}
                          className={cn(
                            'relative p-3 rounded-xl border-2 transition-all',
                            wallpaperConfig.fixedAuroraPreset === preset.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div 
                            className="w-full h-10 rounded-lg mb-2"
                            style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]})` }}
                          />
                          <p className="text-xs font-medium text-center">{preset.name}</p>
                          {wallpaperConfig.fixedAuroraPreset === preset.id && (
                            <div className="absolute top-1 right-1">
                              <Check className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {settings && (
              <Card><CardHeader><CardTitle>Configuración Global</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nombre del Sitio</Label><Input value={settings.siteName} onChange={e => handleUpdateSetting('siteName', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Descripción</Label><Input value={settings.siteDescription} onChange={e => handleUpdateSetting('siteDescription', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Color Primario</Label><div className="flex gap-2"><Input type="color" value={settings.primaryColor} onChange={e => handleUpdateSetting('primaryColor', e.target.value)} className="w-16 h-10" /><Input value={settings.primaryColor} onChange={e => handleUpdateSetting('primaryColor', e.target.value)} /></div></div>
                  <div className="space-y-2"><Label>Color Secundario</Label><div className="flex gap-2"><Input type="color" value={settings.secondaryColor} onChange={e => handleUpdateSetting('secondaryColor', e.target.value)} className="w-16 h-10" /><Input value={settings.secondaryColor} onChange={e => handleUpdateSetting('secondaryColor', e.target.value)} /></div></div>
                  <div className="space-y-2"><Label>Color Acento</Label><div className="flex gap-2"><Input type="color" value={settings.accentColor} onChange={e => handleUpdateSetting('accentColor', e.target.value)} className="w-16 h-10" /><Input value={settings.accentColor} onChange={e => handleUpdateSetting('accentColor', e.target.value)} /></div></div>
                </div>
                <Separator />
                <div className="flex items-center justify-between"><div><Label>Modo Mantenimiento</Label><p className="text-xs text-muted-foreground">Desactivar temporalmente</p></div><Switch checked={settings.maintenanceMode} onCheckedChange={c => handleUpdateSetting('maintenanceMode', c)} /></div>
                <div className="flex justify-end"><Button onClick={handleSaveSettings}><Save className="h-4 w-4 mr-2" />Guardar</Button></div>
              </CardContent></Card>
            )}
            <Card className="mt-4"><CardHeader><CardTitle>Herramientas Avanzadas</CardTitle></CardHeader><CardContent className="space-y-3">
              <Button variant="outline" className="w-full" onClick={handleInitCMS}>Inicializar Datos CMS</Button>
              <Button variant="destructive" className="w-full" onClick={handleResetSystem}>Restablecer Sistema</Button>
            </CardContent></Card>
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit">
            <Card><CardHeader><CardTitle>Log de Auditoría</CardTitle><CardDescription>Registro de acciones del sistema (RB-SEG-06)</CardDescription></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin registros de auditoría</p>
              ) : (
                <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>Detalles</TableHead></TableRow></TableHeader>
                <TableBody>
                  {auditLogs.slice(0, 50).map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{users.find(u => u.id === log.userId)?.name || log.userId}</TableCell>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell className="text-xs">{log.entity}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== DIALOGS ===== */}
      {/* Receptivo Dialog */}
      <Dialog open={dialogType === 'receptivo'} onOpenChange={() => closeDialog()}>
        <DialogContent><DialogHeader><DialogTitle>{editingItem ? 'Editar Receptivo' : 'Nuevo Receptivo'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Siglas *</Label><Input value={formData.siglas || ''} onChange={e => setFormData({ ...formData, siglas: e.target.value.toUpperCase() })} placeholder="HAV" /></div>
            <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.contactoEmail || ''} onChange={e => setFormData({ ...formData, contactoEmail: e.target.value })} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={formData.contactoTelefono || ''} onChange={e => setFormData({ ...formData, contactoTelefono: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={formData.activo ?? true} onCheckedChange={v => setFormData({ ...formData, activo: v })} /><Label>Activo</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancelar</Button><Button onClick={handleSaveReceptivo}>{editingItem ? 'Actualizar' : 'Crear'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empresa Dialog */}
      <Dialog open={dialogType === 'empresa'} onOpenChange={() => closeDialog()}>
        <DialogContent><DialogHeader><DialogTitle>{editingItem ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Receptivo *</Label>
            <Select value={formData.receptivoId || ''} onValueChange={v => setFormData({ ...formData, receptivoId: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>{receptivos.map(r => <SelectItem key={r.id} value={r.id}>{r.siglas} - {r.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Código *</Label><Input value={formData.codigo || ''} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} /></div>
            <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>NIT/RFC</Label><Input value={formData.nitRfc || ''} onChange={e => setFormData({ ...formData, nitRfc: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contacto Principal</Label><Input value={formData.contactoPrincipal || ''} onChange={e => setFormData({ ...formData, contactoPrincipal: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.contactoEmail || ''} onChange={e => setFormData({ ...formData, contactoEmail: e.target.value })} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={formData.contactoTelefono || ''} onChange={e => setFormData({ ...formData, contactoTelefono: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Dirección</Label><Textarea value={formData.direccion || ''} onChange={e => setFormData({ ...formData, direccion: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-2"><Switch checked={formData.activo ?? true} onCheckedChange={v => setFormData({ ...formData, activo: v })} /><Label>Activa</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancelar</Button><Button onClick={handleSaveEmpresa}>{editingItem ? 'Actualizar' : 'Crear'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hotel Modal - Usando NomenclatorModal */}
      <NomenclatorModal
        open={dialogType === 'hotel'}
        onOpenChange={() => closeDialog()}
        type="hotel"
        mode={editingItem ? 'edit' : 'create'}
        formData={formData}
        onFormChange={setFormData}
        errors={formErrors}
        onSave={handleSaveHotel}
        onDelete={editingItem ? () => handleDeleteHotel(editingItem) : undefined}
        similarItems={findSimilarItems(hoteles, formData.nombre || '', h => h.nombre, 0.5).map(s => s.item.nombre)}
      />

      {/* Tipo Participación Modal - Usando NomenclatorModal */}
      <NomenclatorModal
        open={dialogType === 'tipoParticipacion'}
        onOpenChange={() => closeDialog()}
        type="tipoParticipacion"
        mode={editingItem ? 'edit' : 'create'}
        formData={formData}
        onFormChange={setFormData}
        errors={formErrors}
        onSave={handleSaveTipoParticipacion}
        onDelete={editingItem ? () => { db.nomTiposParticipacion.delete(editingItem.id); loadAll(); closeDialog(); } : undefined}
        similarItems={findSimilarItems(tiposParticipacion, formData.nombre || '', t => t.nombre, 0.5).map(s => s.item.nombre)}
      />

      {/* Tipo Transporte Dialog */}
      <Dialog open={dialogType === 'tipoTransporte'} onOpenChange={() => closeDialog()}>
        <DialogContent><DialogHeader><DialogTitle>{editingItem ? 'Editar Tipo' : 'Nuevo Tipo de Transporte'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></div>
          <div className="space-y-2"><Label>Descripción</Label><Textarea value={formData.descripcion || ''} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Capacidad Mín.</Label><Input type="number" value={formData.capacidadMin || ''} onChange={e => setFormData({ ...formData, capacidadMin: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Capacidad Máx.</Label><Input type="number" value={formData.capacidadMax || ''} onChange={e => setFormData({ ...formData, capacidadMax: Number(e.target.value) })} /></div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2"><Switch checked={formData.requiereChofer ?? false} onCheckedChange={v => setFormData({ ...formData, requiereChofer: v })} /><Label>Requiere Chófer</Label></div>
            <div className="flex items-center gap-2"><Switch checked={formData.requiereLicenciaEspecial ?? false} onCheckedChange={v => setFormData({ ...formData, requiereLicenciaEspecial: v })} /><Label>Licencia Especial</Label></div>
            <div className="flex items-center gap-2"><Switch checked={formData.costoPorPersona ?? false} onCheckedChange={v => setFormData({ ...formData, costoPorPersona: v })} /><Label>Costo por Persona</Label></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={formData.activo ?? true} onCheckedChange={v => setFormData({ ...formData, activo: v })} /><Label>Activo</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancelar</Button><Button onClick={handleSaveTipoTransporte}>{editingItem ? 'Actualizar' : 'Crear'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tipo Habitación Modal - Usando NomenclatorModal */}
      <NomenclatorModal
        open={dialogType === 'tipoHabitacion'}
        onOpenChange={() => closeDialog()}
        type="tipoHabitacion"
        mode={editingItem ? 'edit' : 'create'}
        formData={formData}
        onFormChange={setFormData}
        errors={formErrors}
        onSave={handleSaveTipoHabitacion}
        onDelete={editingItem ? () => { db.nomTiposHabitacion.delete(editingItem.id); loadAll(); closeDialog(); } : undefined}
        similarItems={findSimilarItems(tiposHabitacion, formData.nombre || '', t => t.nombre, 0.5).map(s => s.item.nombre)}
      />

      {/* Salon Modal - Usando NomenclatorModal */}
      <NomenclatorModal
        open={dialogType === 'salon'}
        onOpenChange={() => closeDialog()}
        type="salon"
        mode={editingItem ? 'edit' : 'create'}
        formData={formData}
        onFormChange={setFormData}
        errors={formErrors}
        onSave={handleSaveSalon}
        onDelete={editingItem ? () => handleDeleteSalon(editingItem) : undefined}
        similarItems={findSimilarItems(salones, formData.codigo || '', s => s.codigo, 0.5).map(s => s.item.codigo)}
      />

      {/* Suggestion Dialog */}
      <Dialog open={suggestionDialog.isOpen} onOpenChange={(open) => !open && setSuggestionDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              ¿Quiso decir...?
            </DialogTitle>
            <DialogDescription>
              Encontramos {suggestionDialog.itemLabel.toLowerCase()}s similares a "{suggestionDialog.newName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {suggestionDialog.suggestions.map((item: any) => (
              <div 
                key={item.id} 
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => suggestionDialog.onSelectExisting(item)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.nombre || item.nombreEmpresa || item.nombreHotel || 'Sin nombre'}</p>
                    {item.descripcion && (
                      <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                    )}
                  </div>
                  <Badge variant="outline">Seleccionar</Badge>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => suggestionDialog.onCreateAnyway()}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear "{suggestionDialog.newName}"
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSuggestionDialog(prev => ({ ...prev, isOpen: false }))}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default SuperAdminPanel;
