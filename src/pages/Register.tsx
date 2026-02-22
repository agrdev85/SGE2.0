import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Beaker, Loader2, ArrowRight, ArrowLeft, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { db, MacroEvent } from '@/lib/database';

// Default field definitions for the registration form
const defaultRegistrationFields = [
  { id: 'name', label: 'Nombre(s) y Apellidos', type: 'text', required: true, enabled: true },
  { id: 'idDocument', label: 'Carné de Identidad / Pasaporte', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
  { id: 'phone', label: 'Teléfono', type: 'tel', required: false, enabled: true },
  { id: 'country', label: 'País', type: 'select', required: true, enabled: true },
  { id: 'affiliation', label: 'Afiliación', type: 'select', required: true, enabled: true },
  { id: 'affiliationType', label: 'Tipo de Afiliación', type: 'select', required: true, enabled: true },
  { id: 'economicSector', label: 'Sector Económico', type: 'select', required: true, enabled: true },
  { id: 'participationType', label: 'Tipo de Participación', type: 'select', required: true, enabled: true },
  { id: 'scientificLevel', label: 'Nivel Científico', type: 'select', required: false, enabled: true },
  { id: 'educationalLevel', label: 'Nivel Educacional', type: 'select', required: true, enabled: true },
  { id: 'gender', label: 'Género', type: 'radio', required: true, enabled: true },
  { id: 'profilePhoto', label: 'Foto de Perfil', type: 'file', required: false, enabled: true },
];

const countries = [
  'Cuba', 'México', 'Argentina', 'España', 'Colombia', 'Chile', 'Perú', 'Venezuela', 'Brasil', 'Estados Unidos',
  'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay', 'Costa Rica', 'Panamá', 'Guatemala', 'Honduras', 'El Salvador',
  'Nicaragua', 'República Dominicana', 'Puerto Rico', 'Canadá', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Reino Unido'
];

const affiliations = [
  'Universidad', 'Centro de Investigación', 'Hospital', 'Empresa Privada', 'Gobierno', 'ONG',
  'Institución Educativa', 'Laboratorio', 'Fundación', 'Organismo Internacional', 'Otro'
];

const affiliationTypes = [
  'Entidad Presupuestada', 'Empresa Estatal', 'Empresa Mixta', 'Empresa Privada',
  'Cooperativa', 'Organismo Internacional', 'ONG', 'Institución Académica', 'Centro de Investigación', 'Otro'
];

const economicSectors = [
  'Educación', 'Salud', 'Tecnología', 'Agricultura', 'Industria', 'Comercio',
  'Turismo', 'Construcción', 'Transporte', 'Telecomunicaciones', 'Energía', 'Finanzas', 'Servicios', 'Otro'
];

const participationTypes = ['Ponente', 'Coautor', 'Asistente', 'Organizador', 'Patrocinador', 'Invitado Especial', 'Otro'];

const scientificLevels = [
  'Estudiante de Pregrado', 'Estudiante de Posgrado', 'Especialista', 'Máster',
  'Doctor', 'Investigador Titular', 'Profesor Titular', 'Académico', 'Otro'
];

const educationalLevels = ['Técnico Medio', 'Técnico Superior', 'Universitario', 'Posgrado', 'Máster', 'Doctor', 'Postdoctorado'];

const selectOptionsMap: Record<string, string[]> = {
  country: countries,
  affiliation: affiliations,
  affiliationType: affiliationTypes,
  economicSector: economicSectors,
  participationType: participationTypes,
  scientificLevel: scientificLevels,
  educationalLevel: educationalLevels,
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const macroEventId = searchParams.get('event');
  const [macroEvent, setMacroEvent] = useState<MacroEvent | null>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', idDocument: '',
    country: '', affiliation: '', affiliationType: '', economicSector: '',
    participationType: '', scientificLevel: '', educationalLevel: '', gender: 'Masculino',
    profilePhoto: null as File | null,
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (macroEventId) {
      const me = db.macroEvents.getById(macroEventId);
      if (me) setMacroEvent(me);
    }
  }, [macroEventId]);

  // Get registration fields from macro event config or use defaults
  const registrationFields = (macroEvent as any)?.registrationFields || defaultRegistrationFields;
  const enabledFields = registrationFields.filter((f: any) => f.enabled);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        name: formData.name, email: formData.email, role: 'USER',
        country: formData.country, affiliation: formData.affiliation,
        idDocument: formData.idDocument, affiliationType: formData.affiliationType,
        economicSector: formData.economicSector, participationType: formData.participationType,
        scientificLevel: formData.scientificLevel, educationalLevel: formData.educationalLevel,
        gender: formData.gender, avatar: photoPreview,
      } as any);
      navigate('/dashboard');
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const renderField = (field: any) => {
    const isRequired = field.required;

    if (field.id === 'profilePhoto') {
      return (
        <div key={field.id} className="flex flex-col items-center space-y-3 pb-5 border-b">
          <Label className="text-base font-semibold text-foreground">Foto de Perfil</Label>
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-primary overflow-hidden bg-muted flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          </div>
          <Label htmlFor="photo" className="cursor-pointer">
            <div className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Upload className="h-4 w-4" />Seleccionar Archivo
            </div>
            <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </Label>
        </div>
      );
    }

    if (field.id === 'gender') {
      return (
        <div key={field.id} className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Género {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <RadioGroup value={formData.gender} onValueChange={v => updateForm('gender', v)} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Masculino" id="masculino" className="border-primary text-primary" />
              <Label htmlFor="masculino" className="cursor-pointer font-normal">Masculino</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Femenino" id="femenino" className="border-primary text-primary" />
              <Label htmlFor="femenino" className="cursor-pointer font-normal">Femenino</Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    if (field.type === 'select' && selectOptionsMap[field.id]) {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {field.label} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Select value={(formData as any)[field.id] || ''} onValueChange={v => updateForm(field.id, v)} required={isRequired}>
            <SelectTrigger className="border-border focus:border-primary focus:ring-primary">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {selectOptionsMap[field.id].map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
          {field.label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={field.id}
          type={field.type || 'text'}
          value={(formData as any)[field.id] || ''}
          onChange={e => updateForm(field.id, e.target.value)}
          required={isRequired}
          className="border-border focus:border-primary focus:ring-primary"
        />
      </div>
    );
  };

  // Group fields into pairs for grid layout (except photo and gender which are full-width)
  const fullWidthIds = ['profilePhoto', 'gender'];
  const gridFields: any[][] = [];
  let row: any[] = [];
  enabledFields.forEach((f: any) => {
    if (fullWidthIds.includes(f.id)) {
      if (row.length > 0) { gridFields.push(row); row = []; }
      gridFields.push([f]);
    } else {
      row.push(f);
      if (row.length === 2) { gridFields.push(row); row = []; }
    }
  });
  if (row.length > 0) gridFields.push(row);

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.7), hsl(var(--info, var(--primary)) / 0.8))' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground animate-fade-in">
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-lg mb-4">
              <Beaker className="h-10 w-10 text-accent-foreground" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">
              {macroEvent ? `Inscripción — ${macroEvent.name}` : 'Crear Nueva Cuenta'}
            </h2>
            <div className="h-1 w-32 bg-accent mx-auto mb-6"></div>
          </div>
          <p className="text-lg opacity-90 mb-8">
            {macroEvent
              ? `Completa tus datos para inscribirte en ${macroEvent.acronym}.`
              : 'Regístrate para participar en eventos científicos, enviar tus investigaciones y conectar con otros profesionales.'}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { title: 'Envía Resúmenes', desc: 'Presenta tus investigaciones' },
              { title: 'Revisión por Pares', desc: 'Feedback de expertos' },
              { title: 'Networking', desc: 'Conecta con colegas' },
              { title: 'Certificados', desc: 'Reconocimiento oficial' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-left border border-white/20">
                <p className="font-semibold text-accent">{item.title}</p>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl animate-slide-up my-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 border-b-2 border-primary">
              <CardTitle className="text-3xl font-display text-center text-foreground">
                {macroEvent ? 'Formulario de Inscripción' : 'Crear Nueva Cuenta'}
              </CardTitle>
              <CardDescription className="text-center">
                {macroEvent ? macroEvent.name : 'Completa tus datos para registrarte'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {gridFields.map((row, idx) => {
                  if (row.length === 1 && fullWidthIds.includes(row[0].id)) {
                    return renderField(row[0]);
                  }
                  return (
                    <div key={idx} className={`grid grid-cols-1 ${row.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
                      {row.map((f: any) => renderField(f))}
                    </div>
                  );
                })}

                {/* Password fields (always shown) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Contraseña <span className="text-destructive">*</span>
                    </Label>
                    <Input id="password" type="password" value={formData.password}
                      onChange={e => updateForm('password', e.target.value)} required
                      className="border-border focus:border-primary focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirmar contraseña <span className="text-destructive">*</span>
                    </Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword}
                      onChange={e => updateForm('confirmPassword', e.target.value)} required
                      className="border-border focus:border-primary focus:ring-primary" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full text-lg py-6 font-bold" variant="hero" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        REGÍSTRESE
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Inicia Sesión
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
