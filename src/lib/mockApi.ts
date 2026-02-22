// Mock API simulating .NET Backend
// This file simulates all the REST API endpoints that would be in the real .NET backend

import { toast } from "sonner";

// Types matching the backend entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'REVIEWER' | 'COMMITTEE' | 'ADMIN';
  country: string;
  affiliation: string;
  createdAt: string;
  isActive: boolean;
  avatar?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export type AbstractStatus = 'EN_PROCESO' | 'APROBADO' | 'APROBADO_CON_CAMBIOS' | 'RECHAZADO';

export interface Abstract {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  summaryText: string;
  keywords: string[];
  authors: string[];
  status: AbstractStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  categoryType?: 'Ponencia' | 'Poster' | 'Conferencia';
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

// Mock data store (simulating database)
let mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. María García',
    email: 'maria@example.com',
    role: 'USER',
    country: 'Cuba',
    affiliation: 'Universidad de La Habana',
    createdAt: '2024-01-15',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    name: 'Dr. Carlos Rodríguez',
    email: 'carlos@example.com',
    role: 'REVIEWER',
    country: 'Cuba',
    affiliation: 'CIGB',
    createdAt: '2024-01-10',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    name: 'Dra. Ana Martínez',
    email: 'ana@example.com',
    role: 'COMMITTEE',
    country: 'Cuba',
    affiliation: 'BioCubaFarma',
    createdAt: '2024-01-05',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
  {
    id: '4',
    name: 'Admin Sistema',
    email: 'admin@example.com',
    role: 'ADMIN',
    country: 'Cuba',
    affiliation: 'Sistema',
    createdAt: '2024-01-01',
    isActive: true,
  },
];

let mockEvents: Event[] = [
  {
    id: '1',
    name: 'Congreso Internacional de Biotecnología 2024',
    description: 'El evento más importante del sector biotecnológico en América Latina. Reunimos a científicos, investigadores y empresarios para compartir los últimos avances.',
    startDate: '2024-06-15',
    endDate: '2024-06-20',
    bannerImageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=400&fit=crop',
    primaryColor: '#1e40af',
    secondaryColor: '#059669',
    isActive: true,
    createdBy: '4',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Simposio de Nanociencias 2024',
    description: 'Explorando las fronteras de la nanotecnología aplicada a las ciencias de la vida.',
    startDate: '2024-09-10',
    endDate: '2024-09-12',
    bannerImageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&h=400&fit=crop',
    primaryColor: '#7c3aed',
    secondaryColor: '#ec4899',
    isActive: true,
    createdBy: '4',
    createdAt: '2024-02-15',
  },
];

let mockAbstracts: Abstract[] = [
  {
    id: '1',
    userId: '1',
    eventId: '1',
    title: 'Nuevos avances en terapia génica para enfermedades raras',
    summaryText: 'Este trabajo presenta los últimos avances en el desarrollo de vectores virales para terapia génica, con especial énfasis en el tratamiento de enfermedades raras de origen genético. Se han obtenido resultados prometedores en modelos preclínicos que demuestran la eficacia y seguridad del enfoque propuesto.',
    keywords: ['terapia génica', 'vectores virales', 'enfermedades raras'],
    authors: ['Dr. María García', 'Dr. Juan Pérez'],
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
    summaryText: 'Presentamos el desarrollo de una vacuna basada en ARNm de tercera generación con mayor estabilidad térmica y eficacia contra variantes emergentes del SARS-CoV-2.',
    keywords: ['vacunas', 'ARNm', 'COVID-19', 'SARS-CoV-2'],
    authors: ['Dr. María García', 'Dra. Laura Sánchez'],
    status: 'APROBADO',
    version: 1,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-28',
    categoryType: 'Ponencia',
  },
  {
    id: '3',
    userId: '1',
    eventId: '1',
    title: 'Bioinformática aplicada al diseño de fármacos',
    summaryText: 'Utilizando técnicas de inteligencia artificial y aprendizaje profundo para acelerar el descubrimiento de nuevos fármacos candidatos.',
    keywords: ['bioinformática', 'IA', 'diseño de fármacos'],
    authors: ['Dr. María García'],
    status: 'APROBADO_CON_CAMBIOS',
    version: 2,
    createdAt: '2024-02-01',
    updatedAt: '2024-03-05',
  },
];

let mockReviews: Review[] = [
  {
    id: '1',
    abstractId: '2',
    reviewerId: '2',
    decision: 'APROBADO',
    comment: 'Excelente trabajo. La metodología es sólida y los resultados son significativos para el campo.',
    score: 95,
    reviewedAt: '2024-02-25',
  },
  {
    id: '2',
    abstractId: '3',
    reviewerId: '2',
    decision: 'APROBADO_CON_CAMBIOS',
    comment: 'Buen trabajo pero se requieren algunas correcciones metodológicas menores.',
    score: 78,
    reviewedAt: '2024-03-02',
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(500);
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    // In real app, would verify password
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    return { user, token };
  },

  async register(data: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<{ user: User; token: string }> {
    await delay(500);
    if (mockUsers.some(u => u.email === data.email)) {
      throw new Error('El email ya está registrado');
    }
    const newUser: User = {
      ...data,
      id: String(mockUsers.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    mockUsers.push(newUser);
    const token = btoa(JSON.stringify({ userId: newUser.id, role: newUser.role }));
    return { user: newUser, token };
  },

  async getCurrentUser(token: string): Promise<User> {
    await delay(200);
    try {
      const { userId } = JSON.parse(atob(token));
      const user = mockUsers.find(u => u.id === userId);
      if (!user) throw new Error('Usuario no encontrado');
      return user;
    } catch {
      throw new Error('Token inválido');
    }
  },
};

// Events API
export const eventsApi = {
  async getAll(): Promise<Event[]> {
    await delay(300);
    return mockEvents.filter(e => e.isActive);
  },

  async getById(id: string): Promise<Event | undefined> {
    await delay(200);
    return mockEvents.find(e => e.id === id);
  },

  async create(data: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    await delay(400);
    const newEvent: Event = {
      ...data,
      id: String(mockEvents.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockEvents.push(newEvent);
    return newEvent;
  },

  async update(id: string, data: Partial<Event>): Promise<Event> {
    await delay(400);
    const index = mockEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Evento no encontrado');
    mockEvents[index] = { ...mockEvents[index], ...data };
    return mockEvents[index];
  },
};

// Abstracts API
export const abstractsApi = {
  async getMyAbstracts(userId: string): Promise<Abstract[]> {
    await delay(300);
    return mockAbstracts.filter(a => a.userId === userId);
  },

  async getByEvent(eventId: string): Promise<Abstract[]> {
    await delay(300);
    return mockAbstracts.filter(a => a.eventId === eventId);
  },

  async getApproved(eventId: string): Promise<Abstract[]> {
    await delay(300);
    return mockAbstracts.filter(a => a.eventId === eventId && a.status === 'APROBADO');
  },

  async getPendingReview(reviewerId: string): Promise<Abstract[]> {
    await delay(300);
    // Return abstracts that are EN_PROCESO and not yet reviewed by this reviewer
    const reviewedIds = mockReviews.filter(r => r.reviewerId === reviewerId).map(r => r.abstractId);
    return mockAbstracts.filter(a => a.status === 'EN_PROCESO' && !reviewedIds.includes(a.id));
  },

  async getById(id: string): Promise<Abstract | undefined> {
    await delay(200);
    return mockAbstracts.find(a => a.id === id);
  },

  async create(data: Omit<Abstract, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'status'>): Promise<Abstract> {
    await delay(500);
    const newAbstract: Abstract = {
      ...data,
      id: String(mockAbstracts.length + 1),
      status: 'EN_PROCESO',
      version: 1,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    mockAbstracts.push(newAbstract);
    toast.success('Resumen enviado correctamente');
    return newAbstract;
  },

  async update(id: string, data: Partial<Abstract>): Promise<Abstract> {
    await delay(400);
    const index = mockAbstracts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Resumen no encontrado');
    mockAbstracts[index] = { 
      ...mockAbstracts[index], 
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
      version: mockAbstracts[index].version + 1,
    };
    return mockAbstracts[index];
  },

  async assignCategory(id: string, categoryType: 'Ponencia' | 'Poster' | 'Conferencia'): Promise<Abstract> {
    await delay(400);
    const index = mockAbstracts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Resumen no encontrado');
    mockAbstracts[index] = { ...mockAbstracts[index], categoryType };
    toast.success(`Categoría "${categoryType}" asignada correctamente`);
    return mockAbstracts[index];
  },
};

// Reviews API
export const reviewsApi = {
  async getByAbstract(abstractId: string): Promise<Review[]> {
    await delay(200);
    return mockReviews.filter(r => r.abstractId === abstractId);
  },

  async create(data: Omit<Review, 'id' | 'reviewedAt'>): Promise<Review> {
    await delay(500);
    const newReview: Review = {
      ...data,
      id: String(mockReviews.length + 1),
      reviewedAt: new Date().toISOString().split('T')[0],
    };
    mockReviews.push(newReview);

    // Update abstract status
    const abstractIndex = mockAbstracts.findIndex(a => a.id === data.abstractId);
    if (abstractIndex !== -1) {
      mockAbstracts[abstractIndex].status = data.decision;
      mockAbstracts[abstractIndex].updatedAt = new Date().toISOString().split('T')[0];
    }

    toast.success('Revisión enviada correctamente');
    return newReview;
  },
};

// Stats API
export const statsApi = {
  async getDashboardStats(userId: string, role: string): Promise<{
    totalAbstracts: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    events: number;
  }> {
    await delay(300);
    const userAbstracts = role === 'ADMIN' || role === 'COMMITTEE' 
      ? mockAbstracts 
      : mockAbstracts.filter(a => a.userId === userId);
    
    return {
      totalAbstracts: userAbstracts.length,
      pendingReview: userAbstracts.filter(a => a.status === 'EN_PROCESO').length,
      approved: userAbstracts.filter(a => a.status === 'APROBADO').length,
      rejected: userAbstracts.filter(a => a.status === 'RECHAZADO').length,
      events: mockEvents.filter(e => e.isActive).length,
    };
  },
};

// Users API (for admin)
export const usersApi = {
  async getAll(): Promise<User[]> {
    await delay(300);
    return mockUsers;
  },

  async getByRole(role: User['role']): Promise<User[]> {
    await delay(200);
    return mockUsers.filter(u => u.role === role);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    await delay(400);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  },
};
