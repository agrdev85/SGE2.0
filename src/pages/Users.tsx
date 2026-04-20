import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db, User, UserRole, Event } from '@/lib/database';
import { normalizeText, isDuplicate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users as UsersIcon, UserCheck, ClipboardCheck, Shield, Plus, Pencil, Trash2, FileDown, Award, IdCard, Building2, Hotel, Eye, Handshake, BookOpen } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from 'sonner';
import { 
  CertificateConfig,
  defaultCertificateConfig,
  generateAndSaveCertificateFromElements,
  generateAllCertificatesFromElements,
} from '@/lib/certificateGenerator';
import { CanvasElement, defaultCertificateElements, defaultCredentialElements, CredentialDesignConfig } from '@/components/designCanvas/types';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

// Complete role config for all 10 roles
const roleConfig: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  USER: { label: 'Participante', color: 'bg-primary/10 text-primary', icon: UsersIcon },
  REVIEWER: { label: 'Revisor', color: 'bg-info/10 text-info', icon: ClipboardCheck },
  COMMITTEE: { label: 'Comité', color: 'bg-accent/10 text-accent', icon: UserCheck },
  SUPERADMIN: { label: 'SuperAdmin', color: 'bg-destructive/10 text-destructive', icon: Shield },
  ADMIN_RECEPTIVO: { label: 'Admin Receptivo', color: 'bg-orange-100 text-orange-700', icon: Handshake },
  ADMIN_EMPRESA: { label: 'Admin Empresa', color: 'bg-cyan-100 text-cyan-700', icon: Building2 },
  COORDINADOR_HOTEL: { label: 'Coord. Hotel', color: 'bg-violet-100 text-violet-700', icon: Hotel },
  LECTOR_RECEPTIVO: { label: 'Lector Receptivo', color: 'bg-lime-100 text-lime-700', icon: Eye },
  LECTOR_EMPRESA: { label: 'Lector Empresa', color: 'bg-teal-100 text-teal-700', icon: BookOpen },
};

const countries = ['Cuba', 'México', 'Argentina', 'España', 'Colombia', 'Chile', 'Perú', 'Venezuela', 'Brasil', 'Estados Unidos'];

// Roles that current user can assign based on their own role
function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  switch (currentUserRole) {
    case 'SUPERADMIN':
      return ['USER', 'REVIEWER', 'COMMITTEE', 'SUPERADMIN', 'ADMIN_RECEPTIVO', 'ADMIN_EMPRESA', 'COORDINADOR_HOTEL', 'LECTOR_RECEPTIVO', 'LECTOR_EMPRESA'];
    case 'ADMIN_RECEPTIVO':
      return ['ADMIN_RECEPTIVO', 'ADMIN_EMPRESA', 'COORDINADOR_HOTEL', 'LECTOR_RECEPTIVO', 'LECTOR_EMPRESA'];
    default:
      return ['USER'];
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 30, g: 64, b: 175 };
}

async function generateQRDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, { width: 100, margin: 1 });
  } catch {
    return '';
  }
}

export default function Users() {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: '', userName: '' });
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'USER' as UserRole, country: '', affiliation: '', avatar: '', isActive: true,
    idDocument: '', phone: '', affiliationType: '', economicSector: '', participationType: '', scientificLevel: '', educationalLevel: '', gender: 'M', password: '', confirmPassword: '',
    receptivoId: '', empresaId: '', hotelId: '',
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = () => {
    if (!currentUser) return;
    let allUsers = db.users.getAll();

    // Apply data isolation per permission matrix
    switch (currentUser.role) {
      case 'SUPERADMIN':
        break; // See all
      case 'ADMIN_RECEPTIVO':
        // Only see users of their receptivo (R02, R03, R04, R05, R06 roles)
        allUsers = allUsers.filter(u =>
          u.receptivoId === currentUser.receptivoId ||
          u.id === currentUser.id
        );
        break;
      default:
        allUsers = []; // Others can't manage users
    }
    setUsers(allUsers);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.country || '').toLowerCase().includes(q) || (u.affiliation || '').toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    return matchesSearch && matchesTab;
  });

  // Compute counts for visible roles
  const roleTabs = Object.entries(roleConfig).filter(([role]) => {
    return users.some(u => u.role === role);
  });

  const counts: Record<string, number> = { all: users.length };
  Object.keys(roleConfig).forEach(role => {
    counts[role] = users.filter(u => u.role === role).length;
  });

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'USER', country: '', affiliation: '', avatar: '', isActive: true,
      idDocument: '', phone: '', affiliationType: '', economicSector: '', participationType: '', scientificLevel: '', educationalLevel: '', gender: 'M', password: '', confirmPassword: '',
      receptivoId: currentUser?.receptivoId || '', empresaId: currentUser?.empresaId || '', hotelId: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, country: user.country, affiliation: user.affiliation, avatar: user.avatar || '', isActive: user.isActive,
      idDocument: (user as any).idDocument || '', phone: user.phone || '', affiliationType: (user as any).affiliationType || '', economicSector: (user as any).economicSector || '', participationType: (user as any).participationType || '', scientificLevel: (user as any).scientificLevel || '', educationalLevel: (user as any).educationalLevel || '', gender: (user as any).gender || 'M', password: '', confirmPassword: '',
      receptivoId: user.receptivoId || '', empresaId: user.empresaId || '', hotelId: user.hotelId || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) { toast.error('Nombre y email son requeridos'); return; }
    if (!editingUser) {
      if (!formData.password) { toast.error('Contraseña requerida para nuevo usuario'); return; }
      if (formData.password !== formData.confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    }

    const emailNormalizado = normalizeText(formData.email);
    const emailDuplicado = users.find(u => normalizeText(u.email) === emailNormalizado && (!editingUser || u.id !== editingUser.id));
    if (emailDuplicado) {
      toast.error(`Ya existe un usuario con el email "${emailDuplicado.email}"`);
      return;
    }

    try {
      const saveData: any = { ...formData };
      delete saveData.password;
      delete saveData.confirmPassword;
      if (saveData.receptivoId === '') delete saveData.receptivoId;
      if (saveData.empresaId === '') delete saveData.empresaId;
      if (saveData.hotelId === '') delete saveData.hotelId;

      if (editingUser) {
        db.users.update(editingUser.id, saveData);
        toast.success('Usuario actualizado');
      } else {
        db.users.create({ ...saveData, passwordHash: formData.password });
        toast.success('Usuario creado');
      }
      setIsDialogOpen(false);
      loadUsers();
    } catch { toast.error('Error al guardar'); }
  };

  const handleDelete = (user: User) => {
    setDeleteConfirm({
      open: true,
      userId: user.id,
      userName: user.name,
    });
  };

  const confirmDeleteUser = () => {
    db.users.delete(deleteConfirm.userId);
    toast.success('Usuario eliminado');
    loadUsers();
    setDeleteConfirm(prev => ({ ...prev, open: false }));
  };

  const assignableRoles = currentUser ? getAssignableRoles(currentUser.role) : [];
  const receptivos = db.nomReceptivos.getAll();
  const empresas = db.nomEmpresas.getAll();
  const hoteles = db.nomHoteles.getAll();

  // Certificate/credential generation helpers (kept from original)
  const getEventConfigAndElements = (): { event: Event; config: CertificateConfig; elements: CanvasElement[] } | null => {
    const events = db.events.getActive();
    if (events.length === 0) { toast.error('No hay eventos activos'); return null; }
    const event = events[0];
    const savedConfig = localStorage.getItem(`certificate_config_v2_${event.id}`);
    const savedElements = localStorage.getItem(`certificate_elements_v2_${event.id}`);
    const config = savedConfig ? JSON.parse(savedConfig) : { ...defaultCertificateConfig, primaryColor: event.primaryColor, secondaryColor: event.secondaryColor };
    const elements = savedElements ? JSON.parse(savedElements) : defaultCertificateElements;
    return { event, config, elements };
  };

  const handleGenerateCertificate = async (user: User) => {
    const result = getEventConfigAndElements();
    if (!result) return;
    try {
      await generateAndSaveCertificateFromElements(
        { participantName: user.name, eventName: result.event.name, eventDate: `${formatDate(result.event.startDate)} al ${formatDate(result.event.endDate)}`, certificateType: 'participation', primaryColor: result.config.primaryColor, secondaryColor: result.config.secondaryColor },
        result.elements, result.config
      );
      toast.success('Certificado generado');
    } catch { toast.error('Error al generar el certificado'); }
  };

  const handleExportAllCertificates = async () => {
    const result = getEventConfigAndElements();
    if (!result) return;
    const activeUsers = users.filter(u => u.isActive);
    if (activeUsers.length === 0) { toast.error('No hay usuarios activos'); return; }
    try {
      await generateAllCertificatesFromElements(activeUsers, result.event, 'participation', result.elements, result.config, undefined);
      toast.success(`${activeUsers.length} certificados exportados`);
    } catch { toast.error('Error al exportar los certificados'); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">Administra los usuarios de la plataforma</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportAllCertificates}>
              <FileDown className="h-4 w-4 mr-1" />
              Exportar Certificados
            </Button>
            <Button variant="hero" onClick={openCreateDialog}><Plus className="h-4 w-4" />Nuevo Usuario</Button>
          </div>
        </div>

        {/* Stats cards - show only roles that have users */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {roleTabs.slice(0, 5).map(([role, config]) => (
            <Card key={role} className="bg-gradient-to-br from-muted/50 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}><config.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-2xl font-bold font-display">{counts[role] || 0}</p>
                    <p className="text-xs text-muted-foreground">{config.label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, email, país..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
                {roleTabs.map(([role, config]) => (
                  <TabsTrigger key={role} value={role}>{config.label} ({counts[role] || 0})</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">País</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asociación</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const config = roleConfig[user.role] || roleConfig.USER;
                    const receptivo = user.receptivoId ? db.nomReceptivos.getById(user.receptivoId) : null;
                    const empresa = user.empresaId ? db.nomEmpresas.getById(user.empresaId) : null;
                    return (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4"><Badge variant="secondary" className={config.color}>{config.label}</Badge></td>
                        <td className="py-4 px-4 text-muted-foreground">{user.country}</td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          {receptivo && <div>{receptivo.nombre}</div>}
                          {empresa && <div className="text-xs">{empresa.nombre}</div>}
                        </td>
                        <td className="py-4 px-4"><Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleGenerateCertificate(user)} title="Certificado"><Award className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron usuarios</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
            <div className="space-y-4 my-4">
              <div className="flex justify-center">
                <ImageUploader value={formData.avatar} onChange={(url) => setFormData({ ...formData, avatar: url })} aspectRatio="square" className="w-32" placeholder="Foto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Carné / Pasaporte</Label><Input value={formData.idDocument} onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Teléfono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>País</Label><Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Afiliación</Label><Input value={formData.affiliation} onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol *</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map(role => (
                        <SelectItem key={role} value={role}>{roleConfig[role].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2"><input type="radio" name="gender" checked={formData.gender === 'M'} onChange={() => setFormData({ ...formData, gender: 'M' })} /> M</label>
                    <label className="flex items-center gap-2"><input type="radio" name="gender" checked={formData.gender === 'F'} onChange={() => setFormData({ ...formData, gender: 'F' })} /> F</label>
                  </div>
                </div>
              </div>

              {/* Association fields - shown based on role */}
              {['ADMIN_RECEPTIVO', 'LECTOR_RECEPTIVO', 'ADMIN_EMPRESA', 'LECTOR_EMPRESA', 'COORDINADOR_HOTEL'].includes(formData.role) && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="col-span-2 text-sm font-semibold text-muted-foreground">Asociación Organizacional</h4>
                  {['ADMIN_RECEPTIVO', 'LECTOR_RECEPTIVO', 'ADMIN_EMPRESA', 'LECTOR_EMPRESA'].includes(formData.role) && (
                    <div className="space-y-2">
                      <Label>Receptivo</Label>
                      <Select value={formData.receptivoId} onValueChange={(v) => setFormData({ ...formData, receptivoId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {receptivos.filter(r => r.activo).map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.nombre} ({r.siglas})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {['ADMIN_EMPRESA', 'LECTOR_EMPRESA'].includes(formData.role) && (
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Select value={formData.empresaId} onValueChange={(v) => setFormData({ ...formData, empresaId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {empresas.filter(e => e.activo && (!formData.receptivoId || e.receptivoId === formData.receptivoId)).map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formData.role === 'COORDINADOR_HOTEL' && (
                    <div className="space-y-2">
                      <Label>Hotel</Label>
                      <Select value={formData.hotelId} onValueChange={(v) => setFormData({ ...formData, hotelId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {hoteles.filter(h => h.activo).map(h => (
                            <SelectItem key={h.id} value={h.id}>{h.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de Afiliación</Label><Input value={formData.affiliationType} onChange={(e) => setFormData({ ...formData, affiliationType: e.target.value })} /></div>
                <div className="space-y-2"><Label>Sector Económico</Label><Input value={formData.economicSector} onChange={(e) => setFormData({ ...formData, economicSector: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de Participación</Label><Input value={formData.participationType} onChange={(e) => setFormData({ ...formData, participationType: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nivel Científico</Label><Input value={formData.scientificLevel} onChange={(e) => setFormData({ ...formData, scientificLevel: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nivel Educacional</Label><Input value={formData.educationalLevel} onChange={(e) => setFormData({ ...formData, educationalLevel: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Contraseña {editingUser ? '' : '*'}</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                <div className="space-y-2"><Label>Confirmar {editingUser ? '' : '*'}</Label><Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button variant="hero" onClick={handleSave}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Eliminar Usuario"
        description="¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer."
        itemName={deleteConfirm.userName}
        itemType="Usuario"
        variant="danger"
        onConfirm={confirmDeleteUser}
      />
    </DashboardLayout>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}