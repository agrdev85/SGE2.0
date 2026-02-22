// Database simulation (localStorage-based persistence)
// Simulates SQLite/backend database with full CRUD operations

import { toast } from "sonner";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'USER' | 'REVIEWER' | 'COMMITTEE' | 'ADMIN';
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
  reviewerThematics?: string[]; // Temáticas que puede revisar
  isParticipant?: boolean; // Indica si también es participante registrado
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
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Initialize with seed data if empty
  init() {
    if (this.getCollection<User>('users').length === 0) {
      this.seedData();
    }
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
      {
        id: '4',
        name: 'Admin Sistema',
        email: 'admin@example.com',
        passwordHash: 'demo',
        role: 'ADMIN',
        country: 'Cuba',
        affiliation: 'Sistema',
        createdAt: '2024-01-01',
        isActive: true,
      },
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
}

// Export singleton instance
export const db = new Database();

// Initialize on import
db.init();
