import { useState, useEffect, useRef } from 'react';
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
import { User, Mail, MapPin, Building, Bell, Shield, Loader2, Save, Eye, EyeOff, Phone, Briefcase, Image, Palette, Shuffle, Check, RotateCcw, Trash2, Plus, X, Sparkles, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/database';
import { useWallpaperConfig, AURORA_PRESETS, DEFAULT_CONFIG } from '@/hooks/useWallpaperConfig';
import { cn } from '@/lib/utils';
import { DataManagement } from '@/components/settings/DataManagement';
import { ThemeSettings } from '@/components/settings/ThemeSettings';

const countries = [
  'Cuba', 'México', 'Argentina', 'España', 'Colombia', 'Chile', 'Perú', 'Venezuela', 'Brasil', 'Estados Unidos'
];

export default function Settings() {
  const { user, logout, isSuperAdmin } = useAuth();
  const { config: wallpaperConfig, updateConfig, wallpapers, resetConfig, customWallpapers, addCustomWallpaper, removeCustomWallpaper } = useWallpaperConfig();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          addCustomWallpaper(base64);
          toast.success('Wallpaper agregado correctamente');
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const SliderInput = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    unit = '',
    decimals = 0 
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void; 
    min: number; 
    max: number; 
    step?: number;
    unit?: string;
    decimals?: number;
  }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums">{value.toFixed(decimals)}{unit}</span>
        </div>
        <div className="relative">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-primary pointer-events-none transition-all duration-150"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>
      </div>
    );
  };
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

  const [registeredEvents, setRegisteredEvents] = useState<Array<{id: string, name: string, status: string, registeredAt: string}>>([]);

  useEffect(() => {
    if (user) {
      const regs = db.eventRegistrations.getByUser(user.id);
      const events = regs.map(r => {
        const evt = db.events.getById(r.eventId);
        return {
          id: r.eventId,
          name: evt?.name || 'Evento desconocido',
          status: r.status,
          registeredAt: r.createdAt,
        };
      });
      setRegisteredEvents(events);
    }
  }, [user]);

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

      window.dispatchEvent(new CustomEvent('sge-auth-refresh'));
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

        {/* Theme Section */}
        <ThemeSettings />

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

        {/* Registered Events Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="font-display">Mis Eventos</CardTitle>
            </div>
            <CardDescription>
              Eventos en los que te has inscrito
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registeredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No te has inscrito en ningún evento todavía.</p>
            ) : (
              <div className="space-y-3">
                {registeredEvents.map(evt => (
                  <div key={evt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{evt.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Inscrito el {new Date(evt.registeredAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        evt.status === 'registered' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        evt.status === 'confirmed' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        evt.status === 'cancelled' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        {evt.status === 'registered' ? 'Registrado' : evt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                      </span>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/event/${evt.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallpapers Section - Solo SuperAdmin */}
        {isSuperAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">Wallpapers</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetConfig}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar valores por defecto
              </Button>
            </div>
            <CardDescription>
              Personaliza el fondo difuminado de los diálogos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type selector */}
            <div className="space-y-3">
              <Label>Tipo de Fondo</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateConfig({ backgroundType: 'default' })}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    wallpaperConfig.backgroundType === 'default'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-slate-400/50 to-slate-600/50 backdrop-blur-sm border border-white/20" />
                    <div>
                      <p className="font-medium">Default</p>
                      <p className="text-xs text-muted-foreground">Difuminado vítreo</p>
                    </div>
                  </div>
                </button>
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
                      <p className="text-xs text-muted-foreground">Imágenes</p>
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
                      <p className="text-xs text-muted-foreground">Efecto boreal</p>
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
                  { value: 'random' as const, label: 'Aleatorio', icon: Shuffle },
                  { value: 'sequential' as const, label: 'Secuencial', icon: Palette },
                  { value: 'fixed' as const, label: 'Fijo', icon: Check },
                ]).map(({ value, label, icon: Icon }) => (
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Seleccionar Wallpaper</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar wallpaper
                  </Button>
                </div>
                
                {/* Custom wallpapers section */}
                {customWallpapers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Wallpapers personalizados</p>
                    <div className="flex flex-wrap gap-2">
                      {customWallpapers.map((wp, idx) => (
                        <div key={`custom-${idx}`} className="relative group">
                          <button
                            onClick={() => updateConfig({ fixedWallpaper: wp })}
                            className={cn(
                              'relative w-16 h-10 rounded-lg overflow-hidden border-2 transition-all',
                              wallpaperConfig.fixedWallpaper === wp
                                ? 'border-primary ring-2 ring-primary/50'
                                : 'border-border hover:border-muted-foreground/30'
                            )}
                          >
                            <img src={wp} alt="" className="w-full h-full object-cover" />
                            {wallpaperConfig.fixedWallpaper === wp && (
                              <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => removeCustomWallpaper(wp)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}

                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {wallpapers.filter(w => !customWallpapers.includes(w)).map((wp, idx) => (
                    <button
                      key={`default-${idx}`}
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

            {/* Effect sliders */}
            <div className="space-y-4 pt-4 border-t">
              <Label>Parámetros de Efecto</Label>
              
              <SliderInput
                label="Opacidad del fondo"
                value={wallpaperConfig.opacity}
                onChange={(v) => updateConfig({ opacity: v })}
                min={20}
                max={100}
                unit="%"
              />

              <SliderInput
                label="Difuminado (blur)"
                value={wallpaperConfig.blur}
                onChange={(v) => updateConfig({ blur: v })}
                min={0}
                max={20}
                unit="px"
              />

              <SliderInput
                label="Brillo"
                value={wallpaperConfig.brightness}
                onChange={(v) => updateConfig({ brightness: v })}
                min={50}
                max={150}
                unit="%"
              />

              <SliderInput
                label="Saturación"
                value={wallpaperConfig.saturation}
                onChange={(v) => updateConfig({ saturation: v })}
                min={0}
                max={200}
                unit="%"
              />

              {wallpaperConfig.backgroundType === 'aurora' && (
                <>
                  <SliderInput
                    label="Intensidad Aurora"
                    value={wallpaperConfig.auroraIntensity}
                    onChange={(v) => updateConfig({ auroraIntensity: v })}
                    min={20}
                    max={100}
                    unit="%"
                  />

                  <SliderInput
                    label="Velocidad Aurora"
                    value={wallpaperConfig.auroraSpeed}
                    onChange={(v) => updateConfig({ auroraSpeed: v })}
                    min={5}
                    max={30}
                    unit="s"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Data Management Section - Solo SuperAdmin */}
        {isSuperAdmin && (
          <DataManagement />
        )}

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
