import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FormField, FieldType } from '@/lib/database';
import { fieldTypes } from './FieldLibrary';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';

interface SortableFieldProps {
  field: FormField;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: Partial<FormField>) => void;
}

function SortableField({ field, onRemove, onUpdate }: SortableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldConfig = fieldTypes.find(f => f.type === field.fieldType);
  const Icon = fieldConfig?.icon;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "p-4 rounded-lg border bg-card group transition-all",
          isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3 w-3 text-primary" />
                </div>
              )}
              <span className="font-medium text-sm">{field.label}</span>
              {field.isRequired && (
                <span className="text-destructive text-xs">*</span>
              )}
            </div>

            {/* Field Preview */}
            <div className="pointer-events-none opacity-70">
              <FieldPreview field={field} />
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditing(true)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onRemove(field.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurar Campo</SheetTitle>
            <SheetDescription>
              Personaliza las propiedades del campo
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Texto de ayuda..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Campo Requerido</Label>
                <p className="text-xs text-muted-foreground">
                  El usuario debe completar este campo
                </p>
              </div>
              <Switch
                checked={field.isRequired}
                onCheckedChange={(checked) => onUpdate(field.id, { isRequired: checked })}
              />
            </div>

            {(field.fieldType === 'select' || field.fieldType === 'radio') && (
              <div className="space-y-2">
                <Label>Opciones (una por línea)</Label>
                <Textarea
                  value={field.options?.join('\n') || ''}
                  onChange={(e) => onUpdate(field.id, { 
                    options: e.target.value.split('\n').filter(o => o.trim()) 
                  })}
                  placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                  rows={5}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return <Input placeholder={field.placeholder || field.label} disabled />;
    case 'textarea':
      return <Textarea placeholder={field.placeholder || field.label} disabled rows={2} />;
    case 'date':
      return <Input type="date" disabled />;
    case 'select':
      return (
        <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" disabled>
          <option>Seleccionar...</option>
          {field.options?.map(opt => <option key={opt}>{opt}</option>)}
        </select>
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox disabled />
          <span className="text-sm">{field.placeholder || 'Acepto los términos'}</span>
        </div>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || ['Opción 1', 'Opción 2']).map(opt => (
            <div key={opt} className="flex items-center gap-2">
              <input type="radio" disabled />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'file':
    case 'image':
      return (
        <div className="border-2 border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
          Subir {field.fieldType === 'image' ? 'imagen' : 'archivo'}
        </div>
      );
    case 'separator':
      return <Separator className="my-2" />;
    default:
      return null;
  }
}

interface FormCanvasProps {
  fields: FormField[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: Partial<FormField>) => void;
}

export function FormCanvas({ fields, onRemove, onUpdate }: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h3 className="font-display font-semibold">Vista Previa del Formulario</h3>
        <p className="text-sm text-muted-foreground">
          Arrastra campos aquí para construir tu formulario
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "p-4 min-h-[400px] transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {fields.length === 0 ? (
          <div className={cn(
            "h-full min-h-[300px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground",
            isOver && "border-primary bg-primary/5"
          )}>
            <p className="text-lg font-medium">Arrastra campos aquí</p>
            <p className="text-sm">Crea tu formulario personalizado</p>
          </div>
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  onRemove={onRemove}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </Card>
  );
}
