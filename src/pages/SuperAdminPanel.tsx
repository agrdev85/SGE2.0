import React, { useState, useEffect } from 'react';
import { db, CMSSettings, User, Event } from '@/lib/database';
import { seedCMSData } from '@/lib/seedCMS';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save,
  Settings,
  Palette,
  Globe,
  Mail,
  Shield,
  Users,
  Calendar,
  FileText,
  BarChart,
  Database,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminPanel: React.FC = () => {
  const [settings, setSettings] = useState<CMSSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalPages: 0,
    totalArticles: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currentSettings = db.cmsSettings.get();
    if (!currentSettings) {
      db.cmsSettings.update({
        siteName: 'Sistema de Gestión de Eventos',
        siteDescription: 'Plataforma integral para gestión de eventos científicos',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
        fontFamily: 'Inter',
        headerStyle: 'default',
        footerStyle: 'default',
        socialLinks: {},
        contactInfo: {},
        seoSettings: {},
        maintenanceMode: false,
        allowRegistration: true,
        moderateComments: false,
      });
    }
    setSettings(db.cmsSettings.get() || null);
    setUsers(db.users.getAll());
    setEvents(db.events.getAll());

    // Calculate stats
    const allUsers = db.users.getAll();
    const allEvents = db.events.getAll();
    const allPages = db.cmsPages.getAll();
    const allArticles = db.cmsArticles.getAll();

    setStats({
      totalUsers: allUsers.length,
      totalEvents: allEvents.length,
      totalPages: allPages.length,
      totalArticles: allArticles.length,
      activeUsers: allUsers.filter(u => u.isActive).length,
    });
  };

  const handleSaveSettings = () => {
    if (!settings) return;
    db.cmsSettings.update(settings);
    toast.success('Configuración guardada exitosamente');
  };

  const handleUpdateSetting = (key: keyof CMSSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleExportData = () => {
    const data = {
      users: db.users.getAll(),
      events: db.events.getAll(),
      pages: db.cmsPages.getAll(),
      articles: db.cmsArticles.getAll(),
      menus: db.cmsMenus.getAll(),
      settings: db.cmsSettings.get(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados correctamente');
  };

  const changeUserRole = (userId: string, newRole: User['role']) => {
    db.users.update(userId, { role: newRole });
    loadData();
    toast.success('Rol de usuario actualizado');
  };

  const toggleUserActive = (userId: string, isActive: boolean) => {
    db.users.update(userId, { isActive });
    loadData();
    toast.success(`Usuario ${isActive ? 'activado' : 'desactivado'}`);
  };

  if (!settings) {
    return <div className="p-8">Cargando configuración...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Panel de SuperAdmin
          </h1>
          <p className="text-gray-600 mt-1">Gestión completa del sistema y configuraciones globales</p>
        </div>
        <Button onClick={handleExportData} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Datos
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Usuarios Totales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Eventos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold">{stats.totalPages}</div>
              <div className="text-sm text-gray-600">Páginas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <div className="text-sm text-gray-600">Artículos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto text-teal-600 mb-2" />
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Usuarios Activos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="w-4 h-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Database className="w-4 h-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General del Sitio</CardTitle>
              <CardDescription>
                Configuración básica y preferencias del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteName">Nombre del Sitio</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleUpdateSetting('siteName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleUpdateSetting('siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información de Contacto</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email de Contacto</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactInfo?.email || ''}
                      onChange={(e) => handleUpdateSetting('contactInfo', {
                        ...settings.contactInfo,
                        email: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Teléfono</Label>
                    <Input
                      id="contactPhone"
                      value={settings.contactInfo?.phone || ''}
                      onChange={(e) => handleUpdateSetting('contactInfo', {
                        ...settings.contactInfo,
                        phone: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactAddress">Dirección</Label>
                  <Textarea
                    id="contactAddress"
                    value={settings.contactInfo?.address || ''}
                    onChange={(e) => handleUpdateSetting('contactInfo', {
                      ...settings.contactInfo,
                      address: e.target.value
                    })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuraciones del Sistema</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Mantenimiento</Label>
                    <p className="text-sm text-gray-600">
                      Desactivar el sitio temporalmente para mantenimiento
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleUpdateSetting('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Registro</Label>
                    <p className="text-sm text-gray-600">
                      Permitir que nuevos usuarios se registren en el sistema
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => handleUpdateSetting('allowRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Moderar Comentarios</Label>
                    <p className="text-sm text-gray-600">
                      Los comentarios requieren aprobación antes de publicarse
                    </p>
                  </div>
                  <Switch
                    checked={settings.moderateComments}
                    onCheckedChange={(checked) => handleUpdateSetting('moderateComments', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia y Diseño</CardTitle>
              <CardDescription>
                Personaliza los colores, fuentes y estilos visuales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Colores del Tema</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleUpdateSetting('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleUpdateSetting('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleUpdateSetting('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleUpdateSetting('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accentColor">Color de Acento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => handleUpdateSetting('accentColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => handleUpdateSetting('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="fontFamily">Familia de Fuente</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(value) => handleUpdateSetting('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headerStyle">Estilo de Cabecera</Label>
                  <Select
                    value={settings.headerStyle}
                    onValueChange={(value: any) => handleUpdateSetting('headerStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por Defecto</SelectItem>
                      <SelectItem value="centered">Centrado</SelectItem>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                      <SelectItem value="mega">Mega Menú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="footerStyle">Estilo de Pie de Página</Label>
                  <Select
                    value={settings.footerStyle}
                    onValueChange={(value: any) => handleUpdateSetting('footerStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por Defecto</SelectItem>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                      <SelectItem value="extended">Extendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redes Sociales</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={settings.socialLinks?.facebook || ''}
                      onChange={(e) => handleUpdateSetting('socialLinks', {
                        ...settings.socialLinks,
                        facebook: e.target.value
                      })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={settings.socialLinks?.twitter || ''}
                      onChange={(e) => handleUpdateSetting('socialLinks', {
                        ...settings.socialLinks,
                        twitter: e.target.value
                      })}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={settings.socialLinks?.linkedin || ''}
                      onChange={(e) => handleUpdateSetting('socialLinks', {
                        ...settings.socialLinks,
                        linkedin: e.target.value
                      })}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={settings.socialLinks?.instagram || ''}
                      onChange={(e) => handleUpdateSetting('socialLinks', {
                        ...settings.socialLinks,
                        instagram: e.target.value
                      })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Apariencia
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Configuración SEO</CardTitle>
              <CardDescription>
                Optimiza tu sitio para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="defaultMetaTitle">Meta Título por Defecto</Label>
                <Input
                  id="defaultMetaTitle"
                  value={settings.seoSettings?.defaultMetaTitle || ''}
                  onChange={(e) => handleUpdateSetting('seoSettings', {
                    ...settings.seoSettings,
                    defaultMetaTitle: e.target.value
                  })}
                  placeholder="Título para motores de búsqueda"
                />
              </div>

              <div>
                <Label htmlFor="defaultMetaDescription">Meta Descripción por Defecto</Label>
                <Textarea
                  id="defaultMetaDescription"
                  value={settings.seoSettings?.defaultMetaDescription || ''}
                  onChange={(e) => handleUpdateSetting('seoSettings', {
                    ...settings.seoSettings,
                    defaultMetaDescription: e.target.value
                  })}
                  placeholder="Descripción para motores de búsqueda"
                  rows={4}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input
                  id="googleAnalytics"
                  value={settings.seoSettings?.googleAnalytics || ''}
                  onChange={(e) => handleUpdateSetting('seoSettings', {
                    ...settings.seoSettings,
                    googleAnalytics: e.target.value
                  })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="googleSiteVerification">Google Site Verification</Label>
                <Input
                  id="googleSiteVerification"
                  value={settings.seoSettings?.googleSiteVerification || ''}
                  onChange={(e) => handleUpdateSetting('seoSettings', {
                    ...settings.seoSettings,
                    googleSiteVerification: e.target.value
                  })}
                  placeholder="Código de verificación"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios y sus roles en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {user.avatar && (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={user.role}
                        onValueChange={(value: User['role']) => changeUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Usuario</SelectItem>
                          <SelectItem value="REVIEWER">Revisor</SelectItem>
                          <SelectItem value="COMMITTEE">Comité</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(checked) => toggleUserActive(user.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Overview */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Vista General de Eventos</CardTitle>
              <CardDescription>
                Todos los eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          {event.startDate} - {event.endDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          event.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {event.isActive ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Opciones avanzadas y herramientas de administración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Zona de Peligro</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Las acciones en esta sección pueden afectar permanentemente los datos del sistema.
                </p>
                
                <div className="space-y-3">
                  <Button variant="outline" onClick={handleExportData} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Todos los Datos
                  </Button>
                  
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => {
                      if (confirm('¿Deseas inicializar el CMS con datos de ejemplo? Esto NO borrará los datos existentes.')) {
                        try {
                          seedCMSData();
                          alert('✅ Datos del CMS inicializados correctamente');
                          window.location.reload();
                        } catch (error) {
                          alert('Error al inicializar datos del CMS');
                        }
                      }
                    }}
                  >
                    Inicializar Datos de Ejemplo CMS
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm('¿Estás seguro? Esto borrará TODOS los datos del sistema.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                  >
                    Restablecer Sistema
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Información del Sistema</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versión:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última Actualización:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base de Datos:</span>
                    <span className="font-medium">LocalStorage</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminPanel;
