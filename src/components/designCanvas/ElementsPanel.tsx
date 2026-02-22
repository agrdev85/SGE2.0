import { useState } from 'react';
import { CanvasElement } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { ImageUploader } from '@/components/ImageUploader';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Type, 
  Image, 
  QrCode, 
  Square, 
  User, 
  ChevronDown, 
  ChevronRight,
  Minus,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElementsPanelProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
}

const getElementIcon = (type: CanvasElement['type']) => {
  switch (type) {
    case 'text': return Type;
    case 'logo': return Image;
    case 'photo': return User;
    case 'qr': return QrCode;
    case 'shape': return Square;
    case 'line': return Minus;
    default: return Square;
  }
};

const getElementLabel = (element: CanvasElement): string => {
  const labels: Record<string, string> = {
    'header-bar': 'Barra de Encabezado',
    'title': 'Título',
    'subtitle': 'Subtítulo',
    'logo-header': 'Logo (Encabezado)',
    'logo-body': 'Logo (Cuerpo)',
    'logo': 'Logo',
    'header-text': 'Texto de Encabezado',
    'participant-name': 'Nombre del Participante',
    'body-text': 'Texto del Cuerpo',
    'event-name': 'Nombre del Evento',
    'event-date': 'Fecha del Evento',
    'signature-line': 'Línea de Firma',
    'signer-name': 'Nombre del Firmante',
    'signer-title': 'Cargo del Firmante',
    'footer-bar': 'Barra de Pie',
    'footer-text': 'Texto de Pie',
    'qr-code': 'Código QR',
    'photo': 'Foto del Participante',
    'role-badge': 'Rol/Categoría',
    'affiliation': 'Afiliación',
    'country': 'País',
    'credential-id': 'ID de Credencial',
  };
  return labels[element.id] || element.id;
};

export function ElementsPanel({ elements, selectedId, onSelectElement, onUpdateElement }: ElementsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(selectedId);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    onSelectElement(id);
  };

  const groupedElements = {
    header: elements.filter(e => e.y < 25),
    body: elements.filter(e => e.y >= 25 && e.y < 75),
    footer: elements.filter(e => e.y >= 75),
  };

  const renderElementControl = (element: CanvasElement) => {
    const Icon = getElementIcon(element.type);
    const isExpanded = expandedId === element.id;
    const isSelected = selectedId === element.id;

    return (
      <Collapsible
        key={element.id}
        open={isExpanded}
        onOpenChange={() => handleToggle(element.id)}
      >
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
              isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted border border-transparent",
              !element.enabled && "opacity-50"
            )}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium truncate">{getElementLabel(element)}</span>
            <Switch
              checked={element.enabled}
              onCheckedChange={(checked) => onUpdateElement(element.id, { enabled: checked })}
              onClick={(e) => e.stopPropagation()}
            />
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-2 pb-2">
          <div className="pt-2 space-y-3 border-l-2 border-muted ml-2 pl-3">
            {/* Content input for text elements */}
            {element.type === 'text' && !element.content.includes('{{') && (
              <div className="space-y-1">
                <Label className="text-xs">Contenido</Label>
                {element.content.length > 50 ? (
                  <Textarea
                    value={element.content}
                    onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={element.content}
                    onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                    className="text-sm h-8"
                  />
                )}
              </div>
            )}

            {/* Logo/Image uploader */}
            {element.type === 'logo' && (
              <div className="space-y-1">
                <Label className="text-xs">Imagen</Label>
                <ImageUploader
                  value={element.content}
                  onChange={(url) => onUpdateElement(element.id, { content: url })}
                  aspectRatio="auto"
                  className="max-w-[150px]"
                  placeholder="Subir logo"
                />
              </div>
            )}

            {/* Position controls */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Posición X</Label>
                <Slider
                  value={[element.x]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => onUpdateElement(element.id, { x: v })}
                  className="py-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Posición Y</Label>
                <Slider
                  value={[element.y]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => onUpdateElement(element.id, { y: v })}
                  className="py-1"
                />
              </div>
            </div>

            {/* Size controls */}
            {element.type !== 'line' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Ancho</Label>
                  <Slider
                    value={[element.width]}
                    min={5}
                    max={100}
                    step={1}
                    onValueChange={([v]) => onUpdateElement(element.id, { width: v })}
                    className="py-1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alto</Label>
                  <Slider
                    value={[element.height]}
                    min={3}
                    max={50}
                    step={1}
                    onValueChange={([v]) => onUpdateElement(element.id, { height: v })}
                    className="py-1"
                  />
                </div>
              </div>
            )}

            {/* Font size for text */}
            {element.type === 'text' && (
              <div className="space-y-1">
                <Label className="text-xs">Tamaño de Fuente</Label>
                <Slider
                  value={[element.style.fontSize || 14]}
                  min={6}
                  max={48}
                  step={1}
                  onValueChange={([v]) => onUpdateElement(element.id, { 
                    style: { ...element.style, fontSize: v } 
                  })}
                  className="py-1"
                />
                <span className="text-xs text-muted-foreground">{element.style.fontSize || 14}px</span>
              </div>
            )}

            {/* Lock toggle */}
            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs text-muted-foreground">Bloquear elemento</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => onUpdateElement(element.id, { locked: !element.locked })}
              >
                {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Elementos del Diseño</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-4">
            {/* Header section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Encabezado</Badge>
              </div>
              <div className="space-y-1">
                {groupedElements.header.map(renderElementControl)}
              </div>
            </div>

            {/* Body section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Cuerpo</Badge>
              </div>
              <div className="space-y-1">
                {groupedElements.body.map(renderElementControl)}
              </div>
            </div>

            {/* Footer section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Pie de Página</Badge>
              </div>
              <div className="space-y-1">
                {groupedElements.footer.map(renderElementControl)}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
