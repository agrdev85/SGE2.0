import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import EventContentEditor from '@/components/EventContentEditor';
import { cn } from '@/lib/utils';
import { Save, Image as ImageIcon, Palette, FileText, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmation';

const COLORES_PRESETIDOS = [
  { primary: '#3b82f6', secondary: '#60a5fa', name: 'Azul' },
  { primary: '#10b981', secondary: '#34d399', name: 'Verde' },
  { primary: '#f59e0b', secondary: '#fbbf24', name: 'Amarillo' },
  { primary: '#ef4444', secondary: '#f87171', name: 'Rojo' },
  { primary: '#8b5cf6', secondary: '#a78bfa', name: 'Morado' },
  { primary: '#ec4899', secondary: '#f472b6', name: 'Rosa' },
];

export function BasicInfoStep() {
  const { evento, guardarYContinuar, state } = useWizard();
  const { success } = useConfirmation();
  
  const [form, setForm] = useState({
    name: '',
    acronym: '',
    description: '',
    startDate: '',
    endDate: '',
    logoUrl: '',
    bannerImageUrl: '',
    backgroundImageUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#60a5fa',
    backgroundColor: '#f0f9ff',
    tituloPublico: '',
    contenidoHtml: '',
    monedaPrincipal: 'USD' as 'CUP' | 'USD' | 'EUR',
    tasasCambio: {
      USD: 120,
      EUR: 130,
    },
    urlEvento: '',
    modoCargaTrabajos: 'TEMATICA' as 'TEMATICA' | 'SUBEVENTO',
  });

  const [activeTab, setActiveTab] = useState('informacion');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (evento) {
      const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return '';
        if (dateStr.includes('T')) return dateStr.slice(0, 16);
        return dateStr;
      };
      
      setForm({
        name: evento.name || '',
        acronym: evento.acronym || '',
        description: evento.description || '',
        startDate: formatDateForInput(evento.startDate),
        endDate: formatDateForInput(evento.endDate),
        logoUrl: evento.logoUrl || '',
        bannerImageUrl: (evento as any).bannerImageUrl || '',
        backgroundImageUrl: (evento as any).backgroundImageUrl || '',
        primaryColor: (evento as any).primaryColor || '#3b82f6',
        secondaryColor: (evento as any).secondaryColor || '#60a5fa',
        backgroundColor: (evento as any).backgroundColor || '#f0f9ff',
        tituloPublico: (evento as any).tituloPublico || '',
        contenidoHtml: (evento as any).contenidoHtml || '',
        monedaPrincipal: (evento as any).monedaPrincipal || 'USD',
        tasasCambio: (evento as any).tasasCambio || { USD: 120, EUR: 130 },
        urlEvento: (evento as any).urlEvento || '',
        modoCargaTrabajos: (evento as any).modoCargaTrabajos || 'TEMATICA',
      });
    }
  }, [evento]);

  const handleSave = async () => {
    if (!form.name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!form.acronym) {
      toast.error('El acrónimo es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      await guardarYContinuar(1, {
        name: form.name,
        acronym: form.acronym,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        logoUrl: form.logoUrl,
        bannerImageUrl: form.bannerImageUrl,
        backgroundImageUrl: form.backgroundImageUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        backgroundColor: form.backgroundColor,
        tituloPublico: form.tituloPublico,
        contenidoHtml: form.contenidoHtml,
        monedaPrincipal: form.monedaPrincipal,
        tasasCambio: form.tasasCambio,
        urlEvento: form.urlEvento,
        modoCargaTrabajos: form.modoCargaTrabajos,
      } as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion" className="gap-2">
            <FileText className="w-4 h-4" />
            Información
          </TabsTrigger>
          <TabsTrigger value="contenido" className="gap-2">
            <Layout className="w-4 h-4" />
            Contenido
          </TabsTrigger>
          <TabsTrigger value="moneda" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Moneda
          </TabsTrigger>
        </TabsList>

        {/* TAB: INFORMACIÓN */}
        <TabsContent value="informacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Evento</CardTitle>
              <CardDescription>
                Configure la información básica de su evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre del Evento *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Congreso Internacional de Ciberseguridad 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Acrónimo *</Label>
                  <Input
                    value={form.acronym}
                    onChange={e => setForm({ ...form, acronym: e.target.value.toUpperCase() })}
                    placeholder="Ej: CICS2026"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describa brevemente el evento..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fecha y Hora de Inicio</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha y Hora de Fin</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título Público</Label>
                <Input
                  value={form.tituloPublico}
                  onChange={e => setForm({ ...form, tituloPublico: e.target.value })}
                  placeholder="Título que verán los participantes"
                />
              </div>

              <div className="space-y-2">
                <Label>URL del Evento (Slug)</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <span className="text-muted-foreground text-sm whitespace-nowrap">/evento/</span>
                  <Input
                    value={form.urlEvento}
                    onChange={e => setForm({ ...form, urlEvento: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })}
                    placeholder="mi-evento-2026"
                    className="flex-1 bg-background font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL pública única del evento. Ejemplo completo: <code className="bg-muted px-1 rounded">http://localhost:8082/evento/{form.urlEvento || 'slug-del-evento'}</code>
                </p>
                {form.urlEvento && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600">✓ URL válida</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs h-auto p-0"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/evento/${form.urlEvento}`)}
                    >
                      Copiar URL
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Modo de Carga de Trabajos</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modoCarga"
                      value="TEMATICA"
                      checked={form.modoCargaTrabajos === 'TEMATICA'}
                      onChange={() => setForm({ ...form, modoCargaTrabajos: 'TEMATICA' })}
                      className="w-4 h-4"
                    />
                    <span>Temáticas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modoCarga"
                      value="SUBEVENTO"
                      checked={form.modoCargaTrabajos === 'SUBEVENTO'}
                      onChange={() => setForm({ ...form, modoCargaTrabajos: 'SUBEVENTO' })}
                      className="w-4 h-4"
                    />
                    <span>SubEventos</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Define cómo se organizarán los trabajos científicos en el programa
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo del Evento</Label>
                  <MultiImageUpload
                    images={form.logoUrl ? [form.logoUrl] : []}
                    onChange={images => setForm({ ...form, logoUrl: images[0] || '' })}
                    maxImages={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Principal</Label>
                  <MultiImageUpload
                    images={form.bannerImageUrl ? [form.bannerImageUrl] : []}
                    onChange={images => setForm({ ...form, bannerImageUrl: images[0] || '' })}
                    maxImages={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Colores del Evento
              </CardTitle>
              <CardDescription>
                Seleccione los colores que identificarán a su evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Predefinidos</Label>
                <div className="flex gap-3">
                  {COLORES_PRESETIDOS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setForm({ 
                        ...form, 
                        primaryColor: color.primary, 
                        secondaryColor: color.secondary 
                      })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                        form.primaryColor === color.primary 
                          ? "border-primary ring-2 ring-primary" 
                          : "border-transparent hover:border-muted"
                      )}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: color.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: color.secondary }}
                        />
                      </div>
                      <span className="text-xs">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={form.primaryColor}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-14 h-10 cursor-pointer"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={form.secondaryColor}
                      onChange={e => setForm({ ...form, secondaryColor: e.target.value })}
                      className="w-14 h-10 cursor-pointer"
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={e => setForm({ ...form, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg border">
                <div 
                  className="w-16 h-16 rounded-lg" 
                  style={{ backgroundColor: form.primaryColor }}
                />
                <div 
                  className="w-16 h-16 rounded-lg" 
                  style={{ backgroundColor: form.secondaryColor }}
                />
                <div className="flex items-center">
                  <p className="text-lg font-bold" style={{ color: form.primaryColor }}>
                    {form.name || 'Vista Previa'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CONTENIDO */}
        <TabsContent value="contenido" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenido del Evento</CardTitle>
              <CardDescription>
                Configure el contenido público y la apariencia de la página del evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Contenido del Evento</Label>
                <EventContentEditor
                  content={form.contenidoHtml || ''}
                  onChange={html => setForm({ ...form, contenidoHtml: html })}
                />
                <p className="text-xs text-muted-foreground">
                  Puede usar HTML para formatear el contenido (ej: &lt;b&gt;, &lt;p&gt;, &lt;br&gt;)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Imagen de Fondo</Label>
                <MultiImageUpload
                  images={form.backgroundImageUrl ? [form.backgroundImageUrl] : []}
                  onChange={images => setForm({ ...form, backgroundImageUrl: images[0] || '' })}
                  maxImages={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Color de Fondo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.backgroundColor}
                    onChange={e => setForm({ ...form, backgroundColor: e.target.value })}
                    className="w-14 h-10 cursor-pointer"
                  />
                  <Input
                    value={form.backgroundColor}
                    onChange={e => setForm({ ...form, backgroundColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: form.backgroundColor }}>
                <p className="text-sm text-muted-foreground mb-2">Vista previa del fondo:</p>
                <p className="text-lg font-medium">Contenido del evento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MONEDA */}
        <TabsContent value="moneda" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Monetaria</CardTitle>
              <CardDescription>
                Configure la moneda principal y tasas de cambio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Moneda Principal</Label>
                  <Select value={form.monedaPrincipal} onValueChange={v => setForm({ ...form, monedaPrincipal: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUP">CUP - Peso Cubano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tasa USD (1 USD = X CUP)</Label>
                  <Input
                    type="number"
                    value={form.tasasCambio.USD}
                    onChange={e => setForm({ 
                      ...form, 
                      tasasCambio: { ...form.tasasCambio, USD: parseFloat(e.target.value) || 0 } 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasa EUR (1 EUR = X CUP)</Label>
                  <Input
                    type="number"
                    value={form.tasasCambio.EUR}
                    onChange={e => setForm({ 
                      ...form, 
                      tasasCambio: { ...form.tasasCambio, EUR: parseFloat(e.target.value) || 0 } 
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-start gap-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>
    </div>
  );
}

export default BasicInfoStep;
