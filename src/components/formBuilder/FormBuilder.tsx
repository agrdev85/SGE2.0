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
import { FormField, FieldType } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface FormBuilderProps {
  eventId: string;
  initialFields?: FormField[];
  onSave: (fields: FormField[]) => void;
}

export function FormBuilder({ eventId, initialFields = [], onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      const fieldConfig = fieldTypes.find(f => f.type === fieldType);
      
      const newField: FormField = {
        id: generateId(),
        eventId,
        fieldType,
        label: fieldConfig?.label || 'Nuevo Campo',
        isRequired: false,
        orderIndex: fields.length,
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-semibold">Constructor de Formulario</h2>
            <p className="text-sm text-muted-foreground">
              Arrastra campos para crear tu formulario personalizado
            </p>
          </div>
          <Button variant="hero" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Guardar Formulario
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-1">
            <FieldLibrary />
          </div>
          <div className="lg:col-span-2">
            <FormCanvas
              fields={fields}
              onRemove={handleRemoveField}
              onUpdate={handleUpdateField}
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
  );
}
