import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FieldLibrary, fieldTypes } from './FieldLibrary';
import { FormCanvas } from './FormCanvas';
import { FormPreview } from './FormPreview';
import { FormField, FieldType, Event } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Edit3, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormBuilderWithPreviewProps {
  eventId: string;
  event: Event;
  initialFields?: FormField[];
  onSave: (fields: FormField[]) => void;
  type?: 'event' | 'user';
}

export function FormBuilderWithPreview({ 
  eventId, 
  event,
  initialFields = [], 
  onSave,
  type = 'event'
}: FormBuilderWithPreviewProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;

    // Adding new field from library
    if (activeData?.isNew && over.id === 'form-canvas') {
      const fieldType = activeData.type as FieldType;
      const fieldLabel = activeData.label as string | undefined;
      const fieldConfig = fieldTypes.find(f => f.type === fieldType && f.label === fieldLabel) || fieldTypes.find(f => f.type === fieldType);
      
      const newField: FormField = {
        id: generateId(),
        eventId,
        fieldType,
        label: fieldLabel || fieldConfig?.label || 'Nuevo Campo',
        isRequired: false,
        orderIndex: fields.length,
        width: 'full',
      };

      if (fieldType === 'select' || fieldType === 'radio') {
        newField.options = ['Opción 1', 'Opción 2', 'Opción 3'];
      }

      setFields([...fields, newField]);
      return;
    }

    // Reordering existing fields
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({
          ...f,
          orderIndex: i,
        }));
        setFields(reordered);
      }
    }
  };

  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id).map((f, i) => ({ ...f, orderIndex: i })));
  }, []);

  const handleUpdateField = useCallback((id: string, data: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);

  const handleSave = () => {
    onSave(fields);
    toast.success('Formulario guardado correctamente');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold">
            Constructor de Formulario {type === 'user' ? 'de Usuarios' : 'de Evento'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Arrastra campos para crear tu formulario y ve la vista previa en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList>
              <TabsTrigger value="edit" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Vista Previa
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="hero" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Field Library */}
            <div className="lg:col-span-3">
              <FieldLibrary />
            </div>

            {/* Form Canvas */}
            <div className="lg:col-span-4">
              <FormCanvas
                fields={fields}
                onRemove={handleRemoveField}
                onUpdate={handleUpdateField}
              />
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-5">
              <div className="sticky top-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg">Vista Previa en Tiempo Real</h3>
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
                </div>
                <FormPreview
                  fields={fields}
                  event={event}
                  device={previewDevice}
                  type={type}
                />
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId && activeId.startsWith('library-') && (
              <div className="p-3 rounded-lg border bg-card shadow-lg opacity-80">
                {(() => {
                  const type = activeId.replace('library-', '') as FieldType;
                  const field = fieldTypes.find(f => f.type === type);
                  const Icon = field?.icon;
                  return (
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="font-medium text-sm">{field?.label}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors flex items-center gap-2",
                  previewDevice === 'desktop' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <Monitor className="h-4 w-4" />
                Escritorio
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors flex items-center gap-2",
                  previewDevice === 'mobile' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <Smartphone className="h-4 w-4" />
                Móvil
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <FormPreview
              fields={fields}
              event={event}
              device={previewDevice}
              type={type}
              fullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
