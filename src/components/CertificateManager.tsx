import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db, Event, User } from '@/lib/database';
import {
  CertificateConfig,
  defaultCertificateConfig,
  generateAndSaveCertificateFromElements,
  generateAllCertificatesFromElements,
} from '@/lib/certificateGenerator';
import { Award, Download, Users, FileDown, Save, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { DesignCanvas } from './designCanvas/DesignCanvas';
import { ElementsPanel } from './designCanvas/ElementsPanel';
import { CanvasElement, defaultCertificateElements } from './designCanvas/types';
import { cn } from '@/lib/utils';

interface CertificateManagerProps {
  event: Event;
}

export function CertificateManager({ event }: CertificateManagerProps) {
  const [certificateType, setCertificateType] = useState<'participation' | 'presentation' | 'reviewer'>('participation');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Storage keys
  const savedConfigKey = `certificate_config_v2_${event.id}`;
  const savedElementsKey = `certificate_elements_v2_${event.id}`;

  // Load saved config
  const [config, setConfig] = useState<CertificateConfig>(() => {
    const saved = localStorage.getItem(savedConfigKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { ...defaultCertificateConfig, primaryColor: event.primaryColor, secondaryColor: event.secondaryColor };
      }
    }
    return { ...defaultCertificateConfig, primaryColor: event.primaryColor, secondaryColor: event.secondaryColor };
  });

  // Load saved elements
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    const saved = localStorage.getItem(savedElementsKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultCertificateElements;
      }
    }
    return defaultCertificateElements;
  });

  // Auto-save on changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(savedConfigKey, JSON.stringify(config));
      localStorage.setItem(savedElementsKey, JSON.stringify(elements));
    }, 500);
    return () => clearTimeout(saveTimeout);
  }, [config, elements, savedConfigKey, savedElementsKey]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
    setIsSaved(false);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem(savedConfigKey, JSON.stringify(config));
    localStorage.setItem(savedElementsKey, JSON.stringify(elements));
    setIsSaved(true);
    toast.success('Configuración de certificados guardada');
  };

  // Preview data for template variables
  const previewData: Record<string, string> = {
    nombre: 'Dr. Juan Pérez García',
    evento: event.name,
    fecha: `${formatDate(event.startDate)} al ${formatDate(event.endDate)}`,
    firmante: config.signerName || 'Director del Evento',
    cargo: config.signerTitle || 'Comité Organizador',
  };

  // Get eligible users based on certificate type
  const getEligibleUsers = (): User[] => {
    const allUsers = db.users.getAll();
    const eventAbstracts = db.abstracts.getByEvent(event.id);

    switch (certificateType) {
      case 'participation':
        const participantIds = [...new Set(eventAbstracts.map(a => a.userId))];
        return allUsers.filter(u => participantIds.includes(u.id));
      case 'presentation':
        const presenterIds = [...new Set(
          eventAbstracts.filter(a => a.status === 'APROBADO').map(a => a.userId)
        )];
        return allUsers.filter(u => presenterIds.includes(u.id));
      case 'reviewer':
        return allUsers.filter(u => u.role === 'REVIEWER');
      default:
        return [];
    }
  };

  const eligibleUsers = getEligibleUsers();
  const eventAbstracts = db.abstracts.getByEvent(event.id);

  const handleSelectAll = () => {
    if (selectedUsers.length === eligibleUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligibleUsers.map(u => u.id));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleGenerateSingle = async (user: User) => {
    handleSaveConfig();

    const abstracts = certificateType === 'presentation'
      ? eventAbstracts.filter(a => a.userId === user.id && a.status === 'APROBADO')
      : undefined;

    try {
      await generateAndSaveCertificateFromElements(
        {
          participantName: user.name,
          eventName: event.name,
          eventDate: `${formatDate(event.startDate)} al ${formatDate(event.endDate)}`,
          certificateType,
          abstractTitle: abstracts?.[0]?.title,
          categoryType: abstracts?.[0]?.categoryType,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
        },
        elements,
        config
      );
      toast.success(`Certificado generado para ${user.name}`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Error al generar el certificado');
    }
  };

  const handleExportAll = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }

    handleSaveConfig();
    setIsExporting(true);
    
    try {
      const usersToExport = eligibleUsers.filter(u => selectedUsers.includes(u.id));
      const abstracts = certificateType === 'presentation' ? eventAbstracts : undefined;
      await generateAllCertificatesFromElements(
        usersToExport,
        event,
        certificateType,
        elements,
        config,
        abstracts
      );
      toast.success(`${usersToExport.length} certificados exportados en un solo PDF`);
    } catch (error) {
      console.error('Error exporting certificates:', error);
      toast.error('Error al exportar los certificados');
    } finally {
      setIsExporting(false);
    }
  };

  const typeLabels = {
    'participation': 'DE PARTICIPACIÓN',
    'presentation': 'DE PRESENTACIÓN',
    'reviewer': 'DE REVISOR CIENTÍFICO',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Generador de Certificados</h2>
          <p className="text-muted-foreground">Diseña certificados con vista previa en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                "p-2 rounded-md transition-colors",
                previewDevice === 'desktop' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                "p-2 rounded-md transition-colors",
                previewDevice === 'mobile' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleSaveConfig} variant={isSaved ? 'outline' : 'hero'}>
            <Save className="h-4 w-4 mr-2" />
            {isSaved ? 'Guardado' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Main Layout - Config + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Certificate Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de Certificado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'participation', label: 'Participación', icon: Users },
                  { value: 'presentation', label: 'Presentación', icon: Award },
                  { value: 'reviewer', label: 'Revisor', icon: FileDown },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setCertificateType(type.value as any);
                      // Update subtitle element
                      handleElementUpdate('subtitle', { content: typeLabels[type.value as keyof typeof typeLabels] });
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center",
                      certificateType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <type.icon className={cn(
                      "h-5 w-5 mx-auto mb-1",
                      certificateType === type.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Design Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Colores y Formato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Color Primario</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => { setConfig({ ...config, primaryColor: e.target.value }); setIsSaved(false); }}
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => { setConfig({ ...config, primaryColor: e.target.value }); setIsSaved(false); }}
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color Secundario</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => { setConfig({ ...config, secondaryColor: e.target.value }); setIsSaved(false); }}
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => { setConfig({ ...config, secondaryColor: e.target.value }); setIsSaved(false); }}
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Orientación</Label>
                  <Select
                    value={config.orientation}
                    onValueChange={(value: 'landscape' | 'portrait') => { setConfig({ ...config, orientation: value }); setIsSaved(false); }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Horizontal</SelectItem>
                      <SelectItem value="portrait">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Formato</Label>
                  <Select
                    value={config.format}
                    onValueChange={(value: 'a4' | 'letter' | 'legal') => { setConfig({ ...config, format: value }); setIsSaved(false); }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Carta</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Mostrar Borde</Label>
                <Switch
                  checked={config.showBorder}
                  onCheckedChange={(checked) => { setConfig({ ...config, showBorder: checked }); setIsSaved(false); }}
                />
              </div>

              {/* Signer info */}
              <div className="pt-2 border-t space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del Firmante</Label>
                  <Input
                    value={config.signerName || ''}
                    onChange={(e) => { setConfig({ ...config, signerName: e.target.value }); setIsSaved(false); }}
                    placeholder="Ej: Dr. Juan García"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cargo del Firmante</Label>
                  <Input
                    value={config.signerTitle || ''}
                    onChange={(e) => { setConfig({ ...config, signerTitle: e.target.value }); setIsSaved(false); }}
                    placeholder="Ej: Director del Evento"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elements Panel */}
          <ElementsPanel
            elements={elements}
            selectedId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleElementUpdate}
          />
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-7">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Vista Previa en Tiempo Real
                <Badge variant="secondary" className="text-xs">
                  {previewDevice === 'desktop' ? 'Escritorio' : 'Móvil'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Haz clic y arrastra elementos para reposicionarlos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center min-h-[500px]">
                <DesignCanvas
                  config={{
                    orientation: config.orientation,
                    width: config.orientation === 'landscape' ? 297 : 210,
                    height: config.orientation === 'landscape' ? 210 : 297,
                    primaryColor: config.primaryColor,
                    secondaryColor: config.secondaryColor,
                    backgroundColor: '#ffffff',
                    textColor: config.textColor,
                    elements: elements,
                  }}
                  elements={elements}
                  onElementUpdate={handleElementUpdate}
                  previewData={previewData}
                  device={previewDevice}
                  interactive={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generate Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generar Certificados</CardTitle>
              <CardDescription>
                {eligibleUsers.length} usuarios elegibles para certificado de{' '}
                {certificateType === 'participation' ? 'participación' : 
                 certificateType === 'presentation' ? 'presentación' : 'revisor'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedUsers.length === eligibleUsers.length ? 'Deseleccionar' : 'Seleccionar'} todos
              </Button>
              <Badge variant="secondary">{selectedUsers.length} seleccionados</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eligibleUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay usuarios elegibles para este tipo de certificado</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {eligibleUsers.map((user) => {
                  const userAbstract = certificateType === 'presentation'
                    ? eventAbstracts.find(a => a.userId === user.id && a.status === 'APROBADO')
                    : null;

                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                        selectedUsers.includes(user.id) ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                      )}
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <Checkbox checked={selectedUsers.includes(user.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.affiliation}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleGenerateSingle(user); }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex gap-4 mt-4">
            <Button
              className="flex-1"
              size="lg"
              variant="hero"
              onClick={handleExportAll}
              disabled={selectedUsers.length === 0 || isExporting}
            >
              <FileDown className="h-5 w-5 mr-2" />
              {isExporting ? 'Exportando...' : `Exportar ${selectedUsers.length} Certificados (PDF único)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
