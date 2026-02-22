import { FormField, Event } from '@/lib/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormPreviewProps {
  fields: FormField[];
  event: Event;
  device: 'desktop' | 'mobile';
  type?: 'event' | 'user';
  fullScreen?: boolean;
}

export function FormPreview({ fields, event, device, type = 'event', fullScreen = false }: FormPreviewProps) {
  const containerWidth = device === 'mobile' ? 'max-w-sm' : fullScreen ? 'max-w-2xl' : 'max-w-full';

  const renderField = (field: FormField) => {
    const fieldWidth = device === 'mobile' ? 'w-full' : field.width === 'half' ? 'w-1/2' : 'w-full';

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
              placeholder={field.placeholder || field.label}
              className="mt-1.5"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              placeholder={field.placeholder || field.label}
              className="mt-1.5"
              rows={3}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input type="date" className="mt-1.5" />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select className="w-full mt-1.5 h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Seleccionar...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className={cn("p-2 flex items-start gap-3", fieldWidth)}>
            <Checkbox id={field.id} className="mt-0.5" />
            <Label htmlFor={field.id} className="text-sm font-normal leading-relaxed">
              {field.placeholder || field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="mt-2 space-y-2">
              {(field.options || ['Opción 1', 'Opción 2']).map((opt, i) => (
                <div key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={field.id}
                    id={`${field.id}-${i}`}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`${field.id}-${i}`} className="text-sm">{opt}</label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'file':
      case 'image':
        return (
          <div key={field.id} className={cn("p-2", fieldWidth)}>
            <Label className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="mt-1.5 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <p className="text-sm text-muted-foreground">
                Haz clic para subir {field.fieldType === 'image' ? 'una imagen' : 'un archivo'}
              </p>
            </div>
          </div>
        );

      case 'separator':
        return (
          <div key={field.id} className="w-full p-2">
            <Separator className="my-2" />
          </div>
        );

      case 'heading':
        return (
          <div key={field.id} className="w-full p-2">
            <h3 className="text-lg font-semibold" style={{ color: event.primaryColor }}>
              {field.label}
            </h3>
            {field.placeholder && (
              <p className="text-sm text-muted-foreground">{field.placeholder}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("overflow-hidden mx-auto", containerWidth)}>
      {/* Event Header */}
      <div
        className="relative h-32 bg-cover bg-center"
        style={{
          backgroundImage: `url(${event.backgroundImageUrl || event.bannerImageUrl})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${event.primaryColor}dd, ${event.secondaryColor}dd)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-xl font-display font-bold drop-shadow-lg">
              {type === 'user' ? 'Registro de Usuario' : event.name}
            </h2>
            <p className="text-sm opacity-90">
              {type === 'user' ? 'Complete sus datos personales' : 'Formulario de Inscripción'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6" style={{ backgroundColor: event.backgroundColor || '#ffffff' }}>
        {fields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Sin campos configurados</p>
            <p className="text-sm">Arrastra campos desde la biblioteca</p>
          </div>
        ) : (
          <>
            <div className={cn("flex flex-wrap -mx-2", device === 'mobile' && "flex-col")}>
              {fields
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(field => renderField(field))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="w-full sm:w-auto"
                style={{
                  background: `linear-gradient(135deg, ${event.primaryColor}, ${event.secondaryColor})`,
                }}
              >
                {type === 'user' ? 'Registrarse' : 'Enviar Inscripción'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
