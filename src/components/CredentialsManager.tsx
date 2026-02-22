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
import { Download, Users, FileDown, Save, Monitor, Smartphone, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { DesignCanvas } from './designCanvas/DesignCanvas';
import { ElementsPanel } from './designCanvas/ElementsPanel';
import { CanvasElement, defaultCredentialElements, CredentialDesignConfig } from './designCanvas/types';
import { cn } from '@/lib/utils';

interface CredentialsManagerProps {
  event: Event;
}

const qrDataOptions = [
  { id: 'name', label: 'Nombre' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Rol' },
  { id: 'affiliation', label: 'Afiliación' },
  { id: 'country', label: 'País' },
  { id: 'event', label: 'Evento' },
  { id: 'id', label: 'ID' },
];

const defaultConfig: CredentialDesignConfig = {
  orientation: 'portrait',
  width: 85.6,
  height: 53.98,
  primaryColor: '#1e40af',
  secondaryColor: '#059669',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  showPhoto: true,
  showQR: true,
  showRole: true,
  showAffiliation: true,
  showCountry: false,
  qrDataFields: ['name', 'email', 'event'],
  elements: [],
};

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

export function CredentialsManager({ event }: CredentialsManagerProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Storage keys
  const savedConfigKey = `credential_config_v2_${event.id}`;
  const savedElementsKey = `credential_elements_v2_${event.id}`;

  // Load saved config
  const [config, setConfig] = useState<CredentialDesignConfig>(() => {
    const saved = localStorage.getItem(savedConfigKey);
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch {
        return { ...defaultConfig, primaryColor: event.primaryColor, secondaryColor: event.secondaryColor };
      }
    }
    return { ...defaultConfig, primaryColor: event.primaryColor, secondaryColor: event.secondaryColor };
  });

  // Load saved elements
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    const saved = localStorage.getItem(savedElementsKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultCredentialElements;
      }
    }
    return defaultCredentialElements;
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
    toast.success('Configuración de credenciales guardada');
  };

  const toggleQrField = (fieldId: string) => {
    setConfig(prev => {
      const current = prev.qrDataFields || [];
      if (current.includes(fieldId)) {
        return { ...prev, qrDataFields: current.filter(f => f !== fieldId) };
      } else {
        return { ...prev, qrDataFields: [...current, fieldId] };
      }
    });
    setIsSaved(false);
  };

  // Preview data
  const previewData: Record<string, string> = {
    evento: event.name,
    nombre: 'Dr. Juan Pérez García',
    rol: 'Participante',
    afiliacion: 'Universidad de Madrid',
    pais: 'España',
    id: 'ID-ABC12345',
  };

  // Get eligible users
  const allUsers = db.users.getAll();
  const eventAbstracts = db.abstracts.getByEvent(event.id);
  const participantIds = [...new Set(eventAbstracts.map(a => a.userId))];
  const eligibleUsers = allUsers.filter(u => participantIds.includes(u.id) || u.role !== 'USER');

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

  const generateQrData = (user: User): string => {
    const data: Record<string, string> = {};
    (config.qrDataFields || []).forEach(field => {
      switch (field) {
        case 'name': data.name = user.name; break;
        case 'email': data.email = user.email; break;
        case 'role': data.role = user.role; break;
        case 'affiliation': data.affiliation = user.affiliation || ''; break;
        case 'country': data.country = user.country || ''; break;
        case 'event': data.event = event.name; break;
        case 'id': data.id = user.id; break;
      }
    });
    return JSON.stringify(data);
  };

  const handleGenerateSingle = async (user: User) => {
    handleSaveConfig();
    try {
      const doc = await generateCredentialPDF(user, event, config, elements);
      doc.save(`Credencial_${user.name.replace(/\s+/g, '_')}.pdf`);
      toast.success(`Credencial generada para ${user.name}`);
    } catch {
      toast.error('Error al generar la credencial');
    }
  };

  const generateCredentialPDF = async (
    user: User, 
    evt: Event, 
    cfg: CredentialDesignConfig,
    elems: CanvasElement[]
  ): Promise<jsPDF> => {
    const primaryRgb = hexToRgb(cfg.primaryColor);
    const secondaryRgb = hexToRgb(cfg.secondaryColor);
    const textRgb = hexToRgb(cfg.textColor);
    
    const doc = new jsPDF({
      orientation: cfg.orientation,
      unit: 'mm',
      format: [cfg.width, cfg.height],
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, 'F');

    // Render elements based on saved positions
    for (const element of elems.filter(e => e.enabled)) {
      const x = (element.x - element.width / 2) * width / 100;
      const y = (element.y - element.height / 2) * height / 100;
      const w = element.width * width / 100;
      const h = element.height * height / 100;

      if (element.type === 'shape') {
        const color = element.style.backgroundColor === 'primary' ? primaryRgb : secondaryRgb;
        doc.setFillColor(color.r, color.g, color.b);
        doc.rect(x, y, w, h, 'F');
      }

      if (element.type === 'text') {
        let content = element.content;
        content = content.replace('{{evento}}', evt.name);
        content = content.replace('{{nombre}}', user.name);
        content = content.replace('{{rol}}', getRoleLabel(user.role));
        content = content.replace('{{afiliacion}}', user.affiliation || '');
        content = content.replace('{{pais}}', user.country || '');
        content = content.replace('{{id}}', `ID-${user.id.substring(0, 8).toUpperCase()}`);

        const isWhite = element.style.color === 'white';
        const isPrimary = element.style.color === 'primary';
        const isSecondary = element.style.color === 'secondary';
        
        if (isWhite) doc.setTextColor(255, 255, 255);
        else if (isPrimary) doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        else if (isSecondary) doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        else doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);

        doc.setFontSize(element.style.fontSize || 10);
        doc.setFont('helvetica', element.style.fontWeight === 'bold' ? 'bold' : 'normal');
        
        const textX = element.x * width / 100;
        const textY = element.y * height / 100;
        
        // Handle role badge background
        if (element.id === 'role-badge' && element.style.backgroundColor === 'secondary') {
          const textWidth = doc.getTextWidth(content) + 4;
          doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
          doc.roundedRect(textX - textWidth / 2, textY - 3, textWidth, 5, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
        }
        
        const splitText = doc.splitTextToSize(content, w);
        doc.text(splitText, textX, textY, { align: 'center' });
      }

      if (element.type === 'photo') {
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(x, y, w, h, 2, 2, 'F');
        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.roundedRect(x, y, w, h, 2, 2, 'S');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(5);
        doc.text('FOTO', x + w / 2, y + h / 2, { align: 'center' });
      }

      if (element.type === 'qr') {
        const qrData = generateQrData(user);
        try {
          const qrDataUrl = await generateQRDataUrl(qrData);
          if (qrDataUrl) {
            doc.addImage(qrDataUrl, 'PNG', x, y, w, h);
          }
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(x, y, w, h, 'F');
        }
      }
    }

    return doc;
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
      await generateAllCredentialsAsPDF(usersToExport);
      toast.success(`${usersToExport.length} credenciales exportadas en un solo PDF`);
    } catch {
      toast.error('Error al exportar las credenciales');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAllCredentialsAsPDF = async (users: User[]): Promise<void> => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const credWidth = config.width;
    const credHeight = config.height;
    const margin = 10;
    const gap = 5;

    const cols = Math.floor((pageWidth - 2 * margin + gap) / (credWidth + gap));
    const rows = Math.floor((pageHeight - 2 * margin + gap) / (credHeight + gap));
    const perPage = cols * rows;

    const primaryRgb = hexToRgb(config.primaryColor);
    const secondaryRgb = hexToRgb(config.secondaryColor);
    const textRgb = hexToRgb(config.textColor);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const posOnPage = i % perPage;
      const col = posOnPage % cols;
      const row = Math.floor(posOnPage / cols);

      if (i > 0 && posOnPage === 0) {
        doc.addPage();
      }

      const x = margin + col * (credWidth + gap);
      const y = margin + row * (credHeight + gap);

      await drawCredentialAt(doc, user, x, y, primaryRgb, secondaryRgb, textRgb);
    }

    const fileName = `Credenciales_${event.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const drawCredentialAt = async (
    doc: jsPDF, 
    user: User, 
    baseX: number, 
    baseY: number,
    primaryRgb: { r: number; g: number; b: number },
    secondaryRgb: { r: number; g: number; b: number },
    textRgb: { r: number; g: number; b: number }
  ): Promise<void> => {
    const width = config.width;
    const height = config.height;

    // Border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(baseX, baseY, width, height, 'S');

    // Render elements
    for (const element of elements.filter(e => e.enabled)) {
      const x = baseX + (element.x - element.width / 2) * width / 100;
      const y = baseY + (element.y - element.height / 2) * height / 100;
      const w = element.width * width / 100;
      const h = element.height * height / 100;

      if (element.type === 'shape') {
        const color = element.style.backgroundColor === 'primary' ? primaryRgb : secondaryRgb;
        doc.setFillColor(color.r, color.g, color.b);
        doc.rect(x, y, w, h, 'F');
      }

      if (element.type === 'text') {
        let content = element.content;
        content = content.replace('{{evento}}', event.name);
        content = content.replace('{{nombre}}', user.name);
        content = content.replace('{{rol}}', getRoleLabel(user.role));
        content = content.replace('{{afiliacion}}', user.affiliation || '');
        content = content.replace('{{pais}}', user.country || '');
        content = content.replace('{{id}}', `ID-${user.id.substring(0, 8).toUpperCase()}`);

        const isWhite = element.style.color === 'white';
        if (isWhite) doc.setTextColor(255, 255, 255);
        else doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);

        doc.setFontSize(element.style.fontSize || 10);
        doc.setFont('helvetica', element.style.fontWeight === 'bold' ? 'bold' : 'normal');
        
        const textX = baseX + element.x * width / 100;
        const textY = baseY + element.y * height / 100;

        if (element.id === 'role-badge' && element.style.backgroundColor === 'secondary') {
          const roleText = getRoleLabel(user.role);
          const textWidth = doc.getTextWidth(roleText) + 4;
          doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
          doc.roundedRect(textX - textWidth / 2, textY - 3, textWidth, 5, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          content = roleText;
        }
        
        const splitText = doc.splitTextToSize(content, w);
        doc.text(splitText, textX, textY, { align: 'center' });
      }

      if (element.type === 'photo') {
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(x, y, w, h, 2, 2, 'F');
        doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        doc.roundedRect(x, y, w, h, 2, 2, 'S');
      }

      if (element.type === 'qr') {
        const qrData = generateQrData(user);
        try {
          const qrDataUrl = await generateQRDataUrl(qrData);
          if (qrDataUrl) {
            doc.addImage(qrDataUrl, 'PNG', x, y, w, h);
          }
        } catch {
          doc.setFillColor(240, 240, 240);
          doc.rect(x, y, w, h, 'F');
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Credenciales</h2>
          <p className="text-muted-foreground">Diseña credenciales con elementos arrastrables</p>
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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Size Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Formato de Credencial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Orientación</Label>
                  <Select
                    value={config.orientation}
                    onValueChange={(value: 'portrait' | 'landscape') => {
                      setConfig({ ...config, orientation: value });
                      setIsSaved(false);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Vertical</SelectItem>
                      <SelectItem value="landscape">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={config.width}
                    onChange={(e) => {
                      setConfig({ ...config, width: parseFloat(e.target.value) || 85.6 });
                      setIsSaved(false);
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alto (mm)</Label>
                  <Input
                    type="number"
                    value={config.height}
                    onChange={(e) => {
                      setConfig({ ...config, height: parseFloat(e.target.value) || 53.98 });
                      setIsSaved(false);
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
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
            </CardContent>
          </Card>

          {/* QR Data Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Datos del Código QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {qrDataOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleQrField(option.id)}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all text-center",
                      (config.qrDataFields || []).includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
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
                Arrastra elementos para reposicionarlos libremente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[400px]">
                <DesignCanvas
                  config={config}
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
              <CardTitle>Generar Credenciales</CardTitle>
              <CardDescription>{eligibleUsers.length} usuarios disponibles</CardDescription>
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
              <p>No hay usuarios registrados para este evento</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {eligibleUsers.map((user) => (
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
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">{user.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleGenerateSingle(user); }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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
              {isExporting ? 'Exportando...' : `Exportar ${selectedUsers.length} Credenciales (PDF único)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    USER: 'Participante',
    REVIEWER: 'Revisor',
    COMMITTEE: 'Comité',
    ADMIN: 'Organizador',
  };
  return labels[role] || role;
}
