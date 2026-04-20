import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  Upload,
  Image,
  Minus,
  Heading,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  FileText,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldType } from '@/lib/database';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FieldConfig {
  type: FieldType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const fieldCategories = [
  {
    name: 'Datos Personales',
    icon: User,
    fields: [
      { type: 'text' as FieldType, label: 'Nombre(s) y Apellidos', icon: Type, description: 'Nombre completo del participante' },
      { type: 'text' as FieldType, label: 'Carné de Identidad / Pasaporte', icon: Hash, description: 'Documento de identidad' },
      { type: 'email' as FieldType, label: 'Correo Electrónico', icon: Mail, description: 'Email de contacto' },
      { type: 'phone' as FieldType, label: 'Teléfono', icon: Phone, description: 'Número telefónico' },
      { type: 'image' as FieldType, label: 'Fotografía', icon: Image, description: 'Foto de perfil' },
    ],
  },
  {
    name: 'Ubicación',
    icon: MapPin,
    fields: [
      { type: 'select' as FieldType, label: 'País', icon: ChevronDown, description: 'País de residencia' },
      { type: 'select' as FieldType, label: 'Provincia / Estado', icon: MapPin, description: 'Provincia o estado' },
      { type: 'text' as FieldType, label: 'Ciudad', icon: MapPin, description: 'Ciudad de residencia' },
    ],
  },
  {
    name: 'Profesión',
    icon: Briefcase,
    fields: [
      { type: 'select' as FieldType, label: 'Afiliación', icon: Briefcase, description: 'Institución o empresa' },
      { type: 'select' as FieldType, label: 'Tipo de Afiliación', icon: ChevronDown, description: 'Académica / Profesional / Gubernamental' },
      { type: 'select' as FieldType, label: 'Sector Económico', icon: ChevronDown, description: 'Sector de trabajo' },
      { type: 'text' as FieldType, label: 'Cargo / Posición', icon: FileText, description: 'Puesto en la institución' },
    ],
  },
  {
    name: 'Académico',
    icon: GraduationCap,
    fields: [
      { type: 'select' as FieldType, label: 'Tipo de Participación', icon: Users, description: 'Ponente / Asistente / Poster' },
      { type: 'select' as FieldType, label: 'Nivel Científico', icon: GraduationCap, description: 'Doctorado / Maestría / Licenciatura' },
      { type: 'select' as FieldType, label: 'Nivel Educacional', icon: GraduationCap, description: 'Máximo nivel alcanzado' },
    ],
  },
  {
    name: 'Generales',
    icon: FileText,
    fields: [
      { type: 'radio' as FieldType, label: 'Género', icon: Circle, description: 'Masculino / Femenino / Otro' },
      { type: 'select' as FieldType, label: 'Idioma Preferido', icon: ChevronDown, description: 'Idioma de comunicación' },
      { type: 'checkbox' as FieldType, label: 'Acepta Términos', icon: CheckSquare, description: 'Aceptación de condiciones' },
    ],
  },
  {
    name: 'Avanzados',
    icon: FileText,
    fields: [
      { type: 'text' as FieldType, label: 'Texto Corto', icon: Type, description: 'Campo de texto simple' },
      { type: 'textarea' as FieldType, label: 'Texto Largo', icon: AlignLeft, description: 'Área de texto múltiples líneas' },
      { type: 'number' as FieldType, label: 'Número', icon: Hash, description: 'Campo numérico' },
      { type: 'date' as FieldType, label: 'Fecha', icon: Calendar, description: 'Selector de fecha' },
      { type: 'select' as FieldType, label: 'Selector', icon: ChevronDown, description: 'Menú desplegable' },
      { type: 'file' as FieldType, label: 'Archivo', icon: Upload, description: 'Subida de archivo' },
      { type: 'separator' as FieldType, label: 'Separador', icon: Minus, description: 'Separador visual entre secciones' },
      { type: 'heading' as FieldType, label: 'Encabezado', icon: Heading, description: 'Título de sección' },
    ],
  },
];

interface DraggableFieldProps {
  field: FieldConfig;
}

function DraggableField({ field }: DraggableFieldProps) {
  const slug = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${field.type}-${slug}`,
    data: { type: field.type, isNew: true, label: field.label },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const Icon = field.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg border bg-card cursor-grab active:cursor-grabbing transition-all",
        "hover:border-primary/50 hover:shadow-sm hover:bg-primary/5",
        "group",
        isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
      )}
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{field.label}</p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{field.description}</p>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
    </div>
  );
}

const fieldTypes: FieldConfig[] = fieldCategories.flatMap(cat => cat.fields);

export function FieldLibrary() {
  const [openCategories, setOpenCategories] = useState<string[]>(['Datos Personales']);

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  return (
    <Card className="h-full border-0 shadow-md">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          Biblioteca de Campos
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Arrastra los campos al formulario o haz clic para agregar
        </p>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-280px)]">
        <div className="divide-y">
          {fieldCategories.map(category => {
            const isOpen = openCategories.includes(category.name);
            const CategoryIcon = category.icon;
            
            return (
              <Collapsible
                key={category.name}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.name)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CategoryIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {category.fields.length}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2">
                    {category.fields.map(field => (
                      <DraggableField key={`${category.name}-${field.label}`} field={field} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { fieldTypes };
