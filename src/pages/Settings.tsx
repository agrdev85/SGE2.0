import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ImageUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Mail, MapPin, Building, Bell, Shield, Loader2, Save, Eye, EyeOff, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/database';

const countries = [
  'Cuba', 'México', 'Argentina', 'España', 'Colombia', 'Chile', 'Perú', 'Venezuela', 'Brasil', 'Estados Unidos'
];

export default function Settings() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    affiliation: '',
    avatar: '',
    phone: '',
    specialization: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    abstracts: true,
    reviews: true,
    events: false,
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      const dbUser = db.users.getById(user.id);
      if (dbUser) {
        setFormData({
          name: dbUser.name || '',
          email: dbUser.email || '',
          country: dbUser.country || '',
          affiliation: dbUser.affiliation || '',
          avatar: dbUser.avatar || '',
          phone: dbUser.phone || '',
          specialization: dbUser.specialization || '',
        });
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      db.users.update(user.id, {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        affiliation: formData.affiliation,
        avatar: formData.avatar,
        phone: formData.phone,
        specialization: formData.specialization,
      });

      // Reload page to update context
      window.location.reload();
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const dbUser = db.users.getById(user.id);
    if (dbUser?.passwordHash !== passwordData.currentPassword) {
      toast.error('La contraseña actual es incorrecta');
      return;
    }

    try {
      db.users.updatePassword(user.id, passwordData.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    }
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu perfil y preferencias
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="font-display">Perfil</CardTitle>
            </div>
            <CardDescription>
              Información personal y datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar with ImageUploader */}
            <div className="flex flex-col items-center gap-4">
              <ImageUploader
                value={formData.avatar}
                onChange={handleAvatarChange}
                aspectRatio="square"
                className="w-32 h-32"
                placeholder="Subir foto"
              />
              <p className="text-xs text-muted-foreground text-center">
                Haz clic o arrastra una imagen para cambiar tu foto de perfil
              </p>
            </div>

            <Separator />

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>País</Label>
                <Select
                  value={formData.country}
                  onValueChange={(v) => setFormData({ ...formData, country: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Afiliación / Institución</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="affiliation"
                    value={formData.affiliation}
                    onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Especialización</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="pl-10"
                    placeholder="Ej: Biotecnología, IA, etc."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="font-display">Notificaciones</CardTitle>
            </div>
            <CardDescription>
              Configura cómo quieres recibir las notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificaciones por Email</p>
                <p className="text-sm text-muted-foreground">Recibe actualizaciones por correo</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Estado de Resúmenes</p>
                <p className="text-sm text-muted-foreground">Cambios en el estado de tus trabajos</p>
              </div>
              <Switch
                checked={notifications.abstracts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, abstracts: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Revisiones Asignadas</p>
                <p className="text-sm text-muted-foreground">Nuevos trabajos para revisar</p>
              </div>
              <Switch
                checked={notifications.reviews}
                onCheckedChange={(checked) => setNotifications({ ...notifications, reviews: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nuevos Eventos</p>
                <p className="text-sm text-muted-foreground">Anuncios de nuevos eventos</p>
              </div>
              <Switch
                checked={notifications.events}
                onCheckedChange={(checked) => setNotifications({ ...notifications, events: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="font-display">Seguridad</CardTitle>
            </div>
            <CardDescription>
              Gestiona tu contraseña y seguridad de la cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cambiar Contraseña</p>
                <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
              </div>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                Cambiar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cerrar Sesión</p>
                <p className="text-sm text-muted-foreground">Salir de tu cuenta en este dispositivo</p>
              </div>
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="hero" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Cambiar Contraseña</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirmar Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="hero" onClick={handleChangePassword}>
                Cambiar Contraseña
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
