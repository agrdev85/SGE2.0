import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldLibrary, fieldTypes } from './FieldLibrary';
import { FormField, FieldType } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Save, GripVertical, Trash2, Settings2, Eye, LayoutGrid, Plus, Check, AlertCircle, Type } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FormBuilderProps {
  eventId: string;
  initialFields?: FormField[];
  onSave: (fields: FormField[]) => void;
}

interface FieldItemProps {
  field: FormField;
  onRemove: (id: string) => void;
  onEdit: (field: FormField) => void;
  isHalf: boolean;
}

function SortableFieldItem({ field, onRemove, onEdit, isHalf }: FieldItemProps) {
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
  const Icon = fieldConfig?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card border rounded-xl transition-all",
        isDragging ? "opacity-50 shadow-xl ring-2 ring-primary z-50" : "hover:shadow-md",
        field.width === 'half' ? "md:col-span-1" : "col-span-1 md:col-span-2"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
          field.width === 'half' ? "bg-blue-100 dark:bg-blue-900/30" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            field.width === 'half' ? "text-blue-600 dark:text-blue-400" : "text-primary"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{field.label}</span>
            {field.isRequired && (
              <span className="text-destructive text-sm">*</span>
            )}
            {field.width === 'half' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                ½ Columna
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {fieldConfig?.description || field.fieldType}
            {field.placeholder && ` • "${field.placeholder}"`}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onEdit(field)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldConfigDialog({
  field,
  open,
  onClose,
  onSave,
}: {
  field: FormField | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<FormField>) => void;
}) {
  const [formData, setFormData] = useState<Partial<FormField>>({});

  useEffect(() => {
    if (field && open) {
      setFormData({
        label: field.label,
        placeholder: field.placeholder || '',
        width: field.width || 'full',
        isRequired: field.isRequired,
        options: field.options || [],
      });
    }
  }, [field, open]);

  if (!field) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Configurar Campo
          </DialogTitle>
          <DialogDescription>
            Personaliza las propiedades del campo "{field.label}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta</Label>
            <Input
              id="label"
              value={formData.label ?? field.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Nombre del campo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">Texto de ayuda</Label>
            <Input
              id="placeholder"
              value={formData.placeholder ?? field.placeholder ?? ''}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="Texto que aparece como ayuda"
            />
          </div>

          <div className="space-y-3">
            <Label>Ancho del campo</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, width: 'full' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  (formData.width ?? field.width) === 'full'
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <div className="w-full h-6 bg-foreground/20 rounded mb-2 mx-auto" />
                <span className="text-sm font-medium">Ancho completo</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, width: 'half' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  (formData.width ?? field.width) === 'half'
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-[45%] h-6 bg-foreground/20 rounded" />
                  <div className="w-[45%] h-6 bg-foreground/20 rounded" />
                </div>
                <span className="text-sm font-medium">Mitad (2 cols)</span>
              </button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="text-base cursor-pointer">Campo requerido</Label>
              <p className="text-xs text-muted-foreground">Obligar al usuario a completar</p>
            </div>
            <Switch
              checked={formData.isRequired ?? field.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            />
          </div>

          {(field.fieldType === 'select' || field.fieldType === 'radio') && (
            <div className="space-y-2">
              <Label>Opciones (una por línea)</Label>
              <Textarea
                value={(formData.options ?? field.options)?.join('\n') || ''}
                onChange={(e) => setFormData({ ...formData, options: e.target.value.split('\n').filter(o => o.trim()) })}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Aplicar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({
  fields,
  open,
  onClose,
}: {
  fields: FormField[];
  open: boolean;
  onClose: () => void;
}) {
  const renderField = (field: FormField, isHalf: boolean) => (
    <div key={field.id} className={cn(isHalf && "md:col-span-1")}>
      <Label className={cn(
        field.isRequired && "after:content-['*'] after:text-destructive after:ml-1"
      )}>
        {field.label}
      </Label>
      {field.fieldType === 'textarea' ? (
        <Textarea className="mt-1" placeholder={field.placeholder} disabled rows={3} />
      ) : field.fieldType === 'select' ? (
        <Input className="mt-1" value="Seleccionar..." disabled />
      ) : field.fieldType === 'checkbox' ? (
        <div className="flex items-center gap-2 mt-2">
          <Input type="checkbox" disabled className="w-4 h-4" />
          <span className="text-sm text-muted-foreground">{field.placeholder || 'Acepto'}</span>
        </div>
      ) : (
        <Input className="mt-1" placeholder={field.placeholder} disabled />
      )}
    </div>
  );

  const groupedFields = useMemo(() => {
    const rows: { field: FormField; isHalf: boolean }[][] = [];
    let halfPending: FormField | null = null;

    fields.forEach(field => {
      const isHalf = field.width === 'half';
      if (isHalf) {
        if (halfPending) {
          rows.push([{ field: halfPending, isHalf: true }, { field, isHalf: true }]);
          halfPending = null;
        } else {
          halfPending = field;
        }
      } else {
        if (halfPending) {
          rows.push([{ field: halfPending, isHalf: true }]);
          halfPending = null;
        }
        rows.push([{ field, isHalf: false }]);
      }
    });

    if (halfPending) {
      rows.push([{ field: halfPending, isHalf: true }]);
    }

    return rows;
  }, [fields]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Vista Previa del Formulario
          </DialogTitle>
          <DialogDescription>
            Así verán los usuarios el formulario de inscripción
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-4">
          <CardContent className="p-6">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay campos en el formulario</p>
                <p className="text-sm mt-1">Arrastra campos desde la biblioteca</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  {groupedFields.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={cn(
                        "grid gap-4",
                        row.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                      )}
                    >
                      {row.map((item) => renderField(item.field, item.isHalf))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar Vista Previa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormBuilder({ eventId, initialFields = [], onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.isNew && (over.id === 'form-canvas' || isOver)) {
      const fieldType = activeData.type as FieldType;
      const fieldConfig = fieldTypes.find(f => f.type === fieldType);
      
      const newField: FormField = {
        id: generateId(),
        eventId,
        fieldType,
        label: fieldConfig?.label || activeData.label || 'Nuevo Campo',
        isRequired: false,
        orderIndex: fields.length,
        width: 'half',
      };

      if (fieldType === 'select' || fieldType === 'radio') {
        newField.options = ['Opción 1', 'Opción 2', 'Opción 3'];
      }

      setFields([...fields, newField]);
      setEditingField(newField);
      toast.success(`"${newField.label}" agregado`);
      return;
    }

    if (active.id !== over.id && !activeData?.isNew) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...fields];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);
        setFields(reordered.map((f, i) => ({ ...f, orderIndex: i })));
      }
    }
  };

  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleUpdateField = useCallback((data: Partial<FormField>) => {
    if (!editingField) return;
    setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...data } : f));
    setEditingField(prev => prev ? { ...prev, ...data } : null);
  }, [editingField]);

  const handleSave = () => {
    onSave(fields);
    toast.success('Formulario guardado correctamente');
  };

  const groupedFields = useMemo(() => {
    const rows: { field: FormField; isHalf: boolean }[][] = [];
    let halfPending: FormField | null = null;

    fields.forEach(field => {
      const isHalf = field.width === 'half';
      if (isHalf) {
        if (halfPending) {
          rows.push([{ field: halfPending, isHalf: true }, { field, isHalf: true }]);
          halfPending = null;
        } else {
          halfPending = field;
        }
      } else {
        if (halfPending) {
          rows.push([{ field: halfPending, isHalf: true }]);
          halfPending = null;
        }
        rows.push([{ field, isHalf: false }]);
      }
    });

    if (halfPending) {
      rows.push([{ field: halfPending, isHalf: true }]);
    }

    return rows;
  }, [fields]);

  const fieldIds = fields.map(f => f.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Constructor de Formulario</h2>
            <p className="text-muted-foreground mt-1">
              Crea el formulario de inscripción arrastrando campos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar Formulario
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <FieldLibrary />
            </div>
          </div>
          
          <div className="lg:col-span-8">
            <div
              ref={setDroppableRef}
              className={cn(
                "border-2 rounded-2xl p-6 min-h-[600px] transition-all bg-gradient-to-b from-muted/20 to-transparent",
                isOver || activeId ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground/20"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Campos del Formulario</h3>
                    <p className="text-sm text-muted-foreground">
                      {fields.length} campo{fields.length !== 1 ? 's' : ''} agregado{fields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {fields.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border-2 border-foreground/30" />
                      <span className="text-muted-foreground">Completo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30" />
                      <span className="text-muted-foreground">Mitad</span>
                    </div>
                  </div>
                )}
              </div>

              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                  <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                    <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Comienza a construir tu formulario</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Arrastra campos desde la biblioteca de la izquierda o haz clic en cualquier campo para agregarlo
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Los campos aparecerán en el formulario de inscripción de los participantes
                  </div>
                </div>
              ) : (
                <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {groupedFields.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className={cn(
                          "grid gap-3",
                          row.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-1"
                        )}
                      >
                        {row.map((item) => (
                          <SortableFieldItem
                            key={item.field.id}
                            field={item.field}
                            onRemove={handleRemoveField}
                            onEdit={setEditingField}
                            isHalf={item.isHalf}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeId.startsWith('library-') && (
          <div className="p-4 rounded-xl border bg-card shadow-xl opacity-95">
            {(() => {
              const type = activeId.replace('library-', '').replace(/-\d+$/, '') as FieldType;
              const field = fieldTypes.find(f => f.type === type);
              const Icon = field?.icon;
              return (
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <span className="font-medium">{field?.label || 'Campo'}</span>
                </div>
              );
            })()}
          </div>
        )}
      </DragOverlay>

      <FieldConfigDialog
        field={editingField}
        open={!!editingField}
        onClose={() => setEditingField(null)}
        onSave={handleUpdateField}
      />

      <PreviewDialog
        fields={fields}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </DndContext>
  );
}
