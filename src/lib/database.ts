// Database simulation (localStorage-based persistence)
// Simulates SQLite/backend database with full CRUD operations

import { toast } from "sonner";

export const STORAGE_PREFIX = 'sge_';

export function broadcastDataChange(collection: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}last_change_${collection}`, Date.now().toString());
    window.dispatchEvent(new CustomEvent('sge-data-change', { detail: { collection } }));
  }
}

// Types
export type UserRole = 'USER' | 'REVIEWER' | 'COMMITTEE' | 'SUPERADMIN' | 'ADMIN_RECEPTIVO' | 'ADMIN_EMPRESA' | 'COORDINADOR_HOTEL' | 'LECTOR_RECEPTIVO' | 'LECTOR_EMPRESA';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  country: string;
  affiliation: string;
  createdAt: string;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  idDocument?: string;
  affiliationType?: string;
  economicSector?: string;
  participationType?: string;
  scientificLevel?: string;
  educationalLevel?: string;
  gender?: string;
  specialization?: string;
  reviewerThematics?: string[];
  isParticipant?: boolean;
  // Isolation fields
  receptivoId?: string;
  empresaId?: string;
  hotelId?: string;
}

// ===== NOMENCLADOR TYPES =====

export interface NomReceptivo {
  id: string;
  siglas: string;
  nombre: string;
  paisId?: string;
  contactoEmail: string;
  contactoTelefono: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NomEmpresa {
  id: string;
  receptivoId: string;
  codigo: string;
  nombre: string;
  nitRfc: string;
  contactoPrincipal: string;
  contactoEmail: string;
  contactoTelefono: string;
  direccion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NomTipoParticipacion {
  id: string;
  nombre: string;
  descripcion: string;
  requierePago: boolean;
  apareceEnListadoPublico: boolean;
  activo: boolean;
}

export interface NomTipoTransporte {
  id: string;
  nombre: string;
  descripcion: string;
  capacidadMin: number;
  capacidadMax: number;
  requiereChofer: boolean;
  requiereLicenciaEspecial: boolean;
  costoPorPersona: boolean;
  activo: boolean;
}

export interface NomHotel {
  id: string;
  nombre: string;
  cadenaHotelera: string;
  categoriaEstrellas: number;
  ciudad: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NomTipoHabitacion {
  id: string;
  nombre: string;
  descripcion: string;
  capacidadMaxPersonas: number;
  activo: boolean;
}

export interface HotelTipoHabitacion {
  id: string;
  hotelId: string;
  tipoHabitacionId: string;
  precioConDesayuno: number;
  precioConTodoIncluido: number;
  activo: boolean;
}

export interface EventoHotel {
  id: string;
  eventoId: string; // macroEventId
  hotelId: string;
  fechaCheckin: string;
  fechaCheckout: string;
  precioOverride?: Record<string, { conDesayuno: number; todoIncluido: number }>;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  impersonatedBy?: string;
}

// Macro Event - Container for simple events
export interface MacroEvent {
  id: string;
  name: string;
  acronym: string; // Siglas (unique)
  description: string;
  startDate: string; // datetime
  endDate: string; // datetime
  logoUrl?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  content?: string; // HTML content for the event
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  registrationFields?: FormField[];
  receptivoId?: string; // FK to NomReceptivo - data isolation
  empresaId?: string; // FK to NomEmpresa - data isolation
  urlEvento?: string; // URL pública del evento
  modoCargaTrabajos?: 'TEMATICA' | 'SUBEVENTO'; // Modo de carga de trabajos
  tituloPublico?: string;
  contenidoHtml?: string;
  monedaPrincipal?: Moneda;
  tasasCambio?: TasasCambio;
  estadoConfiguracion?: EstadoConfiguracionEvento;
  pasoActual?: number;
  programaSocial?: string[];
  isActive: boolean;
  createdAt: string;
}

// Simple Event - Concrete activity linked to a macro event
export interface Event {
  id: string;
  name: string; // Name in Spanish
  nameEn: string; // Name in English
  description: string;
  macroEventId: string; // Required association
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  // Legacy fields kept for compatibility
  startDate: string;
  endDate: string;
  bannerImageUrl: string;
  backgroundImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  formFields?: FormField[];
  userFormFields?: FormField[];
}

// Session - Time occurrence of a simple event
export interface EventSession {
  id: string;
  eventId: string; // Simple event ID
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

// Attendance per session
export interface SessionAttendance {
  id: string;
  sessionId: string;
  eventId: string;
  userId: string;
  attended: boolean;
  markedAt: string;
}

export interface FormField {
  id: string;
  eventId: string;
  fieldType: FieldType;
  label: string;
  isRequired: boolean;
  orderIndex: number;
  options?: string[];
  placeholder?: string;
  width?: 'full' | 'half';
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'file' 
  | 'image'
  | 'separator'
  | 'heading';

export type AbstractStatus = 'EN_PROCESO' | 'APROBADO' | 'APROBADO_CON_CAMBIOS' | 'RECHAZADO';

export interface Author {
  id: string;
  name: string;
  email?: string;
  affiliation?: string;
  isMainAuthor: boolean;
}

export interface CommitteeMember {
  id: string;
  userId: string;
  eventId: string;
  role: 'COORDINADOR' | 'COORDINADOR_CIENTIFICO' | 'RESPONSABLE_ASIGNACIONES' | 'MIEMBRO';
  thematic?: string; // Temática asignada si es revisor
  assignedAt: string;
}

export interface Thematic {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  duration: number; // Duración en minutos para ponencias de esta temática
  createdAt: string;
}

// ===== NEW TYPES FOR WIZARD & SALONES =====

export type Moneda = 'CUP' | 'USD' | 'EUR';

export type EstadoConfiguracionEvento = 'BORRADOR' | 'CONFIGURACION' | 'PUBLICADO';

export interface TasasCambio {
  USD: number;
  EUR: number;
}

// Salon - Conference rooms per hotel (renombrado de HostSalon)
export interface Salon {
  id: string;
  hotelId: string;
  codigo: string;
  nombre: string;
  ubicacion: string;
  capacidadMaxima: number;
  estado: 'ACTIVO' | 'INACTIVO';
  imagenes: string[]; // Array de imágenes en base64
  createdAt: string;
  updatedAt: string;
}

// SubEvento - Antes llamado Event Simple
export interface SubEvento {
  id: string;
  eventoId: string; // FK a MacroEvent/Evento
  nombre: string;
  nombreEn?: string;
  tipo: 'SIMPOSIO' | 'CURSO' | 'WORKSHOP' | 'PONENCIA';
  descripcion: string;
  tematicaIds: string[]; // Array de IDs de temáticas - una temática solo puede estar en un subevento
  salonId?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  capacidad: number;
  precio: {
    CUP: number;
    moneda: number;
    monedaSeleccionada: Moneda;
  };
  isActive: boolean;
  createdAt: string;
}

// ActividadSocial - Excursiones y actividades del programa social
export interface ActividadSocial {
  id: string;
  eventoId: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  puntoEncuentro: string;
  horaEncuentro: string;
  destino: string;
  direccionExacta: string;
  esGratuita: boolean;
  costo: {
    CUP: number;
    moneda: number;
    monedaSeleccionada: Moneda;
  };
  cupoMaximo: number;
  cupoMinimo: number;
  fechaLimiteReserva: string;
  requiereTransporte: boolean;
  tipoVehiculo?: string;
  guiaIncluido: boolean;
  idiomaGuia?: string[];
  imagenes: string[];
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
}

// ReservaActividadSocial - Reservas de actividades sociales
export interface ReservaActividadSocial {
  id: string;
  actividadId: string;
  usuarioId: string;
  estadoPago: 'COMPLETADO' | 'PENDIENTE' | 'PARCIAL';
  montoPagado: number;
  fechaReserva: string;
  fechaPago?: string;
}

// EventoHotelHabitacion - Precios de habitación por evento
export interface EventoHotelHabitacion {
  id: string;
  eventoHotelId: string;
  tipoHabitacionId: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: Moneda;
  cupo: number;
}

// EventoSalon - Salones asignados a un evento
export interface EventoSalon {
  id: string;
  eventoId: string;
  salonId: string;
  disponible: boolean;
}

// EventoTipoParticipacion - Tipos de participación configurados por evento
export interface EventoTipoParticipacion {
  id: string;
  eventoId: string;
  tipoParticipacionId: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: Moneda;
  capacidad: number;
  apareceEnListadoPublico: boolean;
}

// RutaTransporte - Rutas de transporte configuradas
export interface RutaTransporte {
  id: string;
  eventoId: string;
  nombre: string;
  origen: string;
  destino: string;
  tipoVehiculoId: string;
  precio: {
    CUP: number;
    moneda: number;
    monedaSeleccionada: Moneda;
  };
  activo: boolean;
  createdAt: string;
}

// ReservaTransporte - Reservas de transporte
export interface ReservaTransporte {
  id: string;
  rutaId: string;
  usuarioId: string;
  fecha: string;
  cantidadPersonas: number;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';
  createdAt: string;
}

// Nomencladores específicos del evento (Paso 8 del wizard)
export type TipoNomencladorEvento = 'TEMATICA' | 'AREA_TEMATICA' | 'CATEGORIA_SESION' | 'TIPO_ACTIVIDAD';

export interface NomencladorEvento {
  id: string;
  eventoId: string;
  tipo: TipoNomencladorEvento;
  nombre: string;
  descripcion?: string;
  duracion?: number; // Para temáticas
  color?: string; // Para áreas temáticas
  tipoSesion?: 'CONFERENCIA' | 'SESION_ORAL' | 'POSTER' | 'PLENARIA' | 'BREAK' | 'WORKSHOP'; // Para categorías de sesión
  incluyeTransporte?: boolean; // Para tipos de actividad
  incluyeComida?: boolean; // Para tipos de actividad
  activo: boolean;
  createdAt: string;
}

// WizardProgress - Seguimiento del progreso del wizard
export interface WizardProgress {
  eventoId: string;
  pasoActual: number;
  pasosCompletados: number[];
  ultimaModificacion: string;
  modificadoPor: string;
}

// Extend MacroEvent with new fields
export interface MacroEvent {
  // ... existing fields
  monedaPrincipal?: Moneda;
  tasasCambio?: TasasCambio;
  estadoConfiguracion?: EstadoConfiguracionEvento;
  pasoActual?: number;
  programaSocial?: string[]; // IDs de actividades sociales
}

export interface WorkAssignment {
  id: string;
  abstractId: string;
  reviewerId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'pending' | 'in_review' | 'completed';
}

export interface ProgramSession {
  id: string;
  eventId: string;
  title: string;
  thematicId?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'CONFERENCIA' | 'SESION_ORAL' | 'POSTER' | 'PLENARIA' | 'BREAK';
  abstracts: string[]; // IDs de abstracts
  moderator?: string;
  orderIndex: number;
}

export interface DelegateProgram {
  id: string;
  userId: string;
  eventId: string;
  sessionIds: string[]; // IDs de sesiones seleccionadas
  createdAt: string;
  updatedAt: string;
}

export interface Abstract {
  id: string;
  userId: string; // Usuario que subió el trabajo
  eventId: string;
  title: string;
  summaryText: string;
  keywords: string[];
  authors: Author[]; // Lista de autores con autor principal
  mainAuthorId: string; // ID del autor principal
  status: AbstractStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  categoryType?: 'Ponencia' | 'Poster' | 'Conferencia';
  thematicId?: string; // Temática asignada
  assignedReviewerId?: string; // Árbitro específico asignado
  sessionId?: string; // Sesión del programa donde está incluido
}

export interface Review {
  id: string;
  abstractId: string;
  reviewerId: string;
  decision: 'APROBADO' | 'APROBADO_CON_CAMBIOS' | 'RECHAZADO';
  comment: string;
  score: number;
  reviewedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'abstract_status' | 'review_assigned' | 'event_update' | 'system' | 'email_sent';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface EmailTemplate {
  id: string;
  eventId: string;
  type: 'INSCRIPCION' | 'ASIGNACION_JURADO' | 'APROBADO' | 'RECHAZADO' | 'CERTIFICADO' | 'CUSTOM';
  subject: string;
  htmlBody: string;
  name?: string;
  autoTrigger?: 'ON_INSCRIPTION' | 'ON_ABSTRACT_SUBMIT' | 'ON_ABSTRACT_APPROVED' | 'ON_ABSTRACT_REJECTED' | 'ON_ABSTRACT_REVISION' | 'ON_CERTIFICATE_READY';
}

export interface SentEmail {
  id: string;
  eventId: string;
  templateId?: string;
  recipientId: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface JuryAssignment {
  id: string;
  eventId: string;
  reviewerId: string;
  abstractId: string;
  assignedAt: string;
  status: 'pending' | 'completed';
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string; // Optional, for guest registrations
  formData: Record<string, any>; // All form field values
  registeredAt: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: 'registered' | 'attended' | 'cancelled';
}

// CMS Types
export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML content
  excerpt?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  author: string; // User ID
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  template?: 'default' | 'landing' | 'full-width' | 'sidebar';
  orderIndex?: number;
}

export interface CMSArticle {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML content
  excerpt?: string;
  featuredImage?: string;
  categoryId?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  author: string; // User ID
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  views: number;
  featured: boolean;
}

export interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // For nested categories
  orderIndex: number;
  createdAt: string;
}

export interface CMSMenu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'sidebar' | 'custom';
  items: CMSMenuItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CMSMenuItem {
  id: string;
  label: string;
  type: 'page' | 'article' | 'category' | 'custom' | 'external';
  url?: string; // For custom/external links
  pageId?: string;
  articleId?: string;
  categoryId?: string;
  parentId?: string; // For nested menu items
  orderIndex: number;
  openInNewTab: boolean;
  cssClass?: string;
  icon?: string;
}

export interface CMSWidget {
  id: string;
  name: string;
  type: 'text' | 'html' | 'recent-articles' | 'categories' | 'search' | 'custom';
  content?: string;
  location: 'sidebar' | 'footer' | 'header';
  settings?: Record<string, any>;
  isActive: boolean;
  orderIndex: number;
}

export interface CMSSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerStyle: 'default' | 'centered' | 'minimal' | 'mega';
  footerStyle: 'default' | 'minimal' | 'extended';
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  seoSettings: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    googleAnalytics?: string;
    googleSiteVerification?: string;
  };
  maintenanceMode: boolean;
  allowRegistration: boolean;
  moderateComments: boolean;
}

// Database class
class Database {
  private getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(`db_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setCollection<T>(key: string, data: T[]): void {
    localStorage.setItem(`db_${key}`, JSON.stringify(data));
    broadcastDataChange(key);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Initialize with seed data if empty
  init() {
    if (this.getCollection<User>('users').length === 0) {
      this.seedData();
    }
    if (this.getCollection<NomReceptivo>('nomencladores_receptivos').length === 0) {
      this.seedNomencladores();
    }
  }

  private seedNomencladores() {
    const now = new Date().toISOString();

    // Seed Receptivos
    const receptivos: NomReceptivo[] = [
      { id: 'nr1', siglas: 'HAV', nombre: 'Havanatur', contactoEmail: 'eventos@havanatur.cu', contactoTelefono: '+53 7 8341234', activo: true, createdAt: now, updatedAt: now },
      { id: 'nr2', siglas: 'CUB', nombre: 'Cubatur', contactoEmail: 'eventos@cubatur.cu', contactoTelefono: '+53 7 8345678', activo: true, createdAt: now, updatedAt: now },
      { id: 'nr3', siglas: 'GAV', nombre: 'Gaviota Tours', contactoEmail: 'info@gaviota.cu', contactoTelefono: '+53 7 8349999', activo: true, createdAt: now, updatedAt: now },
    ];
    this.setCollection('nomencladores_receptivos', receptivos);

    // Seed Empresas
    const empresas: NomEmpresa[] = [
      { id: 'ne1', receptivoId: 'nr1', codigo: 'HAV-001', nombre: 'Havanatur Sucursal Varadero', nitRfc: 'CU1234567', contactoPrincipal: 'Carlos Pérez', contactoEmail: 'varadero@havanatur.cu', contactoTelefono: '+53 45 123456', direccion: 'Varadero, Cuba', activo: true, createdAt: now, updatedAt: now },
      { id: 'ne2', receptivoId: 'nr1', codigo: 'HAV-002', nombre: 'Havanatur Convenciones', nitRfc: 'CU1234568', contactoPrincipal: 'Ana López', contactoEmail: 'conv@havanatur.cu', contactoTelefono: '+53 7 8341235', direccion: 'La Habana, Cuba', activo: true, createdAt: now, updatedAt: now },
      { id: 'ne3', receptivoId: 'nr2', codigo: 'CUB-001', nombre: 'Cubatur Events', nitRfc: 'CU2345678', contactoPrincipal: 'María Rodríguez', contactoEmail: 'events@cubatur.cu', contactoTelefono: '+53 7 8345679', direccion: 'La Habana, Cuba', activo: true, createdAt: now, updatedAt: now },
    ];
    this.setCollection('nomencladores_empresas', empresas);

    // Seed Tipos de Participación
    const tiposParticipacion: NomTipoParticipacion[] = [
      { id: 'tp1', nombre: 'ASISTENTE', descripcion: 'Participante regular del evento', requierePago: true, apareceEnListadoPublico: false, activo: true },
      { id: 'tp2', nombre: 'PONENTE', descripcion: 'Presenta trabajo oral', requierePago: false, apareceEnListadoPublico: true, activo: true },
      { id: 'tp3', nombre: 'POSTER', descripcion: 'Presenta póster científico', requierePago: true, apareceEnListadoPublico: true, activo: true },
      { id: 'tp4', nombre: 'INVITADO', descripcion: 'Invitado especial, sin pago', requierePago: false, apareceEnListadoPublico: true, activo: true },
      { id: 'tp5', nombre: 'ORGANIZADOR', descripcion: 'Miembro del comité organizador', requierePago: false, apareceEnListadoPublico: false, activo: true },
    ];
    this.setCollection('nomencladores_tiposParticipacion', tiposParticipacion);

    // Seed Tipos de Transporte
    const tiposTransporte: NomTipoTransporte[] = [
      { id: 'tt1', nombre: 'Autobús', descripcion: 'Transporte colectivo grande', capacidadMin: 30, capacidadMax: 55, requiereChofer: true, requiereLicenciaEspecial: true, costoPorPersona: true, activo: true },
      { id: 'tt2', nombre: 'Minivan', descripcion: 'Vehículo mediano', capacidadMin: 8, capacidadMax: 15, requiereChofer: true, requiereLicenciaEspecial: false, costoPorPersona: false, activo: true },
      { id: 'tt3', nombre: 'Taxi', descripcion: 'Vehículo individual', capacidadMin: 1, capacidadMax: 4, requiereChofer: true, requiereLicenciaEspecial: false, costoPorPersona: false, activo: true },
      { id: 'tt4', nombre: 'Transfer VIP', descripcion: 'Transporte ejecutivo', capacidadMin: 1, capacidadMax: 6, requiereChofer: true, requiereLicenciaEspecial: false, costoPorPersona: false, activo: true },
    ];
    this.setCollection('nomencladores_tiposTransporte', tiposTransporte);

    // Seed Hoteles
    const hoteles: NomHotel[] = [
      { id: 'nh1', nombre: 'Meliá Internacional Varadero', cadenaHotelera: 'Meliá Hotels', categoriaEstrellas: 5, ciudad: 'Varadero', direccion: 'Autopista Sur, Varadero', telefono: '+53 45 123456', email: 'eventos@meliavaradero.cu', activo: true, createdAt: now, updatedAt: now },
      { id: 'nh2', nombre: 'Hotel Nacional de Cuba', cadenaHotelera: 'Gran Caribe', categoriaEstrellas: 5, ciudad: 'La Habana', direccion: 'Calle O esquina 21, Vedado', telefono: '+53 7 8361564', email: 'eventos@hotelnacional.cu', activo: true, createdAt: now, updatedAt: now },
      { id: 'nh3', nombre: 'Iberostar Bella Vista', cadenaHotelera: 'Iberostar', categoriaEstrellas: 4, ciudad: 'Varadero', direccion: 'Carretera de las Américas', telefono: '+53 45 667890', email: 'eventos@iberostar.cu', activo: true, createdAt: now, updatedAt: now },
    ];
    this.setCollection('nomencladores_hoteles', hoteles);

    // Seed Tipos de Habitación
    const tiposHabitacion: NomTipoHabitacion[] = [
      { id: 'th1', nombre: 'Estándar', descripcion: 'Habitación estándar con cama doble', capacidadMaxPersonas: 2, activo: true },
      { id: 'th2', nombre: 'Suite', descripcion: 'Suite con sala y dormitorio separados', capacidadMaxPersonas: 3, activo: true },
      { id: 'th3', nombre: 'Doble', descripcion: 'Habitación con dos camas individuales', capacidadMaxPersonas: 2, activo: true },
      { id: 'th4', nombre: 'Triple', descripcion: 'Habitación para tres personas', capacidadMaxPersonas: 3, activo: true },
      { id: 'th5', nombre: 'Suite Premium', descripcion: 'Suite de lujo con vista al mar', capacidadMaxPersonas: 4, activo: true },
    ];
    this.setCollection('nomencladores_tiposHabitacion', tiposHabitacion);

    // Seed Hotel-TipoHabitacion relationships
    const hotelTiposHab: HotelTipoHabitacion[] = [
      { id: 'hth1', hotelId: 'nh1', tipoHabitacionId: 'th1', precioConDesayuno: 120, precioConTodoIncluido: 180, activo: true },
      { id: 'hth2', hotelId: 'nh1', tipoHabitacionId: 'th2', precioConDesayuno: 250, precioConTodoIncluido: 350, activo: true },
      { id: 'hth3', hotelId: 'nh1', tipoHabitacionId: 'th3', precioConDesayuno: 100, precioConTodoIncluido: 160, activo: true },
      { id: 'hth4', hotelId: 'nh2', tipoHabitacionId: 'th1', precioConDesayuno: 150, precioConTodoIncluido: 200, activo: true },
      { id: 'hth5', hotelId: 'nh2', tipoHabitacionId: 'th5', precioConDesayuno: 400, precioConTodoIncluido: 500, activo: true },
    ];
    this.setCollection('nomencladores_hotelTiposHabitacion', hotelTiposHab);

    // Seed Audit Log
    this.setCollection('auditLog', []);

    // Seed EventoHotel
    this.setCollection('nomencladores_eventoHotel', []);

    // Seed new collections
    this.setCollection('salones', [
      { id: 'sal1', hotelId: 'nh1', codigo: 'SAL-CONV-001', nombre: 'Salón de Convenciones', ubicacion: 'Piso 1', capacidadMaxima: 500, estado: 'ACTIVO', imagenes: [], createdAt: now, updatedAt: now },
      { id: 'sal2', hotelId: 'nh1', codigo: 'SAL-SEMI-001', nombre: 'Sala de Seminarios A', ubicacion: 'Piso 2', capacidadMaxima: 100, estado: 'ACTIVO', imagenes: [], createdAt: now, updatedAt: now },
      { id: 'sal3', hotelId: 'nh1', codigo: 'SAL-SEMI-002', nombre: 'Sala de Seminarios B', ubicacion: 'Piso 2', capacidadMaxima: 100, estado: 'ACTIVO', imagenes: [], createdAt: now, updatedAt: now },
      { id: 'sal4', hotelId: 'nh2', codigo: 'SAL-GRAN-001', nombre: 'Gran Salon', ubicacion: 'Piso Lobby', capacidadMaxima: 800, estado: 'ACTIVO', imagenes: [], createdAt: now, updatedAt: now },
      { id: 'sal5', hotelId: 'nh2', codigo: 'SAL-SALA-001', nombre: 'Salón de Recepciones', ubicacion: 'Piso 3', capacidadMaxima: 300, estado: 'ACTIVO', imagenes: [], createdAt: now, updatedAt: now },
    ]);

    this.setCollection('subEventos', []);
    this.setCollection('actividadesSociales', []);
    this.setCollection('reservasActividades', []);
    this.setCollection('eventoSalones', []);
    this.setCollection('eventoTiposParticipacion', []);
    this.setCollection('rutasTransporte', []);
    this.setCollection('nomencladoresEvento', []);
    this.setCollection('wizardProgress', []);

    // Ensure all demo users exist (in case of stale localStorage)
    const users = this.getCollection<User>('users');
    const requiredUsers = [
      { id: 'superadmin1', email: 'superadmin@example.com', name: 'SuperAdmin', role: 'SUPERADMIN' as UserRole, affiliation: 'Sistema' },
      { id: 'admin_rec1', email: 'admin@havanatur.cu', name: 'Admin Havanatur', role: 'ADMIN_RECEPTIVO' as UserRole, affiliation: 'Havanatur', receptivoId: 'nr1' },
      { id: 'admin_emp1', email: 'admin@havanatur-varadero.cu', name: 'Admin Havanatur Varadero', role: 'ADMIN_EMPRESA' as UserRole, affiliation: 'Havanatur Sucursal Varadero', receptivoId: 'nr1', empresaId: 'ne1' },
      { id: 'coord_hotel1', email: 'coordinador@meliavaradero.cu', name: 'Coord. Meliá Varadero', role: 'COORDINADOR_HOTEL' as UserRole, affiliation: 'Meliá Internacional', hotelId: 'nh1' },
      { id: 'lector_rec1', email: 'lector@cubatur.cu', name: 'Lector Cubatur', role: 'LECTOR_RECEPTIVO' as UserRole, affiliation: 'Cubatur', receptivoId: 'nr2' },
      { id: 'lector_emp1', email: 'lector@cubatur-events.cu', name: 'Lector Cubatur Events', role: 'LECTOR_EMPRESA' as UserRole, affiliation: 'Cubatur Events', receptivoId: 'nr2', empresaId: 'ne3' },
    ];
    let changed = false;
    for (const req of requiredUsers) {
      if (!users.some(u => u.email === req.email)) {
        users.push({ ...req, passwordHash: 'demo', country: 'Cuba', createdAt: '2024-01-01', isActive: true });
        changed = true;
      }
    }
    if (changed) this.setCollection('users', users);
  }

  private seedData() {
    // Seed Users
    const users: User[] = [
      {
        id: '1',
        name: 'Dr. María García',
        email: 'maria@example.com',
        passwordHash: 'demo',
        role: 'USER',
        country: 'Cuba',
        affiliation: 'Universidad de La Habana',
        createdAt: '2024-01-15',
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        specialization: 'Biotecnología',
      },
      {
        id: '2',
        name: 'Dr. Carlos Rodríguez',
        email: 'carlos@example.com',
        passwordHash: 'demo',
        role: 'REVIEWER',
        country: 'Cuba',
        affiliation: 'CIGB',
        createdAt: '2024-01-10',
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        specialization: 'Genética Molecular',
      },
      {
        id: '3',
        name: 'Dra. Ana Martínez',
        email: 'ana@example.com',
        passwordHash: 'demo',
        role: 'COMMITTEE',
        country: 'Cuba',
        affiliation: 'BioCubaFarma',
        createdAt: '2024-01-05',
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        specialization: 'Farmacología',
      },
      // ADMIN role removed - use SUPERADMIN instead
      {
        id: '5',
        name: 'Dr. Pedro López',
        email: 'pedro@example.com',
        passwordHash: 'demo',
        role: 'REVIEWER',
        country: 'México',
        affiliation: 'UNAM',
        createdAt: '2024-01-12',
        isActive: true,
        specialization: 'Bioinformática',
      },
      {
        id: '6',
        name: 'Dra. Laura Sánchez',
        email: 'laura@example.com',
        passwordHash: 'demo',
        role: 'REVIEWER',
        country: 'España',
        affiliation: 'CSIC',
        createdAt: '2024-01-14',
        isActive: true,
        specialization: 'Inmunología',
      },
      {
        id: 'superadmin1',
        name: 'SuperAdmin',
        email: 'superadmin@example.com',
        passwordHash: 'demo',
        role: 'SUPERADMIN',
        country: 'Cuba',
        affiliation: 'Sistema',
        createdAt: '2024-01-01',
        isActive: true,
      },
      {
        id: 'admin_rec1',
        name: 'Admin Havanatur',
        email: 'admin@havanatur.cu',
        passwordHash: 'demo',
        role: 'ADMIN_RECEPTIVO',
        country: 'Cuba',
        affiliation: 'Havanatur',
        createdAt: '2024-01-01',
        isActive: true,
        receptivoId: 'nr1',
      },
      {
        id: 'coord_hotel1',
        name: 'Coord. Meliá Varadero',
        email: 'coordinador@meliavaradero.cu',
        passwordHash: 'demo',
        role: 'COORDINADOR_HOTEL',
        country: 'Cuba',
        affiliation: 'Meliá Internacional',
        createdAt: '2024-01-01',
        isActive: true,
        hotelId: 'nh1',
      },
      {
        id: 'admin_emp1',
        name: 'Admin Havanatur Varadero',
        email: 'admin@havanatur-varadero.cu',
        passwordHash: 'demo',
        role: 'ADMIN_EMPRESA',
        country: 'Cuba',
        affiliation: 'Havanatur Sucursal Varadero',
        createdAt: '2024-01-01',
        isActive: true,
        receptivoId: 'nr1',
        empresaId: 'ne1',
      },
      {
        id: 'lector_rec1',
        name: 'Lector Cubatur',
        email: 'lector@cubatur.cu',
        passwordHash: 'demo',
        role: 'LECTOR_RECEPTIVO',
        country: 'Cuba',
        affiliation: 'Cubatur',
        createdAt: '2024-01-01',
        isActive: true,
        receptivoId: 'nr2',
      },
      {
        id: 'lector_emp1',
        name: 'Lector Cubatur Events',
        email: 'lector@cubatur-events.cu',
        passwordHash: 'demo',
        role: 'LECTOR_EMPRESA',
        country: 'Cuba',
        affiliation: 'Cubatur Events',
        createdAt: '2024-01-01',
        isActive: true,
        receptivoId: 'nr2',
        empresaId: 'ne3',
      },
    ];
    this.setCollection('users', users);

    // Seed Macro Events
    const macroEvents: MacroEvent[] = [
      {
        id: 'me1',
        name: 'Congreso Internacional de Biotecnología 2024',
        acronym: 'CIB2024',
        description: 'El macro evento más importante del sector biotecnológico en América Latina.',
        startDate: '2024-06-15T08:00',
        endDate: '2024-06-20T18:00',
        logoUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=200&fit=crop',
        isActive: true,
        createdAt: '2024-01-01',
      },
      {
        id: 'me2',
        name: 'Simposio de Nanociencias 2024',
        acronym: 'SN2024',
        description: 'Simposio internacional de nanociencias y nanotecnología.',
        startDate: '2024-09-10T08:00',
        endDate: '2024-09-12T18:00',
        isActive: true,
        createdAt: '2024-02-15',
      },
    ];
    this.setCollection('macroEvents', macroEvents);

    // Seed Events (Simple Events)
    const events: Event[] = [
      {
        id: '1',
        name: 'Taller de Terapia Génica',
        nameEn: 'Gene Therapy Workshop',
        description: 'El evento más importante del sector biotecnológico en América Latina.',
        macroEventId: 'me1',
        startDate: '2024-06-15',
        endDate: '2024-06-20',
        bannerImageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=400&fit=crop',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1920&h=1080&fit=crop',
        primaryColor: '#1e40af',
        secondaryColor: '#059669',
        backgroundColor: '#f0f9ff',
        isActive: true,
        createdBy: '4',
        createdAt: '2024-01-01',
        formFields: [
          { id: 'f1', eventId: '1', fieldType: 'text', label: 'Nombre Completo', isRequired: true, orderIndex: 0, width: 'full' },
          { id: 'f2', eventId: '1', fieldType: 'email', label: 'Correo Electrónico', isRequired: true, orderIndex: 1, width: 'half' },
          { id: 'f3', eventId: '1', fieldType: 'phone', label: 'Teléfono', isRequired: false, orderIndex: 2, width: 'half' },
          { id: 'f4', eventId: '1', fieldType: 'text', label: 'Institución', isRequired: true, orderIndex: 3, width: 'full' },
          { id: 'f5', eventId: '1', fieldType: 'select', label: 'País', isRequired: true, orderIndex: 4, options: ['Cuba', 'México', 'España', 'Argentina'], width: 'half' },
          { id: 'f6', eventId: '1', fieldType: 'select', label: 'Tipo de Participación', isRequired: true, orderIndex: 5, options: ['Ponente', 'Asistente', 'Poster'], width: 'half' },
        ],
      },
      {
        id: '2',
        name: 'Conferencia de Nanotecnología Aplicada',
        nameEn: 'Applied Nanotechnology Conference',
        description: 'Explorando las fronteras de la nanotecnología aplicada.',
        macroEventId: 'me2',
        startDate: '2024-09-10',
        endDate: '2024-09-12',
        bannerImageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&h=400&fit=crop',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1920&h=1080&fit=crop',
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        backgroundColor: '#fdf4ff',
        isActive: true,
        createdBy: '4',
        createdAt: '2024-02-15',
      },
    ];
    this.setCollection('events', events);

    // Seed Event Sessions
    const eventSessions: EventSession[] = [
      {
        id: 'es1',
        eventId: '1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '12:00',
        isActive: true,
        createdAt: '2024-01-01',
      },
      {
        id: 'es2',
        eventId: '1',
        date: '2024-06-16',
        startTime: '14:00',
        endTime: '17:00',
        isActive: true,
        createdAt: '2024-01-01',
      },
    ];
    this.setCollection('eventSessions', eventSessions);

    // Seed Abstracts
    const abstracts: Abstract[] = [
      {
        id: '1',
        userId: '1',
        eventId: '1',
        title: 'Nuevos avances en terapia génica para enfermedades raras',
        summaryText: 'Este trabajo presenta los últimos avances en el desarrollo de vectores virales para terapia génica.',
        keywords: ['terapia génica', 'vectores virales', 'enfermedades raras'],
        authors: [
          { id: 'a1', name: 'Dr. María García', email: 'maria@example.com', affiliation: 'Universidad de La Habana', isMainAuthor: true },
          { id: 'a2', name: 'Dr. Juan Pérez', email: 'juan@example.com', affiliation: 'CIGB', isMainAuthor: false },
        ],
        mainAuthorId: 'a1',
        status: 'EN_PROCESO',
        version: 1,
        createdAt: '2024-03-01',
        updatedAt: '2024-03-01',
      },
      {
        id: '2',
        userId: '1',
        eventId: '1',
        title: 'Desarrollo de vacunas de nueva generación contra COVID-19',
        summaryText: 'Presentamos el desarrollo de una vacuna basada en ARNm de tercera generación.',
        keywords: ['vacunas', 'ARNm', 'COVID-19'],
        authors: [
          { id: 'a3', name: 'Dr. María García', email: 'maria@example.com', affiliation: 'Universidad de La Habana', isMainAuthor: true },
          { id: 'a4', name: 'Dra. Laura Sánchez', email: 'laura@example.com', affiliation: 'CSIC', isMainAuthor: false },
        ],
        mainAuthorId: 'a3',
        status: 'APROBADO',
        version: 1,
        createdAt: '2024-02-15',
        updatedAt: '2024-02-28',
        categoryType: 'Ponencia',
        thematicId: 't2',
      },
      {
        id: '3',
        userId: '1',
        eventId: '1',
        title: 'Bioinformática aplicada al diseño de fármacos',
        summaryText: 'Utilizando técnicas de inteligencia artificial para acelerar el descubrimiento de nuevos fármacos.',
        keywords: ['bioinformática', 'IA', 'diseño de fármacos'],
        authors: [
          { id: 'a5', name: 'Dr. María García', email: 'maria@example.com', affiliation: 'Universidad de La Habana', isMainAuthor: true },
        ],
        mainAuthorId: 'a5',
        status: 'EN_PROCESO',
        version: 1,
        createdAt: '2024-02-20',
        updatedAt: '2024-02-20',
        thematicId: 't3',
      },
      {
        id: '4',
        userId: '1',
        eventId: '1',
        title: 'Nanotecnología en sistemas de liberación de fármacos',
        summaryText: 'Desarrollo de nanopartículas para la entrega dirigida de medicamentos.',
        keywords: ['nanotecnología', 'drug delivery', 'nanopartículas'],
        authors: [
          { id: 'a6', name: 'Dr. Pedro López', email: 'pedro@example.com', affiliation: 'UNAM', isMainAuthor: true },
          { id: 'a7', name: 'Dr. María García', email: 'maria@example.com', affiliation: 'Universidad de La Habana', isMainAuthor: false },
        ],
        mainAuthorId: 'a6',
        status: 'EN_PROCESO',
        version: 1,
        createdAt: '2024-02-25',
        updatedAt: '2024-02-25',
        thematicId: 't5',
      },
    ];
    this.setCollection('abstracts', abstracts);

    // Seed Reviews
    const reviews: Review[] = [
      {
        id: '1',
        abstractId: '2',
        reviewerId: '2',
        decision: 'APROBADO',
        comment: 'Excelente trabajo. La metodología es sólida.',
        score: 95,
        reviewedAt: '2024-02-25',
      },
    ];
    this.setCollection('reviews', reviews);

    // Seed Notifications
    const notifications: Notification[] = [
      {
        id: '1',
        userId: '1',
        type: 'abstract_status',
        title: 'Resumen Aprobado',
        message: 'Tu resumen "Desarrollo de vacunas..." ha sido aprobado.',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/abstracts',
      },
      {
        id: '2',
        userId: '2',
        type: 'review_assigned',
        title: 'Nuevos trabajos asignados',
        message: 'Se te han asignado 3 trabajos para revisar.',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/review',
      },
    ];
    this.setCollection('notifications', notifications);

    // Seed Email Templates
    const emailTemplates: EmailTemplate[] = [
      {
        id: '1',
        eventId: '1',
        type: 'INSCRIPCION',
        name: 'Confirmación de Inscripción',
        subject: 'Confirmación de inscripción - {{eventName}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 40px; text-align: center;">
              <img src="{{bannerImage}}" alt="{{eventName}}" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h1 style="color: {{primaryColor}};">¡Bienvenido, {{userName}}!</h1>
              <p>Tu inscripción al evento <strong>{{eventName}}</strong> ha sido confirmada.</p>
              <p><strong>Fecha:</strong> {{eventDate}}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{eventLink}}" style="background: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Ver Detalles del Evento</a>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: '2',
        eventId: '1',
        type: 'ASIGNACION_JURADO',
        name: 'Asignación de Trabajos',
        subject: 'Nuevos trabajos asignados para revisión - {{eventName}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 40px; text-align: center;">
              <h1 style="color: white;">{{eventName}}</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: {{primaryColor}};">Hola {{userName}},</h2>
              <p>Se te han asignado <strong>{{workCount}}</strong> trabajos para revisar.</p>
              <p>Por favor, completa las revisiones antes del <strong>{{deadline}}</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reviewLink}}" style="background: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Ir a Revisiones</a>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: '3',
        eventId: '1',
        type: 'APROBADO',
        name: 'Trabajo Aprobado',
        subject: '¡Felicidades! Tu trabajo ha sido aprobado - {{eventName}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 40px; text-align: center;">
              <h1 style="color: white;">🎉 ¡Felicidades!</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: {{primaryColor}};">Hola {{userName}},</h2>
              <p>Nos complace informarte que tu trabajo <strong>"{{abstractTitle}}"</strong> ha sido <span style="color: green; font-weight: bold;">APROBADO</span>.</p>
              <p><strong>Categoría:</strong> {{categoryType}}</p>
              <p>Pronto recibirás más información sobre la presentación.</p>
            </div>
          </div>
        `,
      },
    ];
    this.setCollection('emailTemplates', emailTemplates);

    // Seed Thematics
    const thematics: Thematic[] = [
      { id: 't1', eventId: '1', name: 'Biotecnología Molecular', description: 'Técnicas moleculares y genómica', duration: 20, createdAt: '2024-01-01' },
      { id: 't2', eventId: '1', name: 'Inmunología', description: 'Sistemas inmunológicos y vacunas', duration: 20, createdAt: '2024-01-01' },
      { id: 't3', eventId: '1', name: 'Bioinformática', description: 'Análisis computacional en biología', duration: 15, createdAt: '2024-01-01' },
      { id: 't4', eventId: '1', name: 'Farmacología', description: 'Desarrollo y diseño de fármacos', duration: 20, createdAt: '2024-01-01' },
      { id: 't5', eventId: '1', name: 'Nanotecnología', description: 'Aplicaciones nano en biotecnología', duration: 15, createdAt: '2024-01-01' },
    ];
    this.setCollection('thematics', thematics);

    // Seed Committee Members
    const committeeMembers: CommitteeMember[] = [
      { id: 'cm1', userId: '3', eventId: '1', role: 'COORDINADOR', assignedAt: '2024-01-01' },
      { id: 'cm2', userId: '2', eventId: '1', role: 'RESPONSABLE_ASIGNACIONES', thematic: 't2', assignedAt: '2024-01-02' },
      { id: 'cm3', userId: '5', eventId: '1', role: 'MIEMBRO', thematic: 't3', assignedAt: '2024-01-03' },
      { id: 'cm4', userId: '6', eventId: '1', role: 'MIEMBRO', thematic: 't2', assignedAt: '2024-01-04' },
    ];
    this.setCollection('committeeMembers', committeeMembers);
  }

  // USERS CRUD
  users = {
    getAll: (): User[] => this.getCollection<User>('users'),
    
    getById: (id: string): User | undefined => 
      this.getCollection<User>('users').find(u => u.id === id),
    
    getByEmail: (email: string): User | undefined => 
      this.getCollection<User>('users').find(u => u.email === email),
    
    getByRole: (role: User['role']): User[] => 
      this.getCollection<User>('users').filter(u => u.role === role),

    getReviewers: (): User[] => 
      this.getCollection<User>('users').filter(u => u.role === 'REVIEWER' && u.isActive),
    
    create: (data: Omit<User, 'id' | 'createdAt'>): User => {
      const users = this.getCollection<User>('users');
      const newUser: User = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      users.push(newUser);
      this.setCollection('users', users);
      return newUser;
    },
    
    update: (id: string, data: Partial<User>): User => {
      const users = this.getCollection<User>('users');
      const index = users.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Usuario no encontrado');
      users[index] = { ...users[index], ...data };
      this.setCollection('users', users);
      return users[index];
    },

    updatePassword: (id: string, newPassword: string): void => {
      const users = this.getCollection<User>('users');
      const index = users.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Usuario no encontrado');
      users[index].passwordHash = newPassword;
      this.setCollection('users', users);
    },
    
    delete: (id: string): void => {
      const users = this.getCollection<User>('users').filter(u => u.id !== id);
      this.setCollection('users', users);
    },
  };

  // MACRO EVENTS CRUD
  macroEvents = {
    getAll: (): MacroEvent[] => this.getCollection<MacroEvent>('macroEvents'),

    getById: (id: string): MacroEvent | undefined =>
      this.getCollection<MacroEvent>('macroEvents').find(me => me.id === id),

    getActive: (): MacroEvent[] =>
      this.getCollection<MacroEvent>('macroEvents').filter(me => me.isActive),

    create: (data: Omit<MacroEvent, 'id' | 'createdAt'>): MacroEvent => {
      const items = this.getCollection<MacroEvent>('macroEvents');
      // Check unique acronym
      if (items.some(me => me.acronym === data.acronym)) {
        throw new Error('Las siglas ya están en uso');
      }
      const item: MacroEvent = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      items.push(item);
      this.setCollection('macroEvents', items);
      return item;
    },

    update: (id: string, data: Partial<MacroEvent>): MacroEvent => {
      const items = this.getCollection<MacroEvent>('macroEvents');
      const index = items.findIndex(me => me.id === id);
      if (index === -1) throw new Error('Macro evento no encontrado');
      if (data.acronym) {
        const dup = items.find(me => me.acronym === data.acronym && me.id !== id);
        if (dup) throw new Error('Las siglas ya están en uso');
      }
      items[index] = { ...items[index], ...data };
      this.setCollection('macroEvents', items);
      return items[index];
    },

    delete: (id: string): void => {
      const me = this.macroEvents.getById(id);
      if (me && me.isActive) throw new Error('Solo se puede eliminar macro eventos inactivos');
      const items = this.getCollection<MacroEvent>('macroEvents').filter(me => me.id !== id);
      this.setCollection('macroEvents', items);
    },
  };

  // EVENT SESSIONS CRUD
  eventSessions = {
    getAll: (): EventSession[] => this.getCollection<EventSession>('eventSessions'),

    getByEvent: (eventId: string): EventSession[] =>
      this.getCollection<EventSession>('eventSessions')
        .filter(s => s.eventId === eventId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),

    getById: (id: string): EventSession | undefined =>
      this.getCollection<EventSession>('eventSessions').find(s => s.id === id),

    create: (data: Omit<EventSession, 'id' | 'createdAt'>): EventSession => {
      const items = this.getCollection<EventSession>('eventSessions');
      const item: EventSession = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      items.push(item);
      this.setCollection('eventSessions', items);
      return item;
    },

    update: (id: string, data: Partial<EventSession>): EventSession => {
      const items = this.getCollection<EventSession>('eventSessions');
      const index = items.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Sesión no encontrada');
      items[index] = { ...items[index], ...data };
      this.setCollection('eventSessions', items);
      return items[index];
    },

    delete: (id: string): void => {
      // Also delete associated attendance
      const attendances = this.getCollection<SessionAttendance>('sessionAttendance').filter(a => a.sessionId !== id);
      this.setCollection('sessionAttendance', attendances);
      const items = this.getCollection<EventSession>('eventSessions').filter(s => s.id !== id);
      this.setCollection('eventSessions', items);
    },
  };

  // SESSION ATTENDANCE CRUD
  sessionAttendance = {
    getBySession: (sessionId: string): SessionAttendance[] =>
      this.getCollection<SessionAttendance>('sessionAttendance').filter(a => a.sessionId === sessionId),

    markAttendance: (sessionId: string, eventId: string, userId: string, attended: boolean): SessionAttendance => {
      const items = this.getCollection<SessionAttendance>('sessionAttendance');
      const existing = items.findIndex(a => a.sessionId === sessionId && a.userId === userId);
      if (existing !== -1) {
        items[existing].attended = attended;
        items[existing].markedAt = new Date().toISOString();
        this.setCollection('sessionAttendance', items);
        return items[existing];
      }
      const item: SessionAttendance = {
        id: this.generateId(),
        sessionId,
        eventId,
        userId,
        attended,
        markedAt: new Date().toISOString(),
      };
      items.push(item);
      this.setCollection('sessionAttendance', items);
      return item;
    },
  };

  // EVENTS CRUD
  events = {
    getAll: (): Event[] => this.getCollection<Event>('events'),
    
    getById: (id: string): Event | undefined => 
      this.getCollection<Event>('events').find(e => e.id === id),
    
    getActive: (): Event[] => 
      this.getCollection<Event>('events').filter(e => e.isActive),
    
    create: (data: Omit<Event, 'id' | 'createdAt'>): Event => {
      const events = this.getCollection<Event>('events');
      const newEvent: Event = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      events.push(newEvent);
      this.setCollection('events', events);
      return newEvent;
    },
    
    update: (id: string, data: Partial<Event>): Event => {
      const events = this.getCollection<Event>('events');
      const index = events.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Evento no encontrado');
      events[index] = { ...events[index], ...data };
      this.setCollection('events', events);
      return events[index];
    },
    
    delete: (id: string): void => {
      const events = this.getCollection<Event>('events').filter(e => e.id !== id);
      this.setCollection('events', events);
    },

    updateFormFields: (eventId: string, fields: FormField[]): Event => {
      const events = this.getCollection<Event>('events');
      const index = events.findIndex(e => e.id === eventId);
      if (index === -1) throw new Error('Evento no encontrado');
      events[index].formFields = fields;
      this.setCollection('events', events);
      return events[index];
    },

    updateUserFormFields: (eventId: string, fields: FormField[]): Event => {
      const events = this.getCollection<Event>('events');
      const index = events.findIndex(e => e.id === eventId);
      if (index === -1) throw new Error('Evento no encontrado');
      events[index].userFormFields = fields;
      this.setCollection('events', events);
      return events[index];
    },
  };

  // ABSTRACTS CRUD
  abstracts = {
    getAll: (): Abstract[] => this.getCollection<Abstract>('abstracts'),
    
    getById: (id: string): Abstract | undefined => 
      this.getCollection<Abstract>('abstracts').find(a => a.id === id),
    
    getByUser: (userId: string): Abstract[] => 
      this.getCollection<Abstract>('abstracts').filter(a => a.userId === userId),
    
    getByEvent: (eventId: string): Abstract[] => 
      this.getCollection<Abstract>('abstracts').filter(a => a.eventId === eventId),
    
    getApproved: (eventId: string): Abstract[] => 
      this.getCollection<Abstract>('abstracts').filter(a => a.eventId === eventId && a.status === 'APROBADO'),
    
    getPending: (): Abstract[] => 
      this.getCollection<Abstract>('abstracts').filter(a => a.status === 'EN_PROCESO'),

    getPendingByEvent: (eventId: string): Abstract[] => 
      this.getCollection<Abstract>('abstracts').filter(a => a.eventId === eventId && a.status === 'EN_PROCESO'),
    
    create: (data: Omit<Abstract, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'status'>): Abstract => {
      const abstracts = this.getCollection<Abstract>('abstracts');
      const newAbstract: Abstract = {
        ...data,
        id: this.generateId(),
        status: 'EN_PROCESO',
        version: 1,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      abstracts.push(newAbstract);
      this.setCollection('abstracts', abstracts);
      return newAbstract;
    },
    
    update: (id: string, data: Partial<Abstract>): Abstract => {
      const abstracts = this.getCollection<Abstract>('abstracts');
      const index = abstracts.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Resumen no encontrado');
      abstracts[index] = { 
        ...abstracts[index], 
        ...data,
        updatedAt: new Date().toISOString().split('T')[0],
        version: abstracts[index].version + 1,
      };
      this.setCollection('abstracts', abstracts);
      return abstracts[index];
    },

    assignCategory: (id: string, categoryType: 'Ponencia' | 'Poster' | 'Conferencia'): Abstract => {
      return this.abstracts.update(id, { categoryType });
    },

    assignReviewers: (id: string, reviewerIds: string[]): Abstract => {
      return this.abstracts.update(id, { assignedReviewerId: reviewerIds[0] });
    },
  };

  // REVIEWS CRUD
  reviews = {
    getAll: (): Review[] => this.getCollection<Review>('reviews'),
    
    getByAbstract: (abstractId: string): Review[] => 
      this.getCollection<Review>('reviews').filter(r => r.abstractId === abstractId),
    
    getByReviewer: (reviewerId: string): Review[] => 
      this.getCollection<Review>('reviews').filter(r => r.reviewerId === reviewerId),

    getCountByReviewer: (reviewerId: string): number =>
      this.getCollection<Review>('reviews').filter(r => r.reviewerId === reviewerId).length,
    
    create: (data: Omit<Review, 'id' | 'reviewedAt'>): Review => {
      const reviews = this.getCollection<Review>('reviews');
      const newReview: Review = {
        ...data,
        id: this.generateId(),
        reviewedAt: new Date().toISOString().split('T')[0],
      };
      reviews.push(newReview);
      this.setCollection('reviews', reviews);
      
      // Update abstract status
      this.abstracts.update(data.abstractId, { status: data.decision });
      
      return newReview;
    },
  };

  // NOTIFICATIONS CRUD
  notifications = {
    getByUser: (userId: string): Notification[] => 
      this.getCollection<Notification>('notifications')
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    
    getUnread: (userId: string): Notification[] => 
      this.notifications.getByUser(userId).filter(n => !n.read),

    getUnreadCount: (userId: string): number =>
      this.notifications.getUnread(userId).length,
    
    create: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification => {
      const notifications = this.getCollection<Notification>('notifications');
      const newNotification: Notification = {
        ...data,
        id: this.generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifications.push(newNotification);
      this.setCollection('notifications', notifications);
      return newNotification;
    },
    
    markAsRead: (id: string): void => {
      const notifications = this.getCollection<Notification>('notifications');
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications[index].read = true;
        this.setCollection('notifications', notifications);
      }
    },
    
    markAllAsRead: (userId: string): void => {
      const notifications = this.getCollection<Notification>('notifications');
      notifications.forEach(n => {
        if (n.userId === userId) n.read = true;
      });
      this.setCollection('notifications', notifications);
    },

    delete: (id: string): void => {
      const notifications = this.getCollection<Notification>('notifications').filter(n => n.id !== id);
      this.setCollection('notifications', notifications);
    },
  };

  // EMAIL TEMPLATES
  emailTemplates = {
    getByEvent: (eventId: string): EmailTemplate[] => 
      this.getCollection<EmailTemplate>('emailTemplates').filter(t => t.eventId === eventId),

    getById: (id: string): EmailTemplate | undefined =>
      this.getCollection<EmailTemplate>('emailTemplates').find(t => t.id === id),
    
    create: (data: Omit<EmailTemplate, 'id'>): EmailTemplate => {
      const templates = this.getCollection<EmailTemplate>('emailTemplates');
      const newTemplate: EmailTemplate = {
        ...data,
        id: this.generateId(),
      };
      templates.push(newTemplate);
      this.setCollection('emailTemplates', templates);
      return newTemplate;
    },

    update: (id: string, data: Partial<EmailTemplate>): EmailTemplate => {
      const templates = this.getCollection<EmailTemplate>('emailTemplates');
      const index = templates.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Plantilla no encontrada');
      templates[index] = { ...templates[index], ...data };
      this.setCollection('emailTemplates', templates);
      return templates[index];
    },

    delete: (id: string): void => {
      const templates = this.getCollection<EmailTemplate>('emailTemplates').filter(t => t.id !== id);
      this.setCollection('emailTemplates', templates);
    },
  };

  // SENT EMAILS
  sentEmails = {
    getByEvent: (eventId: string): SentEmail[] =>
      this.getCollection<SentEmail>('sentEmails').filter(e => e.eventId === eventId),

    create: (data: Omit<SentEmail, 'id'>): SentEmail => {
      const emails = this.getCollection<SentEmail>('sentEmails');
      const newEmail: SentEmail = { ...data, id: this.generateId() };
      emails.push(newEmail);
      this.setCollection('sentEmails', emails);
      return newEmail;
    },
  };

  // JURY ASSIGNMENTS
  juryAssignments = {
    getByEvent: (eventId: string): JuryAssignment[] =>
      this.getCollection<JuryAssignment>('juryAssignments').filter(a => a.eventId === eventId),

    getByReviewer: (reviewerId: string): JuryAssignment[] =>
      this.getCollection<JuryAssignment>('juryAssignments').filter(a => a.reviewerId === reviewerId),

    create: (data: Omit<JuryAssignment, 'id'>): JuryAssignment => {
      const assignments = this.getCollection<JuryAssignment>('juryAssignments');
      const newAssignment: JuryAssignment = { ...data, id: this.generateId() };
      assignments.push(newAssignment);
      this.setCollection('juryAssignments', assignments);
      return newAssignment;
    },

    deleteByEvent: (eventId: string): void => {
      const assignments = this.getCollection<JuryAssignment>('juryAssignments').filter(a => a.eventId !== eventId);
      this.setCollection('juryAssignments', assignments);
    },

    // Automatic equitable assignment of abstracts to reviewers
    autoAssign: (eventId: string): { assignments: JuryAssignment[]; stats: { reviewerId: string; count: number }[] } => {
      const reviewers = this.users.getReviewers();
      const pendingAbstracts = this.abstracts.getPendingByEvent(eventId);
      
      if (reviewers.length === 0) {
        throw new Error('No hay revisores disponibles');
      }
      
      if (pendingAbstracts.length === 0) {
        throw new Error('No hay trabajos pendientes para asignar');
      }

      // Delete existing assignments for this event
      this.juryAssignments.deleteByEvent(eventId);

      // Calculate equitable distribution
      const abstractsPerReviewer = Math.floor(pendingAbstracts.length / reviewers.length);
      const remainder = pendingAbstracts.length % reviewers.length;

      const assignments: JuryAssignment[] = [];
      const stats: { reviewerId: string; count: number }[] = [];
      let abstractIndex = 0;

      reviewers.forEach((reviewer, reviewerIndex) => {
        // Some reviewers get one extra if there's a remainder
        const count = abstractsPerReviewer + (reviewerIndex < remainder ? 1 : 0);
        
        for (let i = 0; i < count && abstractIndex < pendingAbstracts.length; i++) {
          const assignment = this.juryAssignments.create({
            eventId,
            reviewerId: reviewer.id,
            abstractId: pendingAbstracts[abstractIndex].id,
            assignedAt: new Date().toISOString(),
            status: 'pending',
          });
          
          // Update abstract with assigned reviewer
          const abstract = pendingAbstracts[abstractIndex];
          const currentReviewers = (abstract as any).assignedReviewers || [];
          this.abstracts.assignReviewers(abstract.id, [...currentReviewers, reviewer.id]);
          
          assignments.push(assignment);
          abstractIndex++;
        }

        stats.push({ reviewerId: reviewer.id, count });

        // Create notification for reviewer
        this.notifications.create({
          userId: reviewer.id,
          type: 'review_assigned',
          title: 'Nuevos trabajos asignados',
          message: `Se te han asignado ${count} trabajo(s) para revisar.`,
          link: '/review',
        });
      });

      return { assignments, stats };
    },
  };

  // EVENT REGISTRATIONS
  eventRegistrations = {
    getAll: (): EventRegistration[] => this.getCollection<EventRegistration>('eventRegistrations'),
    
    getByEvent: (eventId: string): EventRegistration[] =>
      this.getCollection<EventRegistration>('eventRegistrations').filter(r => r.eventId === eventId),
    
    getByUser: (userId: string): EventRegistration[] =>
      this.getCollection<EventRegistration>('eventRegistrations').filter(r => r.userId === userId),
    
    getById: (id: string): EventRegistration | undefined =>
      this.getCollection<EventRegistration>('eventRegistrations').find(r => r.id === id),
    
    create: (data: Omit<EventRegistration, 'id' | 'registeredAt'>): EventRegistration => {
      const registrations = this.getCollection<EventRegistration>('eventRegistrations');
      const newRegistration: EventRegistration = {
        ...data,
        id: this.generateId(),
        registeredAt: new Date().toISOString(),
      };
      registrations.push(newRegistration);
      this.setCollection('eventRegistrations', registrations);
      toast.success('¡Inscripción completada exitosamente!');
      return newRegistration;
    },
    
    update: (id: string, data: Partial<EventRegistration>): EventRegistration => {
      const registrations = this.getCollection<EventRegistration>('eventRegistrations');
      const index = registrations.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Inscripción no encontrada');
      registrations[index] = { ...registrations[index], ...data };
      this.setCollection('eventRegistrations', registrations);
      return registrations[index];
    },
    
    delete: (id: string): boolean => {
      const registrations = this.getCollection<EventRegistration>('eventRegistrations').filter(r => r.id !== id);
      this.setCollection('eventRegistrations', registrations);
      return true;
    },
  };

  // THEMATICS
  thematics = {
    getAll: (): Thematic[] => this.getCollection<Thematic>('thematics'),
    
    getByEvent: (eventId: string): Thematic[] =>
      this.getCollection<Thematic>('thematics').filter(t => t.eventId === eventId),
    
    getById: (id: string): Thematic | undefined =>
      this.getCollection<Thematic>('thematics').find(t => t.id === id),
    
    create: (data: Omit<Thematic, 'id'>): Thematic => {
      const thematics = this.getCollection<Thematic>('thematics');
      const newThematic: Thematic = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
      thematics.push(newThematic);
      this.setCollection('thematics', thematics);
      return newThematic;
    },
    
    update: (id: string, data: Partial<Thematic>): Thematic | undefined => {
      const thematics = this.getCollection<Thematic>('thematics');
      const index = thematics.findIndex(t => t.id === id);
      if (index !== -1) {
        thematics[index] = { ...thematics[index], ...data };
        this.setCollection('thematics', thematics);
        return thematics[index];
      }
      return undefined;
    },
    
    delete: (id: string): boolean => {
      const thematics = this.getCollection<Thematic>('thematics').filter(t => t.id !== id);
      this.setCollection('thematics', thematics);
      return true;
    },
  };

  // COMMITTEE MEMBERS
  committeeMembers = {
    getAll: (): CommitteeMember[] => this.getCollection<CommitteeMember>('committeeMembers'),
    
    getByEvent: (eventId: string): CommitteeMember[] =>
      this.getCollection<CommitteeMember>('committeeMembers').filter(cm => cm.eventId === eventId),
    
    getByUser: (userId: string): CommitteeMember[] =>
      this.getCollection<CommitteeMember>('committeeMembers').filter(cm => cm.userId === userId),
    
    getByRole: (eventId: string, role: CommitteeMember['role']): CommitteeMember[] =>
      this.getCollection<CommitteeMember>('committeeMembers').filter(cm => cm.eventId === eventId && cm.role === role),
    
    create: (data: Omit<CommitteeMember, 'id'>): CommitteeMember => {
      const members = this.getCollection<CommitteeMember>('committeeMembers');
      const newMember: CommitteeMember = { ...data, id: this.generateId(), assignedAt: new Date().toISOString() };
      members.push(newMember);
      this.setCollection('committeeMembers', members);
      
      // Update user role if needed
      const user = this.users.getById(data.userId);
      if (user && user.role === 'USER') {
        this.users.update(data.userId, { role: 'COMMITTEE' });
      }
      
      return newMember;
    },
    
    delete: (id: string): boolean => {
      const members = this.getCollection<CommitteeMember>('committeeMembers').filter(cm => cm.id !== id);
      this.setCollection('committeeMembers', members);
      return true;
    },
  };

  // WORK ASSIGNMENTS (Asignaciones específicas de trabajos a árbitros)
  workAssignments = {
    getAll: (): WorkAssignment[] => this.getCollection<WorkAssignment>('workAssignments'),
    
    getByAbstract: (abstractId: string): WorkAssignment | undefined =>
      this.getCollection<WorkAssignment>('workAssignments').find(wa => wa.abstractId === abstractId),
    
    getByReviewer: (reviewerId: string): WorkAssignment[] =>
      this.getCollection<WorkAssignment>('workAssignments').filter(wa => wa.reviewerId === reviewerId),
    
    create: (data: Omit<WorkAssignment, 'id'>): WorkAssignment => {
      const assignments = this.getCollection<WorkAssignment>('workAssignments');
      
      // Check if abstract is already assigned
      const existing = assignments.find(wa => wa.abstractId === data.abstractId);
      if (existing) {
        throw new Error('Este trabajo ya está asignado a otro árbitro');
      }
      
      const newAssignment: WorkAssignment = { 
        ...data, 
        id: this.generateId(), 
        assignedAt: new Date().toISOString(),
        status: 'pending'
      };
      assignments.push(newAssignment);
      this.setCollection('workAssignments', assignments);
      
      // Update abstract with assigned reviewer
      this.abstracts.update(data.abstractId, { assignedReviewerId: data.reviewerId });
      
      // Create notification
      this.notifications.create({
        userId: data.reviewerId,
        type: 'review_assigned',
        title: 'Nuevo trabajo asignado',
        message: 'Se te ha asignado un nuevo trabajo para revisar.',
        link: '/review',
      });
      
      return newAssignment;
    },
    
    reassign: (abstractId: string, newReviewerId: string, assignedBy: string): WorkAssignment => {
      const assignments = this.getCollection<WorkAssignment>('workAssignments');
      const index = assignments.findIndex(wa => wa.abstractId === abstractId);
      
      if (index !== -1) {
        const oldReviewerId = assignments[index].reviewerId;
        assignments[index] = {
          ...assignments[index],
          reviewerId: newReviewerId,
          assignedBy,
          assignedAt: new Date().toISOString(),
          status: 'pending'
        };
        this.setCollection('workAssignments', assignments);
        
        // Update abstract
        this.abstracts.update(abstractId, { assignedReviewerId: newReviewerId });
        
        // Notifications
        this.notifications.create({
          userId: newReviewerId,
          type: 'review_assigned',
          title: 'Nuevo trabajo asignado',
          message: 'Se te ha asignado un trabajo para revisar.',
          link: '/review',
        });
        
        this.notifications.create({
          userId: oldReviewerId,
          type: 'system',
          title: 'Trabajo reasignado',
          message: 'Un trabajo que tenías asignado ha sido reasignado a otro árbitro.',
        });
        
        return assignments[index];
      }
      
      // If not found, create new assignment
      return this.workAssignments.create({
        abstractId,
        reviewerId: newReviewerId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        status: 'pending',
      });
    },
    
    delete: (id: string): boolean => {
      const assignment = this.getCollection<WorkAssignment>('workAssignments').find(wa => wa.id === id);
      if (assignment) {
        this.abstracts.update(assignment.abstractId, { assignedReviewerId: undefined });
      }
      const assignments = this.getCollection<WorkAssignment>('workAssignments').filter(wa => wa.id !== id);
      this.setCollection('workAssignments', assignments);
      return true;
    },
  };

  // PROGRAM SESSIONS
  programSessions = {
    getAll: (): ProgramSession[] => this.getCollection<ProgramSession>('programSessions'),
    
    getByEvent: (eventId: string): ProgramSession[] =>
      this.getCollection<ProgramSession>('programSessions')
        .filter(ps => ps.eventId === eventId)
        .sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          if (dateComp !== 0) return dateComp;
          return a.startTime.localeCompare(b.startTime);
        }),
    
    getById: (id: string): ProgramSession | undefined =>
      this.getCollection<ProgramSession>('programSessions').find(ps => ps.id === id),
    
    create: (data: Omit<ProgramSession, 'id'>): ProgramSession => {
      const sessions = this.getCollection<ProgramSession>('programSessions');
      const newSession: ProgramSession = { ...data, id: this.generateId() };
      sessions.push(newSession);
      this.setCollection('programSessions', sessions);
      return newSession;
    },
    
    update: (id: string, data: Partial<ProgramSession>): ProgramSession | undefined => {
      const sessions = this.getCollection<ProgramSession>('programSessions');
      const index = sessions.findIndex(ps => ps.id === id);
      if (index !== -1) {
        sessions[index] = { ...sessions[index], ...data };
        this.setCollection('programSessions', sessions);
        return sessions[index];
      }
      return undefined;
    },
    
    delete: (id: string): boolean => {
      const sessions = this.getCollection<ProgramSession>('programSessions').filter(ps => ps.id !== id);
      this.setCollection('programSessions', sessions);
      return true;
    },
    
    addAbstract: (sessionId: string, abstractId: string): ProgramSession | undefined => {
      const sessions = this.getCollection<ProgramSession>('programSessions');
      const session = sessions.find(ps => ps.id === sessionId);
      if (session && !session.abstracts.includes(abstractId)) {
        session.abstracts.push(abstractId);
        this.setCollection('programSessions', sessions);
        
        // Update abstract with session
        this.abstracts.update(abstractId, { sessionId });
        
        return session;
      }
      return undefined;
    },
    
    removeAbstract: (sessionId: string, abstractId: string): ProgramSession | undefined => {
      const sessions = this.getCollection<ProgramSession>('programSessions');
      const session = sessions.find(ps => ps.id === sessionId);
      if (session) {
        session.abstracts = session.abstracts.filter(id => id !== abstractId);
        this.setCollection('programSessions', sessions);
        
        // Update abstract
        this.abstracts.update(abstractId, { sessionId: undefined });
        
        return session;
      }
      return undefined;
    },
    
    // Generate program proposal from approved abstracts
    generateProposal: (eventId: string): ProgramSession[] => {
      const event = this.events.getById(eventId);
      if (!event) throw new Error('Evento no encontrado');
      
      const approvedAbstracts = this.abstracts.getApproved(eventId);
      const thematics = this.thematics.getByEvent(eventId);
      
      // Delete existing sessions
      const existingSessions = this.programSessions.getByEvent(eventId);
      existingSessions.forEach(s => this.programSessions.delete(s.id));
      
      const sessions: ProgramSession[] = [];
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let orderIndex = 0;
      
      // Group abstracts by thematic
      const abstractsByThematic = new Map<string, Abstract[]>();
      approvedAbstracts.forEach(abstract => {
        const key = abstract.thematicId || 'sin-tematica';
        if (!abstractsByThematic.has(key)) {
          abstractsByThematic.set(key, []);
        }
        abstractsByThematic.get(key)!.push(abstract);
      });
      
      // Create sessions for each day
      for (let day = 0; day < days; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Morning session (9:00 - 12:00)
        let sessionIndex = 0;
        abstractsByThematic.forEach((abstracts, thematicId) => {
          if (abstracts.length === 0) return;
          
          const thematic = thematics.find(t => t.id === thematicId);
          const abstractsForSession = abstracts.splice(0, Math.min(6, abstracts.length));
          
          if (abstractsForSession.length > 0) {
            const session = this.programSessions.create({
              eventId,
              title: thematic ? `Sesión: ${thematic.name}` : 'Sesión General',
              thematicId: thematic?.id,
              date: dateStr,
              startTime: sessionIndex === 0 ? '09:00' : '14:00',
              endTime: sessionIndex === 0 ? '12:00' : '17:00',
              location: `Sala ${String.fromCharCode(65 + sessionIndex)}`,
              type: 'SESION_ORAL',
              abstracts: abstractsForSession.map(a => a.id),
              orderIndex: orderIndex++,
            });
            
            sessions.push(session);
            
            // Update abstracts with session
            abstractsForSession.forEach(a => {
              this.abstracts.update(a.id, { sessionId: session.id });
            });
            
            sessionIndex++;
            if (sessionIndex >= 2) return; // Max 2 sessions per day
          }
        });
        
        // Add break
        if (sessionIndex > 0) {
          sessions.push(this.programSessions.create({
            eventId,
            title: 'Almuerzo',
            date: dateStr,
            startTime: '12:00',
            endTime: '14:00',
            location: 'Cafetería',
            type: 'BREAK',
            abstracts: [],
            orderIndex: orderIndex++,
          }));
        }
      }
      
      return sessions;
    },
  };

  // DELEGATE PROGRAMS
  delegatePrograms = {
    getAll: (): DelegateProgram[] => this.getCollection<DelegateProgram>('delegatePrograms'),
    
    getByUser: (userId: string, eventId: string): DelegateProgram | undefined =>
      this.getCollection<DelegateProgram>('delegatePrograms')
        .find(dp => dp.userId === userId && dp.eventId === eventId),
    
    create: (data: Omit<DelegateProgram, 'id'>): DelegateProgram => {
      const programs = this.getCollection<DelegateProgram>('delegatePrograms');
      const newProgram: DelegateProgram = { 
        ...data, 
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      programs.push(newProgram);
      this.setCollection('delegatePrograms', programs);
      return newProgram;
    },
    
    update: (userId: string, eventId: string, sessionIds: string[]): DelegateProgram => {
      const programs = this.getCollection<DelegateProgram>('delegatePrograms');
      const index = programs.findIndex(dp => dp.userId === userId && dp.eventId === eventId);
      
      if (index !== -1) {
        programs[index] = {
          ...programs[index],
          sessionIds,
          updatedAt: new Date().toISOString()
        };
        this.setCollection('delegatePrograms', programs);
        return programs[index];
      }
      
      return this.delegatePrograms.create({ 
        userId, 
        eventId, 
        sessionIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    
    delete: (id: string): boolean => {
      const programs = this.getCollection<DelegateProgram>('delegatePrograms').filter(dp => dp.id !== id);
      this.setCollection('delegatePrograms', programs);
      return true;
    },
  };

  // EMAIL SERVICE (simulated)
  emailService = {
    sendEmail: (
      eventId: string,
      templateId: string,
      recipientId: string,
      variables: Record<string, string>
    ): SentEmail => {
      const template = this.emailTemplates.getById(templateId);
      const user = this.users.getById(recipientId);
      const event = this.events.getById(eventId);

      if (!template || !user || !event) {
        throw new Error('Datos incompletos para enviar email');
      }

      // Replace variables in template
      let subject = template.subject;
      let body = template.htmlBody;

      const allVariables = {
        ...variables,
        userName: user.name,
        userEmail: user.email,
        eventName: event.name,
        primaryColor: event.primaryColor,
        secondaryColor: event.secondaryColor,
        bannerImage: event.bannerImageUrl,
        backgroundImage: event.backgroundImageUrl || event.bannerImageUrl,
      };

      Object.entries(allVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      });

      // Simulate sending
      const sentEmail = this.sentEmails.create({
        eventId,
        templateId,
        recipientId,
        recipientEmail: user.email,
        subject,
        sentAt: new Date().toISOString(),
        status: 'sent',
      });

      // Create notification
      this.notifications.create({
        userId: recipientId,
        type: 'email_sent',
        title: 'Nuevo correo recibido',
        message: subject,
      });

      return sentEmail;
    },

    sendBulkEmail: (
      eventId: string,
      templateId: string,
      recipientIds: string[],
      variables: Record<string, string>
    ): SentEmail[] => {
      return recipientIds.map(recipientId => 
        this.emailService.sendEmail(eventId, templateId, recipientId, variables)
      );
    },
  };

  // CMS PAGES
  cmsPages = {
    getAll: (): CMSPage[] => this.getCollection<CMSPage>('cmsPages'),
    
    getById: (id: string): CMSPage | undefined =>
      this.getCollection<CMSPage>('cmsPages').find(p => p.id === id),
    
    getBySlug: (slug: string): CMSPage | undefined =>
      this.getCollection<CMSPage>('cmsPages').find(p => p.slug === slug),
    
    getPublished: (): CMSPage[] =>
      this.getCollection<CMSPage>('cmsPages').filter(p => p.status === 'published')
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    
    create: (data: Omit<CMSPage, 'id' | 'createdAt' | 'updatedAt'>): CMSPage => {
      const pages = this.getCollection<CMSPage>('cmsPages');
      const newPage: CMSPage = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      pages.push(newPage);
      this.setCollection('cmsPages', pages);
      toast.success('Página creada exitosamente');
      return newPage;
    },
    
    update: (id: string, data: Partial<CMSPage>): CMSPage => {
      const pages = this.getCollection<CMSPage>('cmsPages');
      const index = pages.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Página no encontrada');
      
      pages[index] = {
        ...pages[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.setCollection('cmsPages', pages);
      toast.success('Página actualizada');
      return pages[index];
    },
    
    delete: (id: string): boolean => {
      const pages = this.getCollection<CMSPage>('cmsPages').filter(p => p.id !== id);
      this.setCollection('cmsPages', pages);
      toast.success('Página eliminada');
      return true;
    },
    
    publish: (id: string): CMSPage => {
      return this.cmsPages.update(id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
      });
    },
  };

  // CMS ARTICLES
  cmsArticles = {
    getAll: (): CMSArticle[] => this.getCollection<CMSArticle>('cmsArticles'),
    
    getById: (id: string): CMSArticle | undefined =>
      this.getCollection<CMSArticle>('cmsArticles').find(a => a.id === id),
    
    getBySlug: (slug: string): CMSArticle | undefined =>
      this.getCollection<CMSArticle>('cmsArticles').find(a => a.slug === slug),
    
    getPublished: (): CMSArticle[] =>
      this.getCollection<CMSArticle>('cmsArticles')
        .filter(a => a.status === 'published')
        .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - 
                        new Date(a.publishedAt || a.createdAt).getTime()),
    
    getByCategory: (categoryId: string): CMSArticle[] =>
      this.getCollection<CMSArticle>('cmsArticles')
        .filter(a => a.categoryId === categoryId && a.status === 'published'),
    
    getByTag: (tag: string): CMSArticle[] =>
      this.getCollection<CMSArticle>('cmsArticles')
        .filter(a => a.tags.includes(tag) && a.status === 'published'),
    
    getFeatured: (): CMSArticle[] =>
      this.getCollection<CMSArticle>('cmsArticles')
        .filter(a => a.featured && a.status === 'published')
        .slice(0, 5),
    
    create: (data: Omit<CMSArticle, 'id' | 'createdAt' | 'updatedAt' | 'views'>): CMSArticle => {
      const articles = this.getCollection<CMSArticle>('cmsArticles');
      const newArticle: CMSArticle = {
        ...data,
        id: this.generateId(),
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      articles.push(newArticle);
      this.setCollection('cmsArticles', articles);
      toast.success('Artículo creado exitosamente');
      return newArticle;
    },
    
    update: (id: string, data: Partial<CMSArticle>): CMSArticle => {
      const articles = this.getCollection<CMSArticle>('cmsArticles');
      const index = articles.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Artículo no encontrado');
      
      articles[index] = {
        ...articles[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.setCollection('cmsArticles', articles);
      toast.success('Artículo actualizado');
      return articles[index];
    },
    
    delete: (id: string): boolean => {
      const articles = this.getCollection<CMSArticle>('cmsArticles').filter(a => a.id !== id);
      this.setCollection('cmsArticles', articles);
      toast.success('Artículo eliminado');
      return true;
    },
    
    incrementViews: (id: string): void => {
      const articles = this.getCollection<CMSArticle>('cmsArticles');
      const index = articles.findIndex(a => a.id === id);
      if (index !== -1) {
        articles[index].views += 1;
        this.setCollection('cmsArticles', articles);
      }
    },
  };

  // CMS CATEGORIES
  cmsCategories = {
    getAll: (): CMSCategory[] => this.getCollection<CMSCategory>('cmsCategories')
      .sort((a, b) => a.orderIndex - b.orderIndex),
    
    getById: (id: string): CMSCategory | undefined =>
      this.getCollection<CMSCategory>('cmsCategories').find(c => c.id === id),
    
    getBySlug: (slug: string): CMSCategory | undefined =>
      this.getCollection<CMSCategory>('cmsCategories').find(c => c.slug === slug),
    
    create: (data: Omit<CMSCategory, 'id' | 'createdAt'>): CMSCategory => {
      const categories = this.getCollection<CMSCategory>('cmsCategories');
      const newCategory: CMSCategory = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
      };
      categories.push(newCategory);
      this.setCollection('cmsCategories', categories);
      toast.success('Categoría creada');
      return newCategory;
    },
    
    update: (id: string, data: Partial<CMSCategory>): CMSCategory => {
      const categories = this.getCollection<CMSCategory>('cmsCategories');
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Categoría no encontrada');
      
      categories[index] = { ...categories[index], ...data };
      this.setCollection('cmsCategories', categories);
      toast.success('Categoría actualizada');
      return categories[index];
    },
    
    delete: (id: string): boolean => {
      const categories = this.getCollection<CMSCategory>('cmsCategories').filter(c => c.id !== id);
      this.setCollection('cmsCategories', categories);
      toast.success('Categoría eliminada');
      return true;
    },
  };

  // CMS MENUS
  cmsMenus = {
    getAll: (): CMSMenu[] => this.getCollection<CMSMenu>('cmsMenus'),
    
    getById: (id: string): CMSMenu | undefined =>
      this.getCollection<CMSMenu>('cmsMenus').find(m => m.id === id),
    
    getByLocation: (location: CMSMenu['location']): CMSMenu | undefined =>
      this.getCollection<CMSMenu>('cmsMenus').find(m => m.location === location && m.isActive),
    
    create: (data: Omit<CMSMenu, 'id' | 'createdAt' | 'updatedAt'>): CMSMenu => {
      const menus = this.getCollection<CMSMenu>('cmsMenus');
      const newMenu: CMSMenu = {
        ...data,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      menus.push(newMenu);
      this.setCollection('cmsMenus', menus);
      toast.success('Menú creado');
      return newMenu;
    },
    
    update: (id: string, data: Partial<CMSMenu>): CMSMenu => {
      const menus = this.getCollection<CMSMenu>('cmsMenus');
      const index = menus.findIndex(m => m.id === id);
      if (index === -1) throw new Error('Menú no encontrado');
      
      menus[index] = {
        ...menus[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.setCollection('cmsMenus', menus);
      toast.success('Menú actualizado');
      return menus[index];
    },
    
    delete: (id: string): boolean => {
      const menus = this.getCollection<CMSMenu>('cmsMenus').filter(m => m.id !== id);
      this.setCollection('cmsMenus', menus);
      toast.success('Menú eliminado');
      return true;
    },
  };

  // CMS WIDGETS
  cmsWidgets = {
    getAll: (): CMSWidget[] => this.getCollection<CMSWidget>('cmsWidgets')
      .sort((a, b) => a.orderIndex - b.orderIndex),
    
    getById: (id: string): CMSWidget | undefined =>
      this.getCollection<CMSWidget>('cmsWidgets').find(w => w.id === id),
    
    getByLocation: (location: CMSWidget['location']): CMSWidget[] =>
      this.getCollection<CMSWidget>('cmsWidgets')
        .filter(w => w.location === location && w.isActive)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    
    create: (data: Omit<CMSWidget, 'id'>): CMSWidget => {
      const widgets = this.getCollection<CMSWidget>('cmsWidgets');
      const newWidget: CMSWidget = {
        ...data,
        id: this.generateId(),
      };
      widgets.push(newWidget);
      this.setCollection('cmsWidgets', widgets);
      toast.success('Widget creado');
      return newWidget;
    },
    
    update: (id: string, data: Partial<CMSWidget>): CMSWidget => {
      const widgets = this.getCollection<CMSWidget>('cmsWidgets');
      const index = widgets.findIndex(w => w.id === id);
      if (index === -1) throw new Error('Widget no encontrado');
      
      widgets[index] = { ...widgets[index], ...data };
      this.setCollection('cmsWidgets', widgets);
      toast.success('Widget actualizado');
      return widgets[index];
    },
    
    delete: (id: string): boolean => {
      const widgets = this.getCollection<CMSWidget>('cmsWidgets').filter(w => w.id !== id);
      this.setCollection('cmsWidgets', widgets);
      toast.success('Widget eliminado');
      return true;
    },
  };

  // CMS SETTINGS
  cmsSettings = {
    get: (): CMSSettings | undefined => {
      const settings = this.getCollection<CMSSettings>('cmsSettings');
      return settings.length > 0 ? settings[0] : undefined;
    },
    
    update: (data: Partial<CMSSettings>): CMSSettings => {
      let settings = this.getCollection<CMSSettings>('cmsSettings');
      
      if (settings.length === 0) {
        const newSettings: CMSSettings = {
          id: this.generateId(),
          siteName: 'Mi Sitio',
          siteDescription: '',
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          accentColor: '#f59e0b',
          fontFamily: 'Inter',
          headerStyle: 'default',
          footerStyle: 'default',
          socialLinks: {},
          contactInfo: {},
          seoSettings: {},
          maintenanceMode: false,
          allowRegistration: true,
          moderateComments: false,
          ...data,
        };
        settings = [newSettings];
      } else {
        settings[0] = { ...settings[0], ...data };
      }
      
      this.setCollection('cmsSettings', settings);
      toast.success('Configuración actualizada');
      return settings[0];
    },
  };

  // ===== NOMENCLADORES CRUD =====

  nomReceptivos = {
    getAll: (): NomReceptivo[] => this.getCollection<NomReceptivo>('nomencladores_receptivos'),
    getById: (id: string): NomReceptivo | undefined => this.getCollection<NomReceptivo>('nomencladores_receptivos').find(r => r.id === id),
    getActivos: (): NomReceptivo[] => this.getCollection<NomReceptivo>('nomencladores_receptivos').filter(r => r.activo),
    create: (data: Omit<NomReceptivo, 'id' | 'createdAt' | 'updatedAt'>): NomReceptivo => {
      const items = this.getCollection<NomReceptivo>('nomencladores_receptivos');
      if (items.some(r => r.siglas === data.siglas)) throw new Error('Las siglas ya están en uso (RB-NOM-01)');
      const item: NomReceptivo = { ...data, id: this.generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('nomencladores_receptivos', items);
      return item;
    },
    update: (id: string, data: Partial<NomReceptivo>): NomReceptivo => {
      const items = this.getCollection<NomReceptivo>('nomencladores_receptivos');
      const idx = items.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('Receptivo no encontrado');
      if (data.siglas) {
        const dup = items.find(r => r.siglas === data.siglas && r.id !== id);
        if (dup) throw new Error('Las siglas ya están en uso');
      }
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('nomencladores_receptivos', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const empresas = this.nomEmpresas.getByReceptivo(id);
      if (empresas.length > 0) throw new Error('No se puede eliminar: tiene empresas asociadas (RB-NOM-03)');
      const items = this.getCollection<NomReceptivo>('nomencladores_receptivos').filter(r => r.id !== id);
      this.setCollection('nomencladores_receptivos', items);
    },
  };

  nomEmpresas = {
    getAll: (): NomEmpresa[] => this.getCollection<NomEmpresa>('nomencladores_empresas'),
    getById: (id: string): NomEmpresa | undefined => this.getCollection<NomEmpresa>('nomencladores_empresas').find(e => e.id === id),
    getByReceptivo: (receptivoId: string): NomEmpresa[] => this.getCollection<NomEmpresa>('nomencladores_empresas').filter(e => e.receptivoId === receptivoId),
    getActivos: (): NomEmpresa[] => this.getCollection<NomEmpresa>('nomencladores_empresas').filter(e => e.activo),
    create: (data: Omit<NomEmpresa, 'id' | 'createdAt' | 'updatedAt'>): NomEmpresa => {
      const items = this.getCollection<NomEmpresa>('nomencladores_empresas');
      const dup = items.find(e => e.codigo === data.codigo && e.receptivoId === data.receptivoId);
      if (dup) throw new Error('El código ya existe en este receptivo (RB-NOM-04)');
      const item: NomEmpresa = { ...data, id: this.generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('nomencladores_empresas', items);
      return item;
    },
    update: (id: string, data: Partial<NomEmpresa>): NomEmpresa => {
      const items = this.getCollection<NomEmpresa>('nomencladores_empresas');
      const idx = items.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Empresa no encontrada');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('nomencladores_empresas', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<NomEmpresa>('nomencladores_empresas').filter(e => e.id !== id);
      this.setCollection('nomencladores_empresas', items);
    },
  };

  nomTiposParticipacion = {
    getAll: (): NomTipoParticipacion[] => this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion'),
    getById: (id: string): NomTipoParticipacion | undefined => this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion').find(t => t.id === id),
    getActivos: (): NomTipoParticipacion[] => this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion').filter(t => t.activo),
    create: (data: Omit<NomTipoParticipacion, 'id'>): NomTipoParticipacion => {
      const items = this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion');
      const item: NomTipoParticipacion = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('nomencladores_tiposParticipacion', items);
      return item;
    },
    update: (id: string, data: Partial<NomTipoParticipacion>): NomTipoParticipacion => {
      const items = this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion');
      const idx = items.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Tipo no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladores_tiposParticipacion', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<NomTipoParticipacion>('nomencladores_tiposParticipacion').filter(t => t.id !== id);
      this.setCollection('nomencladores_tiposParticipacion', items);
    },
  };

  nomTiposTransporte = {
    getAll: (): NomTipoTransporte[] => this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte'),
    getById: (id: string): NomTipoTransporte | undefined => this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte').find(t => t.id === id),
    getActivos: (): NomTipoTransporte[] => this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte').filter(t => t.activo),
    create: (data: Omit<NomTipoTransporte, 'id'>): NomTipoTransporte => {
      const items = this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte');
      const item: NomTipoTransporte = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('nomencladores_tiposTransporte', items);
      return item;
    },
    update: (id: string, data: Partial<NomTipoTransporte>): NomTipoTransporte => {
      const items = this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte');
      const idx = items.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Tipo no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladores_tiposTransporte', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<NomTipoTransporte>('nomencladores_tiposTransporte').filter(t => t.id !== id);
      this.setCollection('nomencladores_tiposTransporte', items);
    },
  };

  nomHoteles = {
    getAll: (): NomHotel[] => this.getCollection<NomHotel>('nomencladores_hoteles'),
    getById: (id: string): NomHotel | undefined => this.getCollection<NomHotel>('nomencladores_hoteles').find(h => h.id === id),
    getActivos: (): NomHotel[] => this.getCollection<NomHotel>('nomencladores_hoteles').filter(h => h.activo),
    create: (data: Omit<NomHotel, 'id' | 'createdAt' | 'updatedAt'>): NomHotel => {
      const items = this.getCollection<NomHotel>('nomencladores_hoteles');
      const item: NomHotel = { ...data, id: this.generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('nomencladores_hoteles', items);
      return item;
    },
    update: (id: string, data: Partial<NomHotel>): NomHotel => {
      const items = this.getCollection<NomHotel>('nomencladores_hoteles');
      const idx = items.findIndex(h => h.id === id);
      if (idx === -1) throw new Error('Hotel no encontrado');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('nomencladores_hoteles', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const eventoHoteles = this.eventoHoteles.getByHotel(id);
      if (eventoHoteles.length > 0) throw new Error('No se puede eliminar: tiene eventos asociados (RB-NOM-07)');
      const items = this.getCollection<NomHotel>('nomencladores_hoteles').filter(h => h.id !== id);
      this.setCollection('nomencladores_hoteles', items);
    },
  };

  nomTiposHabitacion = {
    getAll: (): NomTipoHabitacion[] => this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion'),
    getById: (id: string): NomTipoHabitacion | undefined => this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion').find(t => t.id === id),
    getActivos: (): NomTipoHabitacion[] => this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion').filter(t => t.activo),
    create: (data: Omit<NomTipoHabitacion, 'id'>): NomTipoHabitacion => {
      const items = this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion');
      const item: NomTipoHabitacion = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('nomencladores_tiposHabitacion', items);
      return item;
    },
    update: (id: string, data: Partial<NomTipoHabitacion>): NomTipoHabitacion => {
      const items = this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion');
      const idx = items.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Tipo no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladores_tiposHabitacion', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<NomTipoHabitacion>('nomencladores_tiposHabitacion').filter(t => t.id !== id);
      this.setCollection('nomencladores_tiposHabitacion', items);
    },
  };

  hotelTiposHabitacion = {
    getAll: (): HotelTipoHabitacion[] => this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion'),
    getByHotel: (hotelId: string): HotelTipoHabitacion[] => this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion').filter(h => h.hotelId === hotelId),
    getByTipo: (tipoId: string): HotelTipoHabitacion[] => this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion').filter(h => h.tipoHabitacionId === tipoId),
    create: (data: Omit<HotelTipoHabitacion, 'id'>): HotelTipoHabitacion => {
      const items = this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion');
      const item: HotelTipoHabitacion = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('nomencladores_hotelTiposHabitacion', items);
      return item;
    },
    update: (id: string, data: Partial<HotelTipoHabitacion>): HotelTipoHabitacion => {
      const items = this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion');
      const idx = items.findIndex(h => h.id === id);
      if (idx === -1) throw new Error('Relación no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladores_hotelTiposHabitacion', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<HotelTipoHabitacion>('nomencladores_hotelTiposHabitacion').filter(h => h.id !== id);
      this.setCollection('nomencladores_hotelTiposHabitacion', items);
    },
  };

  eventoHoteles = {
    getAll: (): EventoHotel[] => this.getCollection<EventoHotel>('nomencladores_eventoHotel'),
    getByEvento: (eventoId: string): EventoHotel[] => this.getCollection<EventoHotel>('nomencladores_eventoHotel').filter(e => e.eventoId === eventoId),
    getByHotel: (hotelId: string): EventoHotel[] => this.getCollection<EventoHotel>('nomencladores_eventoHotel').filter(e => e.hotelId === hotelId),
    create: (data: Omit<EventoHotel, 'id'>): EventoHotel => {
      const items = this.getCollection<EventoHotel>('nomencladores_eventoHotel');
      const item: EventoHotel = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('nomencladores_eventoHotel', items);
      return item;
    },
    update: (id: string, data: Partial<EventoHotel>): EventoHotel => {
      const items = this.getCollection<EventoHotel>('nomencladores_eventoHotel');
      const idx = items.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Asignación no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladores_eventoHotel', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<EventoHotel>('nomencladores_eventoHotel').filter(e => e.id !== id);
      this.setCollection('nomencladores_eventoHotel', items);
    },
  };

  // EVENTO HOTEL HABITACIONES - Precios de habitaciones por evento
  eventoHotelHabitaciones = {
    getAll: (): EventoHotelHabitacion[] => this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones'),
    getByEventoHotel: (eventoHotelId: string): EventoHotelHabitacion[] => 
      this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones').filter(h => h.eventoHotelId === eventoHotelId),
    getByEvento: (eventoId: string): EventoHotelHabitacion[] => {
      const eventoHoteles = this.eventoHoteles.getByEvento(eventoId);
      const eventoHotelIds = eventoHoteles.map(eh => eh.id);
      return this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones').filter(h => eventoHotelIds.includes(h.eventoHotelId));
    },
    create: (data: Omit<EventoHotelHabitacion, 'id'>): EventoHotelHabitacion => {
      const items = this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones');
      const item: EventoHotelHabitacion = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('eventoHotelHabitaciones', items);
      return item;
    },
    update: (id: string, data: Partial<EventoHotelHabitacion>): EventoHotelHabitacion => {
      const items = this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones');
      const idx = items.findIndex(h => h.id === id);
      if (idx === -1) throw new Error('Habitación del evento no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('eventoHotelHabitaciones', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones').filter(h => h.id !== id);
      this.setCollection('eventoHotelHabitaciones', items);
    },
    deleteByEventoHotel: (eventoHotelId: string): void => {
      const items = this.getCollection<EventoHotelHabitacion>('eventoHotelHabitaciones').filter(h => h.eventoHotelId !== eventoHotelId);
      this.setCollection('eventoHotelHabitaciones', items);
    },
  };

  // AUDIT LOG
  auditLog = {
    getAll: (): AuditLog[] => this.getCollection<AuditLog>('auditLog').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    getByUser: (userId: string): AuditLog[] => this.getCollection<AuditLog>('auditLog').filter(l => l.userId === userId),
    getByEntity: (entity: string, entityId: string): AuditLog[] => this.getCollection<AuditLog>('auditLog').filter(l => l.entity === entity && l.entityId === entityId),
    create: (data: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog => {
      const items = this.getCollection<AuditLog>('auditLog');
      const item: AuditLog = { ...data, id: this.generateId(), timestamp: new Date().toISOString() };
      items.push(item);
      this.setCollection('auditLog', items);
      return item;
    },
  };

  // ===== NEW COLLECTIONS CRUD =====

  // SALONES
  salones = {
    getAll: (): Salon[] => this.getCollection<Salon>('salones'),
    getByHotel: (hotelId: string): Salon[] => this.getCollection<Salon>('salones').filter(s => s.hotelId === hotelId),
    getActivosByHotel: (hotelId: string): Salon[] => this.getCollection<Salon>('salones').filter(s => s.hotelId === hotelId && s.estado === 'ACTIVO'),
    getById: (id: string): Salon | undefined => this.getCollection<Salon>('salones').find(s => s.id === id),
    canDelete: (id: string): { can: boolean; reason?: string } => {
      const subEventos = this.subEventos.getAll().filter(se => se.salonId === id);
      if (subEventos.length > 0) return { can: false, reason: `Usado en ${subEventos.length} SubEventos` };
      const sesiones = this.eventSessions.getAll().filter(s => (s as any).salonId === id);
      if (sesiones.length > 0) return { can: false, reason: `Usado en ${sesiones.length} Sesiones` };
      const actividades = this.actividadesSociales.getAll().filter(a => (a as any).salonId === id);
      if (actividades.length > 0) return { can: false, reason: `Usado en ${actividades.length} Actividades` };
      return { can: true };
    },
    create: (data: Omit<Salon, 'id' | 'createdAt' | 'updatedAt'>): Salon => {
      const items = this.getCollection<Salon>('salones');
      const now = new Date().toISOString();
      const item: Salon = { ...data, id: this.generateId(), createdAt: now, updatedAt: now };
      items.push(item);
      this.setCollection('salones', items);
      return item;
    },
    update: (id: string, data: Partial<Salon>): Salon => {
      const items = this.getCollection<Salon>('salones');
      const idx = items.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Salón no encontrado');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('salones', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const { can, reason } = this.salones.canDelete(id);
      if (!can) throw new Error(`No se puede eliminar: ${reason}`);
      const items = this.getCollection<Salon>('salones').filter(s => s.id !== id);
      this.setCollection('salones', items);
    },
  };

  // SUBEVENTOS (antes Event Simple)
  subEventos = {
    getAll: (): SubEvento[] => this.getCollection<SubEvento>('subEventos'),
    getByEvento: (eventoId: string): SubEvento[] => this.getCollection<SubEvento>('subEventos').filter(se => se.eventoId === eventoId),
    getById: (id: string): SubEvento | undefined => this.getCollection<SubEvento>('subEventos').find(se => se.id === id),
    getBySalon: (salonId: string): SubEvento[] => this.getCollection<SubEvento>('subEventos').filter(se => se.salonId === salonId),
    getByTematica: (tematicaId: string): SubEvento[] => this.getCollection<SubEvento>('subEventos').filter(se => se.tematicaId === tematicaId),
    create: (data: Omit<SubEvento, 'id' | 'createdAt'>): SubEvento => {
      const items = this.getCollection<SubEvento>('subEventos');
      const item: SubEvento = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('subEventos', items);
      return item;
    },
    update: (id: string, data: Partial<SubEvento>): SubEvento => {
      const items = this.getCollection<SubEvento>('subEventos');
      const idx = items.findIndex(se => se.id === id);
      if (idx === -1) throw new Error('SubEvento no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('subEventos', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<SubEvento>('subEventos').filter(se => se.id !== id);
      this.setCollection('subEventos', items);
    },
  };

  // ACTIVIDADES SOCIALES
  actividadesSociales = {
    getAll: (): ActividadSocial[] => this.getCollection<ActividadSocial>('actividadesSociales'),
    getByEvento: (eventoId: string): ActividadSocial[] => this.getCollection<ActividadSocial>('actividadesSociales').filter(a => a.eventoId === eventoId),
    getActivasByEvento: (eventoId: string): ActividadSocial[] => this.getCollection<ActividadSocial>('actividadesSociales').filter(a => a.eventoId === eventoId && a.estado === 'ACTIVO'),
    getById: (id: string): ActividadSocial | undefined => this.getCollection<ActividadSocial>('actividadesSociales').find(a => a.id === id),
    create: (data: Omit<ActividadSocial, 'id' | 'createdAt'>): ActividadSocial => {
      const items = this.getCollection<ActividadSocial>('actividadesSociales');
      const item: ActividadSocial = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('actividadesSociales', items);
      return item;
    },
    update: (id: string, data: Partial<ActividadSocial>): ActividadSocial => {
      const items = this.getCollection<ActividadSocial>('actividadesSociales');
      const idx = items.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Actividad no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('actividadesSociales', items);
      return items[idx];
    },
    delete: (id: string): void => {
      // También eliminar reservas asociadas
      const reservas = this.reservasActividades.getByActividad(id);
      reservas.forEach(r => this.reservasActividades.delete(r.id));
      const items = this.getCollection<ActividadSocial>('actividadesSociales').filter(a => a.id !== id);
      this.setCollection('actividadesSociales', items);
    },
  };

  // RESERVAS ACTIVIDADES SOCIALES
  reservasActividades = {
    getAll: (): ReservaActividadSocial[] => this.getCollection<ReservaActividadSocial>('reservasActividades'),
    getByActividad: (actividadId: string): ReservaActividadSocial[] => this.getCollection<ReservaActividadSocial>('reservasActividades').filter(r => r.actividadId === actividadId),
    getByUsuario: (usuarioId: string): ReservaActividadSocial[] => this.getCollection<ReservaActividadSocial>('reservasActividades').filter(r => r.usuarioId === usuarioId),
    getByActividadAndUsuario: (actividadId: string, usuarioId: string): ReservaActividadSocial | undefined =>
      this.getCollection<ReservaActividadSocial>('reservasActividades').find(r => r.actividadId === actividadId && r.usuarioId === usuarioId),
    countByActividad: (actividadId: string): number => this.getCollection<ReservaActividadSocial>('reservasActividades').filter(r => r.actividadId === actividadId).length,
    create: (data: Omit<ReservaActividadSocial, 'id' | 'fechaReserva'>): ReservaActividadSocial => {
      const items = this.getCollection<ReservaActividadSocial>('reservasActividades');
      const item: ReservaActividadSocial = { ...data, id: this.generateId(), fechaReserva: new Date().toISOString() };
      items.push(item);
      this.setCollection('reservasActividades', items);
      return item;
    },
    update: (id: string, data: Partial<ReservaActividadSocial>): ReservaActividadSocial => {
      const items = this.getCollection<ReservaActividadSocial>('reservasActividades');
      const idx = items.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('Reserva no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('reservasActividades', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<ReservaActividadSocial>('reservasActividades').filter(r => r.id !== id);
      this.setCollection('reservasActividades', items);
    },
  };

  // EVENTO SALONES
  eventoSalones = {
    getAll: (): EventoSalon[] => this.getCollection<EventoSalon>('eventoSalones'),
    getByEvento: (eventoId: string): EventoSalon[] => this.getCollection<EventoSalon>('eventoSalones').filter(es => es.eventoId === eventoId),
    getBySalon: (salonId: string): EventoSalon[] => this.getCollection<EventoSalon>('eventoSalones').filter(es => es.salonId === salonId),
    create: (data: Omit<EventoSalon, 'id'>): EventoSalon => {
      const items = this.getCollection<EventoSalon>('eventoSalones');
      const item: EventoSalon = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('eventoSalones', items);
      return item;
    },
    delete: (id: string): void => {
      const items = this.getCollection<EventoSalon>('eventoSalones').filter(es => es.id !== id);
      this.setCollection('eventoSalones', items);
    },
    deleteByEvento: (eventoId: string): void => {
      const items = this.getCollection<EventoSalon>('eventoSalones').filter(es => es.eventoId !== eventoId);
      this.setCollection('eventoSalones', items);
    },
  };

  // EVENTO TIPOS PARTICIPACION
  eventoTiposParticipacion = {
    getAll: (): EventoTipoParticipacion[] => this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion'),
    getByEvento: (eventoId: string): EventoTipoParticipacion[] => this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion').filter(etp => etp.eventoId === eventoId),
    create: (data: Omit<EventoTipoParticipacion, 'id'>): EventoTipoParticipacion => {
      const items = this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion');
      const item: EventoTipoParticipacion = { ...data, id: this.generateId() };
      items.push(item);
      this.setCollection('eventoTiposParticipacion', items);
      return item;
    },
    update: (id: string, data: Partial<EventoTipoParticipacion>): EventoTipoParticipacion => {
      const items = this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion');
      const idx = items.findIndex(etp => etp.id === id);
      if (idx === -1) throw new Error('Tipo de participación no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('eventoTiposParticipacion', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion').filter(etp => etp.id !== id);
      this.setCollection('eventoTiposParticipacion', items);
    },
    deleteByEvento: (eventoId: string): void => {
      const items = this.getCollection<EventoTipoParticipacion>('eventoTiposParticipacion').filter(etp => etp.eventoId !== eventoId);
      this.setCollection('eventoTiposParticipacion', items);
    },
  };

  // RUTAS TRANSPORTE
  rutasTransporte = {
    getAll: (): RutaTransporte[] => this.getCollection<RutaTransporte>('rutasTransporte'),
    getByEvento: (eventoId: string): RutaTransporte[] => this.getCollection<RutaTransporte>('rutasTransporte').filter(r => r.eventoId === eventoId),
    getActivasByEvento: (eventoId: string): RutaTransporte[] => this.getCollection<RutaTransporte>('rutasTransporte').filter(r => r.eventoId === eventoId && r.activo),
    getById: (id: string): RutaTransporte | undefined => this.getCollection<RutaTransporte>('rutasTransporte').find(r => r.id === id),
    create: (data: Omit<RutaTransporte, 'id' | 'createdAt'>): RutaTransporte => {
      const items = this.getCollection<RutaTransporte>('rutasTransporte');
      const item: RutaTransporte = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('rutasTransporte', items);
      return item;
    },
    update: (id: string, data: Partial<RutaTransporte>): RutaTransporte => {
      const items = this.getCollection<RutaTransporte>('rutasTransporte');
      const idx = items.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('Ruta no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('rutasTransporte', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<RutaTransporte>('rutasTransporte').filter(r => r.id !== id);
      this.setCollection('rutasTransporte', items);
    },
    deleteByEvento: (eventoId: string): void => {
      const items = this.getCollection<RutaTransporte>('rutasTransporte').filter(r => r.eventoId !== eventoId);
      this.setCollection('rutasTransporte', items);
    },
  };

  // NOMENCLADORES DEL EVENTO (Paso 8)
  nomencladoresEvento = {
    getAll: (): NomencladorEvento[] => this.getCollection<NomencladorEvento>('nomencladoresEvento'),
    getByEvento: (eventoId: string): NomencladorEvento[] => this.getCollection<NomencladorEvento>('nomencladoresEvento').filter(n => n.eventoId === eventoId),
    getByEventoAndTipo: (eventoId: string, tipo: TipoNomencladorEvento): NomencladorEvento[] =>
      this.getCollection<NomencladorEvento>('nomencladoresEvento').filter(n => n.eventoId === eventoId && n.tipo === tipo),
    getActivosByEvento: (eventoId: string): NomencladorEvento[] =>
      this.getCollection<NomencladorEvento>('nomencladoresEvento').filter(n => n.eventoId === eventoId && n.activo),
    getById: (id: string): NomencladorEvento | undefined => this.getCollection<NomencladorEvento>('nomencladoresEvento').find(n => n.id === id),
    create: (data: Omit<NomencladorEvento, 'id' | 'createdAt'>): NomencladorEvento => {
      const items = this.getCollection<NomencladorEvento>('nomencladoresEvento');
      const item: NomencladorEvento = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('nomencladoresEvento', items);
      return item;
    },
    update: (id: string, data: Partial<NomencladorEvento>): NomencladorEvento => {
      const items = this.getCollection<NomencladorEvento>('nomencladoresEvento');
      const idx = items.findIndex(n => n.id === id);
      if (idx === -1) throw new Error('Nomenclador no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('nomencladoresEvento', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<NomencladorEvento>('nomencladoresEvento').filter(n => n.id !== id);
      this.setCollection('nomencladoresEvento', items);
    },
    deleteByEvento: (eventoId: string): void => {
      const items = this.getCollection<NomencladorEvento>('nomencladoresEvento').filter(n => n.eventoId !== eventoId);
      this.setCollection('nomencladoresEvento', items);
    },
  };

  // WIZARD PROGRESS
  wizardProgress = {
    get: (eventoId: string): WizardProgress | undefined => this.getCollection<WizardProgress>('wizardProgress').find(w => w.eventoId === eventoId),
    create: (data: Omit<WizardProgress, 'ultimaModificacion'>): WizardProgress => {
      const items = this.getCollection<WizardProgress>('wizardProgress');
      const existing = items.findIndex(w => w.eventoId === data.eventoId);
      if (existing !== -1) {
        items[existing] = { ...items[existing], ...data, ultimaModificacion: new Date().toISOString() };
        this.setCollection('wizardProgress', items);
        return items[existing];
      }
      const item: WizardProgress = { ...data, ultimaModificacion: new Date().toISOString() };
      items.push(item);
      this.setCollection('wizardProgress', items);
      return item;
    },
    update: (eventoId: string, data: Partial<WizardProgress>): WizardProgress => {
      const items = this.getCollection<WizardProgress>('wizardProgress');
      const idx = items.findIndex(w => w.eventoId === eventoId);
      if (idx === -1) throw new Error('Progreso no encontrado');
      items[idx] = { ...items[idx], ...data, ultimaModificacion: new Date().toISOString() };
      this.setCollection('wizardProgress', items);
      return items[idx];
    },
    delete: (eventoId: string): void => {
      const items = this.getCollection<WizardProgress>('wizardProgress').filter(w => w.eventoId !== eventoId);
      this.setCollection('wizardProgress', items);
    },
  };

  // DATA ISOLATION HELPER
  getFilteredData = <T extends Record<string, any>>(
    collection: string,
    user: User,
    receptivoField = 'receptivoId',
    empresaField = 'empresaId'
  ): T[] => {
    const data = this.getCollection<T>(collection);
    switch (user.role) {
      case 'SUPERADMIN':
        return data; // Full access
      case 'ADMIN_RECEPTIVO':
      case 'LECTOR_RECEPTIVO':
        return data.filter(item => item[receptivoField] === user.receptivoId);
      case 'ADMIN_EMPRESA':
      case 'LECTOR_EMPRESA':
        return data.filter(item => item[receptivoField] === user.receptivoId && item[empresaField] === user.empresaId);
      case 'COORDINADOR_HOTEL':
        // Special: filter by evento_hotel assignments
        const eventoHoteles = this.eventoHoteles.getByHotel(user.hotelId || '');
        const eventoIds = eventoHoteles.map(eh => eh.eventoId);
        return data.filter(item => eventoIds.includes(item['eventoId'] || item['macroEventId'] || item['id']));
      default:
        return data;
    }
  };
}

// Export singleton instance
export const db = new Database();

// Initialize on import
db.init();
