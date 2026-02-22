import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { db, Event, FormField } from '@/lib/database';
import { ImageUploader } from '@/components/ImageUploader';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, ArrowLeft, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import { processAndSanitizeHtml, prepareHtmlForIframe, extractBodyContent } from '@/lib/htmlProcessor';

export default function EventLanding() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [macro, setMacro] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (eventId) {
      const ev = db.events.getById(eventId);
      if (ev) {
        setEvent(ev);
        const me = db.macroEvents.getById(ev.macroEventId);
        if (me) setMacro(me);
      }
    }
  }, [eventId]);

  // Handle internal links clicked inside HTML content
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && (target as HTMLAnchorElement).hasAttribute('data-internal')) {
        e.preventDefault();
        const href = (target as HTMLAnchorElement).href;
        navigate(href);
      }
    };

    document.addEventListener('click', handleLinkClick as EventListener);
    return () => document.removeEventListener('click', handleLinkClick as EventListener);
  }, [navigate]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const requiredFields = event.formFields?.filter(f => f.isRequired) || [];
    const missingFields = requiredFields.filter(f => !formValues[f.id]);

    if (missingFields.length > 0) {
      toast.error(`Por favor completa los campos requeridos: ${missingFields.map(f => f.label).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Extract email and name from form data if available
    const emailField = event.formFields?.find(f => f.fieldType === 'email')?.id;
    const nameField = event.formFields?.find(f => f.fieldType === 'text')?.id;
    
    try {
      // Save registration to database
      db.eventRegistrations.create({
        eventId: eventId!,
        userId: localStorage.getItem('currentUserId'),
        formData: formValues,
        email: emailField ? formValues[emailField] : undefined,
        firstName: nameField ? formValues[nameField] : undefined,
        status: 'registered',
      });
      
      setFormValues({});
      setIsSubmitting(false);
    } catch (error) {
      toast.error('Error al guardar la inscripción');
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.id,
      placeholder: field.placeholder || '',
      required: field.isRequired,
    };

    switch (field.fieldType) {
      case 'heading':
        return (
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">{field.label}</h3>
        );
      case 'separator':
        return <hr className="border-border" />;
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              {...baseProps}
              type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              {...baseProps}
              type="number"
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              {...baseProps}
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={4}
            />
          </div>
        );
      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              {...baseProps}
              type="date"
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={formValues[field.id] || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formValues[field.id] || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
            </Label>
            <RadioGroup
              value={formValues[field.id] || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              {field.options?.map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                  <Label htmlFor={`${field.id}-${opt}`}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  const resolvedFields: FormField[] = (event.formFields && event.formFields.length > 0)
    ? event.formFields
    : (macro && (macro.registrationFields || macro.formFields) ? (macro.registrationFields || macro.formFields) : []);
  const sortedFields = [...(resolvedFields || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  const renderProfileImagePlaceholder = () => {
    const imgField = sortedFields.find(f => f.fieldType === 'image' || f.fieldType === 'file' || f.id === 'profilePhoto');
    if (!imgField) return null;
    const preview = formValues[imgField.id] || '';

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormValues(prev => ({ ...prev, [imgField.id]: result }));
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="flex justify-center mb-4">
        <input 
          ref={imageInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handlePhotoChange} 
        />
        <div
          onClick={() => imageInputRef.current?.click()}
          className="h-28 w-28 rounded-full border-2 border-dashed flex items-center justify-center text-muted-foreground bg-white overflow-hidden cursor-pointer hover:border-primary"
        >
          {preview ? (
            <img src={preview} className="h-full w-full object-cover" alt="Preview" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M6.5 20a6.5 6.5 0 0111 0"/></svg>
          )}
        </div>
      </div>
    );
  };

  // Prepare macro/html content for rendering (avoid IIFE inside JSX)
  const rawMacroContent = (macro && macro.content) ? macro.content : '';
  const macroIsFullDocument = /<!doctype|<html|<head|<body/i.test(rawMacroContent);
  // Extract body content if full document, then sanitize and process links
  const extractedContent = macroIsFullDocument ? extractBodyContent(rawMacroContent) : rawMacroContent;
  const macroContentHtml = processAndSanitizeHtml(extractedContent);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: event.backgroundColor || '#f0f9ff' }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
              style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.secondaryColor})` }}
            >
              <Beaker className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">SciEvent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: event.primaryColor }} className="text-white hover:opacity-90">
                  Registrarse
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-5xl max-h-[100vh] overflow-auto sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>Formulario de Inscripción</DialogTitle>
                  <DialogDescription className="mb-2">Completa los campos para inscribirte en {event.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderProfileImagePlaceholder()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedFields.map((field) => (
                      <div
                        key={field.id}
                        className={field.width === 'full' || field.fieldType === 'heading' || field.fieldType === 'separator' ? 'md:col-span-2' : ''}
                      >
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      style={{ backgroundColor: event.primaryColor }}
                      className="text-white hover:opacity-90"
                    >
                      {isSubmitting ? 'Procesando...' : 'Completar Inscripción'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative pt-16">
        <div className="relative h-80 overflow-hidden">
          <img
            src={event.backgroundImageUrl || event.bannerImageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${event.primaryColor}dd, ${event.primaryColor}55 50%, transparent)`,
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto">
              <Badge
                className="mb-4"
                style={{ backgroundColor: event.secondaryColor }}
              >
                {event.isActive ? 'Inscripciones Abiertas' : 'Próximamente'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 max-w-3xl">
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-6 text-white/90">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {new Date(event.startDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                  })} - {new Date(event.endDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {db.abstracts.getByEvent(event.id).length} trabajos recibidos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-gradient-to-b from-background to-secondary/5">
        <div className="w-full">
          <div className="container mx-auto px-4 mb-4">
            <h2 className="text-lg font-semibold">{event.name}</h2>
            <p className="text-sm text-muted-foreground">{event.isActive ? 'Inscripciones abiertas' : 'Próximamente'}</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
            {/* Event Info - Full width content */}
            <div className="lg:col-span-2 space-y-6 transition-all">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle style={{ color: event.primaryColor }}>Sobre el Evento</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Prefer macro content when available (admin may paste full HTML) */}
                  {macroContentHtml ? (
                    <div 
                      className="w-full max-w-none p-8 overflow-y-auto bg-white"
                      style={{
                        maxHeight: '80vh',
                        backgroundColor: '#fafafa',
                        fontSize: '16px',
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{ __html: macroContentHtml }}
                    />
                  ) : (
                    <div 
                      className="max-w-none p-8 bg-white overflow-y-auto" 
                      style={{ maxHeight: '80vh', backgroundColor: '#fafafa', fontSize: '16px', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ __html: event.description || '' }} 
                    />
                  )}
                </CardContent>
              </Card>

              {/* Registration handled in modal */}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle style={{ color: event.primaryColor }}>Fechas Importantes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Inicio del evento</span>
                      <span className="font-medium">
                        {new Date(event.startDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Fin del evento</span>
                      <span className="font-medium">
                        {new Date(event.endDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  style={{
                    background: `linear-gradient(135deg, ${event.primaryColor}, ${event.secondaryColor})`,
                  }}
                >
                  <CardContent className="py-6 text-center text-white">
                    <h3 className="text-xl font-bold mb-2">¿Necesitas ayuda?</h3>
                    <p className="text-white/80 text-sm mb-4">Contáctanos si tienes alguna duda</p>
                    <Button variant="secondary" asChild>
                      <a href="mailto:info@scievent.com">Contactar</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-background/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 SciEvent. Sistema de Gestión de Eventos Científicos.</p>
        </div>
      </footer>
    </div>
  );
}
