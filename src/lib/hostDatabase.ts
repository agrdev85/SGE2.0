// Host Module Database (localStorage-based persistence)
// Módulo Anfitrión - Coordinador de Hotel

import { toast } from "sonner";

// ===== TYPES =====

export interface Hotel {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Salon {
  id: string;
  hotelId: string;
  nombre: string;
  capacidadTeatro: number;
  capacidadEscuela: number;
  capacidadBanquete: number;
  capacidadCoctel: number;
  recursos: string[]; // ["proyector", "pantalla", "wifi", "audio", "tv"]
  ubicacion: string;
  activo: boolean;
  color?: string; // Color for calendar display
  createdAt: string;
  updatedAt: string;
}

export interface Receptivo {
  id: string;
  nombre: string;
  tipo: 'cliente' | 'no_cliente';
  contratoActivo: boolean;
  emailContacto: string;
  telefono: string;
  pais: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioReceptivo {
  id: string;
  receptivoId: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: string;
  activo: boolean;
  ultimoAcceso?: string;
}

export type TipoEvento = 'reunion' | 'congreso' | 'conferencia' | 'coctel' | 'cena' | 'desayuno' | 'coffee_break' | 'inauguracion' | 'otro';

export type EstadoSolicitud = 'borrador' | 'enviada' | 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada' | 'convertida';

export interface SolicitudEvento {
  id: string;
  receptivoId: string;
  usuarioSolicitanteId?: string;
  numeroConsecutivo: string; // SOL-YYYY-XXXX
  nombreEvento: string;
  tipoEvento: TipoEvento;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  paxEstimado: number;
  paxConfirmado?: number;
  salonSugeridoId?: string;
  necesidadesEspeciales: string;
  estado: EstadoSolicitud;
  motivoRechazo?: string;
  fechaCreacion: string;
  fechaRespuesta?: string;
  origen: 'sistema' | 'email';
  metadata?: string;
}

export type EstadoEventoConfirmado = 'confirmado' | 'en_planificacion' | 'en_curso' | 'finalizado' | 'cancelado';

export interface EventoConfirmado {
  id: string;
  solicitudId?: string;
  receptivoId: string;
  numeroEvento: string; // EVT-YYYY-XXXX
  nombreEvento: string;
  tipoEvento: TipoEvento;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  salonId: string;
  paxConfirmado: number;
  estado: EstadoEventoConfirmado;
  requiereBeo: boolean;
  beoGenerado: boolean;
  fechaConfirmacion: string;
  notasInternas: string;
}

export type EstadoBEO = 'borrador' | 'enviado_cliente' | 'aprobado' | 'modificado' | 'ejecutado';

export interface BEO {
  id: string;
  eventoId: string;
  numeroBeo: string; // BEO-YYYY-XXXX
  version: number;
  fechaElaboracion: string;
  responsableHotel: string;
  tourLeader: string;
  fechaEvento: string;
  horarioInicio: string;
  horarioFin: string;
  lugar: string;
  tipoMontaje: string;
  paxFinal: number;
  departamentos: Record<string, string>; // { banquetes: "...", cocina: "...", etc }
  costos: {
    items: { concepto: string; cantidad: number; precioUnitario: number; total: number }[];
    total: number;
    moneda: string;
  };
  estado: EstadoBEO;
  modificado: boolean;
  motivoModificacion?: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistorialBEO {
  id: string;
  beoId: string;
  version: number;
  contenidoJson: string;
  cambiosDestacados?: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface NotificacionHost {
  id: string;
  usuarioId: string;
  tipoUsuario: 'coordinador' | 'receptivo';
  tipo: 'nueva_solicitud' | 'solicitud_aceptada' | 'solicitud_rechazada' | 'beo_aprobado' | 'beo_modificado' | 'recordatorio' | 'sistema';
  titulo: string;
  mensaje: string;
  referenciaId?: string;
  referenciaTipo?: 'solicitud' | 'evento' | 'beo';
  leido: boolean;
  fechaCreacion: string;
  fechaLectura?: string;
}

export interface ConfiguracionHotel {
  id: string;
  hotelId: string;
  horarioAtencionInicio: string;
  horarioAtencionFin: string;
  diasDescanso: string[];
  emailNotificaciones: string;
  prefijoBeo: string;
  prefijoSolicitud: string;
  prefijoEvento: string;
  formatoConsecutivo: string;
  coloresSalones: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ===== DATABASE CLASS =====

class HostDatabase {
  private getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(`host_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setCollection<T>(key: string, data: T[]): void {
    localStorage.setItem(`host_${key}`, JSON.stringify(data));
  }

  private getItem<T>(key: string): T | null {
    const data = localStorage.getItem(`host_${key}`);
    return data ? JSON.parse(data) : null;
  }

  private setItem<T>(key: string, data: T): void {
    localStorage.setItem(`host_${key}`, JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  init() {
    if (this.getCollection<Hotel>('hoteles').length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    // Hotel
    const hoteles: Hotel[] = [{
      id: 'h1',
      nombre: 'Meliá Internacional Varadero',
      direccion: 'Varadero, Cuba',
      telefono: '+53 45 123456',
      email: 'eventos@meliavaradero.cu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    this.setCollection('hoteles', hoteles);

    // Salones
    const salones: Salon[] = [
      { id: 's1', hotelId: 'h1', nombre: 'Salón Internacional I', capacidadTeatro: 120, capacidadEscuela: 80, capacidadBanquete: 100, capacidadCoctel: 150, recursos: ['proyector', 'pantalla', 'wifi', 'audio', 'tv', 'microfonos', 'podio'], ubicacion: 'Planta baja', activo: true, color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 's2', hotelId: 'h1', nombre: 'Salón Internacional II', capacidadTeatro: 120, capacidadEscuela: 80, capacidadBanquete: 100, capacidadCoctel: 150, recursos: ['proyector', 'pantalla', 'wifi', 'audio', 'tv', 'microfonos', 'podio'], ubicacion: 'Planta baja', activo: true, color: '#10b981', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 's3', hotelId: 'h1', nombre: 'Salón Internacional III', capacidadTeatro: 100, capacidadEscuela: 70, capacidadBanquete: 80, capacidadCoctel: 120, recursos: ['proyector', 'pantalla', 'wifi', 'audio', 'tv', 'microfonos'], ubicacion: 'Planta baja', activo: true, color: '#f59e0b', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 's4', hotelId: 'h1', nombre: 'Salón Varadero', capacidadTeatro: 200, capacidadEscuela: 150, capacidadBanquete: 180, capacidadCoctel: 250, recursos: ['proyector', 'pantalla', 'wifi', 'audio', 'tv', 'microfonos', 'podio', 'traduccion'], ubicacion: 'Centro de Convenciones', activo: true, color: '#8b5cf6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 's5', hotelId: 'h1', nombre: 'Salón Playa', capacidadTeatro: 80, capacidadEscuela: 50, capacidadBanquete: 60, capacidadCoctel: 100, recursos: ['wifi', 'audio', 'vista_al_mar'], ubicacion: 'Playa', activo: true, color: '#06b6d4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 's6', hotelId: 'h1', nombre: 'Terraza Centro Convenciones', capacidadTeatro: 0, capacidadEscuela: 0, capacidadBanquete: 40, capacidadCoctel: 80, recursos: ['wifi', 'exterior'], ubicacion: 'Exterior', activo: true, color: '#ec4899', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    this.setCollection('salones', salones);

    // Receptivos
    const receptivos: Receptivo[] = [
      { id: 'r1', nombre: 'Havanatur', tipo: 'cliente', contratoActivo: true, emailContacto: 'eventos@havanatur.cu', telefono: '+53 7 8341234', pais: 'Cuba', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'r2', nombre: 'Cubatur', tipo: 'cliente', contratoActivo: true, emailContacto: 'eventos@cubatur.cu', telefono: '+53 7 8345678', pais: 'Cuba', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'r3', nombre: 'Eterza', tipo: 'no_cliente', contratoActivo: false, emailContacto: 'info@eterza.com', telefono: '+34 91 1234567', pais: 'España', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'r4', nombre: 'Avanatur', tipo: 'no_cliente', contratoActivo: false, emailContacto: 'eventos@avanatur.es', telefono: '+34 93 9876543', pais: 'España', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    this.setCollection('receptivos', receptivos);

    // Usuarios receptivos
    const usuariosReceptivos: UsuarioReceptivo[] = [
      { id: 'ur1', receptivoId: 'r1', nombre: 'Carlos Pérez', email: 'carlos@havanatur.cu', passwordHash: 'demo', rol: 'solicitante', activo: true },
    ];
    this.setCollection('usuariosReceptivos', usuariosReceptivos);

    // Configuración
    const config: ConfiguracionHotel = {
      id: 'cfg1',
      hotelId: 'h1',
      horarioAtencionInicio: '09:00',
      horarioAtencionFin: '18:00',
      diasDescanso: [],
      emailNotificaciones: 'coordinadora@meliavaradero.cu',
      prefijoBeo: 'BEO',
      prefijoSolicitud: 'SOL',
      prefijoEvento: 'EVT',
      formatoConsecutivo: 'PREF-YYYY-####',
      coloresSalones: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.setItem('configuracion', config);

    // Sample solicitudes
    const solicitudes: SolicitudEvento[] = [
      {
        id: 'sol1',
        receptivoId: 'r1',
        usuarioSolicitanteId: 'ur1',
        numeroConsecutivo: 'SOL-2026-0001',
        nombreEvento: 'Congreso de Ciberseguridad 2026',
        tipoEvento: 'congreso',
        fechaInicio: '2026-03-15',
        fechaFin: '2026-03-17',
        horaInicio: '09:00',
        horaFin: '18:00',
        paxEstimado: 85,
        salonSugeridoId: 's1',
        necesidadesEspeciales: 'Proyector, 2 micrófonos inalámbricos, traducción simultánea. Coffee break mañana y tarde.',
        estado: 'pendiente',
        fechaCreacion: '2026-02-20T10:30:00Z',
        origen: 'sistema',
      },
      {
        id: 'sol2',
        receptivoId: 'r2',
        numeroConsecutivo: 'SOL-2026-0002',
        nombreEvento: 'Evento Sector Biofarmacéutico',
        tipoEvento: 'coffee_break',
        fechaInicio: '2026-03-20',
        fechaFin: '2026-03-21',
        horaInicio: '10:30',
        horaFin: '11:00',
        paxEstimado: 100,
        salonSugeridoId: 's3',
        necesidadesEspeciales: 'Café, té, jugos naturales, sándwiches.',
        estado: 'pendiente',
        fechaCreacion: '2026-02-21T14:00:00Z',
        origen: 'email',
      },
      {
        id: 'sol3',
        receptivoId: 'r1',
        usuarioSolicitanteId: 'ur1',
        numeroConsecutivo: 'SOL-2026-0003',
        nombreEvento: 'Seminario de Energías Renovables',
        tipoEvento: 'conferencia',
        fechaInicio: '2026-04-10',
        fechaFin: '2026-04-12',
        horaInicio: '08:00',
        horaFin: '17:00',
        paxEstimado: 120,
        salonSugeridoId: 's4',
        necesidadesEspeciales: 'Audio completo, podium, traducción para 10 idiomas.',
        estado: 'aceptada',
        fechaCreacion: '2026-02-15T09:00:00Z',
        fechaRespuesta: '2026-02-16T11:00:00Z',
        origen: 'sistema',
      },
    ];
    this.setCollection('solicitudes', solicitudes);

    // Sample confirmed events
    const eventosConfirmados: EventoConfirmado[] = [
      {
        id: 'ec1',
        solicitudId: 'sol3',
        receptivoId: 'r1',
        numeroEvento: 'EVT-2026-0001',
        nombreEvento: 'Seminario de Energías Renovables',
        tipoEvento: 'conferencia',
        fechaInicio: '2026-04-10',
        fechaFin: '2026-04-12',
        horaInicio: '08:00',
        horaFin: '17:00',
        salonId: 's4',
        paxConfirmado: 120,
        estado: 'confirmado',
        requiereBeo: true,
        beoGenerado: false,
        fechaConfirmacion: '2026-02-16T11:00:00Z',
        notasInternas: 'Cliente VIP, atención especial.',
      },
      {
        id: 'ec2',
        receptivoId: 'r3',
        numeroEvento: 'EVT-2026-0002',
        nombreEvento: 'Cena Corporativa Eterza',
        tipoEvento: 'cena',
        fechaInicio: '2026-03-25',
        fechaFin: '2026-03-25',
        horaInicio: '19:00',
        horaFin: '23:00',
        salonId: 's5',
        paxConfirmado: 40,
        estado: 'en_planificacion',
        requiereBeo: true,
        beoGenerado: true,
        fechaConfirmacion: '2026-02-18T15:00:00Z',
        notasInternas: 'Evento manual desde email.',
      },
    ];
    this.setCollection('eventosConfirmados', eventosConfirmados);

    // Sample BEO
    const beos: BEO[] = [
      {
        id: 'beo1',
        eventoId: 'ec2',
        numeroBeo: 'BEO-2026-0001',
        version: 1,
        fechaElaboracion: '2026-02-19',
        responsableHotel: 'Yenis Arias Alvarez',
        tourLeader: 'María Rodríguez',
        fechaEvento: '2026-03-25',
        horarioInicio: '19:00',
        horarioFin: '23:00',
        lugar: 'Salón Playa',
        tipoMontaje: 'Banquete',
        paxFinal: 40,
        departamentos: {
          'Banquetes / Montaje A&B': '• Montaje banquete para 40 pax\n• Decoración con flores naturales\n• Cristalería premium',
          'Cocina': '• Menú 4 tiempos\n• Opciones vegetarianas: 5 personas\n• Mariscos como plato principal',
          'Informáticos': '• Sistema de audio ambiente\n• Iluminación regulable\n• Proyector para presentación',
          'Mantenimiento': '• Aire acondicionado desde 17:00\n• Iluminación exterior terraza',
          'Ama de Llaves': '• Limpieza salón antes y después\n• Baños impecables durante el evento',
        },
        costos: {
          items: [
            { concepto: 'Alquiler salón', cantidad: 1, precioUnitario: 50000, total: 50000 },
            { concepto: 'Cena 4 tiempos', cantidad: 40, precioUnitario: 2500, total: 100000 },
            { concepto: 'Barra libre', cantidad: 40, precioUnitario: 1500, total: 60000 },
            { concepto: 'Decoración', cantidad: 1, precioUnitario: 25000, total: 25000 },
          ],
          total: 235000,
          moneda: 'CUP',
        },
        estado: 'borrador',
        modificado: false,
        createdAt: '2026-02-19T10:00:00Z',
        updatedAt: '2026-02-19T10:00:00Z',
      },
    ];
    this.setCollection('beos', beos);

    // Sample notifications
    const notificaciones: NotificacionHost[] = [
      { id: 'nh1', usuarioId: 'coordinador', tipoUsuario: 'coordinador', tipo: 'nueva_solicitud', titulo: '📨 Nueva solicitud de evento', mensaje: 'Havanatur ha solicitado "Congreso de Ciberseguridad 2026" para el 15/03/2026', referenciaId: 'sol1', referenciaTipo: 'solicitud', leido: false, fechaCreacion: '2026-02-20T10:30:00Z' },
      { id: 'nh2', usuarioId: 'coordinador', tipoUsuario: 'coordinador', tipo: 'nueva_solicitud', titulo: '📨 Nueva solicitud (email)', mensaje: 'Cubatur solicita coffee break para "Evento Sector Biofarmacéutico" el 20/03/2026', referenciaId: 'sol2', referenciaTipo: 'solicitud', leido: false, fechaCreacion: '2026-02-21T14:00:00Z' },
      { id: 'nh3', usuarioId: 'coordinador', tipoUsuario: 'coordinador', tipo: 'sistema', titulo: '✅ Evento confirmado', mensaje: 'El evento "Seminario de Energías Renovables" ha sido confirmado', referenciaId: 'ec1', referenciaTipo: 'evento', leido: true, fechaCreacion: '2026-02-16T11:00:00Z' },
    ];
    this.setCollection('notificaciones', notificaciones);
  }

  // ===== CONSECUTIVE NUMBER GENERATION =====
  private generateConsecutive(prefix: string, collection: string, field: string): string {
    const year = new Date().getFullYear();
    const items = this.getCollection<any>(collection);
    const yearItems = items.filter((i: any) => i[field]?.includes(`${prefix}-${year}`));
    const num = yearItems.length + 1;
    return `${prefix}-${year}-${String(num).padStart(4, '0')}`;
  }

  // ===== HOTELES =====
  hoteles = {
    getAll: (): Hotel[] => this.getCollection<Hotel>('hoteles'),
    getById: (id: string): Hotel | undefined => this.getCollection<Hotel>('hoteles').find(h => h.id === id),
    getFirst: (): Hotel | undefined => this.getCollection<Hotel>('hoteles')[0],
    update: (id: string, data: Partial<Hotel>): Hotel => {
      const items = this.getCollection<Hotel>('hoteles');
      const idx = items.findIndex(h => h.id === id);
      if (idx === -1) throw new Error('Hotel no encontrado');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('hoteles', items);
      return items[idx];
    },
  };

  // ===== SALONES =====
  salones = {
    getAll: (): Salon[] => this.getCollection<Salon>('salones').filter(s => s.activo),
    getAllIncludingInactive: (): Salon[] => this.getCollection<Salon>('salones'),
    getById: (id: string): Salon | undefined => this.getCollection<Salon>('salones').find(s => s.id === id),
    getByHotel: (hotelId: string): Salon[] => this.getCollection<Salon>('salones').filter(s => s.hotelId === hotelId && s.activo),
    create: (data: Omit<Salon, 'id' | 'createdAt' | 'updatedAt'>): Salon => {
      const items = this.getCollection<Salon>('salones');
      const item: Salon = { ...data, id: this.generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
      const items = this.getCollection<Salon>('salones').filter(s => s.id !== id);
      this.setCollection('salones', items);
    },
  };

  // ===== RECEPTIVOS =====
  receptivos = {
    getAll: (): Receptivo[] => this.getCollection<Receptivo>('receptivos'),
    getById: (id: string): Receptivo | undefined => this.getCollection<Receptivo>('receptivos').find(r => r.id === id),
    getClientes: (): Receptivo[] => this.getCollection<Receptivo>('receptivos').filter(r => r.tipo === 'cliente'),
    getNoClientes: (): Receptivo[] => this.getCollection<Receptivo>('receptivos').filter(r => r.tipo === 'no_cliente'),
    create: (data: Omit<Receptivo, 'id' | 'createdAt' | 'updatedAt'>): Receptivo => {
      const items = this.getCollection<Receptivo>('receptivos');
      const item: Receptivo = { ...data, id: this.generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      items.push(item);
      this.setCollection('receptivos', items);
      return item;
    },
    update: (id: string, data: Partial<Receptivo>): Receptivo => {
      const items = this.getCollection<Receptivo>('receptivos');
      const idx = items.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('Receptivo no encontrado');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('receptivos', items);
      return items[idx];
    },
    delete: (id: string): void => {
      const items = this.getCollection<Receptivo>('receptivos').filter(r => r.id !== id);
      this.setCollection('receptivos', items);
    },
  };

  // ===== SOLICITUDES =====
  solicitudes = {
    getAll: (): SolicitudEvento[] => this.getCollection<SolicitudEvento>('solicitudes').sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()),
    getById: (id: string): SolicitudEvento | undefined => this.getCollection<SolicitudEvento>('solicitudes').find(s => s.id === id),
    getByEstado: (estado: EstadoSolicitud): SolicitudEvento[] => this.getCollection<SolicitudEvento>('solicitudes').filter(s => s.estado === estado),
    getPendientes: (): SolicitudEvento[] => this.getCollection<SolicitudEvento>('solicitudes').filter(s => s.estado === 'pendiente'),
    getByReceptivo: (receptivoId: string): SolicitudEvento[] => this.getCollection<SolicitudEvento>('solicitudes').filter(s => s.receptivoId === receptivoId),

    create: (data: Omit<SolicitudEvento, 'id' | 'fechaCreacion' | 'numeroConsecutivo'>): SolicitudEvento => {
      const items = this.getCollection<SolicitudEvento>('solicitudes');
      const item: SolicitudEvento = {
        ...data,
        id: this.generateId(),
        numeroConsecutivo: this.generateConsecutive('SOL', 'solicitudes', 'numeroConsecutivo'),
        fechaCreacion: new Date().toISOString(),
      };
      items.push(item);
      this.setCollection('solicitudes', items);
      // Notify coordinator
      this.notificaciones.create({
        usuarioId: 'coordinador',
        tipoUsuario: 'coordinador',
        tipo: 'nueva_solicitud',
        titulo: '📨 Nueva solicitud de evento',
        mensaje: `Nueva solicitud: "${data.nombreEvento}"`,
        referenciaId: item.id,
        referenciaTipo: 'solicitud',
      });
      return item;
    },

    update: (id: string, data: Partial<SolicitudEvento>): SolicitudEvento => {
      const items = this.getCollection<SolicitudEvento>('solicitudes');
      const idx = items.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Solicitud no encontrada');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('solicitudes', items);
      return items[idx];
    },

    aceptar: (id: string, salonId?: string): { solicitud: SolicitudEvento; evento: EventoConfirmado } => {
      const solicitud = this.solicitudes.getById(id);
      if (!solicitud) throw new Error('Solicitud no encontrada');

      const updatedSolicitud = this.solicitudes.update(id, {
        estado: 'aceptada',
        fechaRespuesta: new Date().toISOString(),
      });

      // Create confirmed event
      const evento = this.eventosConfirmados.create({
        solicitudId: id,
        receptivoId: solicitud.receptivoId,
        nombreEvento: solicitud.nombreEvento,
        tipoEvento: solicitud.tipoEvento,
        fechaInicio: solicitud.fechaInicio,
        fechaFin: solicitud.fechaFin,
        horaInicio: solicitud.horaInicio,
        horaFin: solicitud.horaFin,
        salonId: salonId || solicitud.salonSugeridoId || '',
        paxConfirmado: solicitud.paxEstimado,
        estado: 'confirmado',
        requiereBeo: true,
        beoGenerado: false,
        notasInternas: '',
      });

      // Update solicitud to 'convertida'
      this.solicitudes.update(id, { estado: 'convertida' });

      // Notify
      this.notificaciones.create({
        usuarioId: solicitud.usuarioSolicitanteId || solicitud.receptivoId,
        tipoUsuario: 'receptivo',
        tipo: 'solicitud_aceptada',
        titulo: '✅ Solicitud aceptada',
        mensaje: `Tu solicitud para "${solicitud.nombreEvento}" ha sido aceptada.`,
        referenciaId: id,
        referenciaTipo: 'solicitud',
      });

      return { solicitud: updatedSolicitud, evento };
    },

    rechazar: (id: string, motivo: string): SolicitudEvento => {
      const solicitud = this.solicitudes.getById(id);
      if (!solicitud) throw new Error('Solicitud no encontrada');
      const updated = this.solicitudes.update(id, {
        estado: 'rechazada',
        motivoRechazo: motivo,
        fechaRespuesta: new Date().toISOString(),
      });
      this.notificaciones.create({
        usuarioId: solicitud.usuarioSolicitanteId || solicitud.receptivoId,
        tipoUsuario: 'receptivo',
        tipo: 'solicitud_rechazada',
        titulo: '❌ Solicitud rechazada',
        mensaje: `Tu solicitud para "${solicitud.nombreEvento}" ha sido rechazada. Motivo: ${motivo}`,
        referenciaId: id,
        referenciaTipo: 'solicitud',
      });
      return updated;
    },
  };

  // ===== EVENTOS CONFIRMADOS =====
  eventosConfirmados = {
    getAll: (): EventoConfirmado[] => this.getCollection<EventoConfirmado>('eventosConfirmados').sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
    getById: (id: string): EventoConfirmado | undefined => this.getCollection<EventoConfirmado>('eventosConfirmados').find(e => e.id === id),
    getByEstado: (estado: EstadoEventoConfirmado): EventoConfirmado[] => this.getCollection<EventoConfirmado>('eventosConfirmados').filter(e => e.estado === estado),
    getBySalon: (salonId: string): EventoConfirmado[] => this.getCollection<EventoConfirmado>('eventosConfirmados').filter(e => e.salonId === salonId),
    getByReceptivo: (receptivoId: string): EventoConfirmado[] => this.getCollection<EventoConfirmado>('eventosConfirmados').filter(e => e.receptivoId === receptivoId),
    getProximos: (days: number = 7): EventoConfirmado[] => {
      const now = new Date();
      const limit = new Date(now.getTime() + days * 86400000);
      return this.getCollection<EventoConfirmado>('eventosConfirmados')
        .filter(e => {
          const start = new Date(e.fechaInicio);
          return start >= now && start <= limit && e.estado !== 'cancelado' && e.estado !== 'finalizado';
        })
        .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
    },

    create: (data: Omit<EventoConfirmado, 'id' | 'fechaConfirmacion' | 'numeroEvento'>): EventoConfirmado => {
      const items = this.getCollection<EventoConfirmado>('eventosConfirmados');
      const item: EventoConfirmado = {
        ...data,
        id: this.generateId(),
        numeroEvento: this.generateConsecutive('EVT', 'eventosConfirmados', 'numeroEvento'),
        fechaConfirmacion: new Date().toISOString(),
      };
      items.push(item);
      this.setCollection('eventosConfirmados', items);
      return item;
    },

    update: (id: string, data: Partial<EventoConfirmado>): EventoConfirmado => {
      const items = this.getCollection<EventoConfirmado>('eventosConfirmados');
      const idx = items.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Evento no encontrado');
      items[idx] = { ...items[idx], ...data };
      this.setCollection('eventosConfirmados', items);
      return items[idx];
    },

    delete: (id: string): void => {
      const items = this.getCollection<EventoConfirmado>('eventosConfirmados').filter(e => e.id !== id);
      this.setCollection('eventosConfirmados', items);
    },
  };

  // ===== DISPONIBILIDAD =====
  verificarDisponibilidad = (fechaInicio: string, fechaFin: string, salonId: string, excluirEventoId?: string): { disponible: boolean; conflictos: EventoConfirmado[]; mensaje: string } => {
    const eventos = this.getCollection<EventoConfirmado>('eventosConfirmados')
      .filter(e => {
        if (excluirEventoId && e.id === excluirEventoId) return false;
        if (e.estado === 'cancelado') return false;
        if (e.salonId !== salonId) return false;
        // Check date overlap
        return e.fechaInicio <= fechaFin && e.fechaFin >= fechaInicio;
      });

    const solicitudes = this.getCollection<SolicitudEvento>('solicitudes')
      .filter(s => {
        if (s.estado !== 'pendiente' && s.estado !== 'aceptada') return false;
        if (s.salonSugeridoId !== salonId) return false;
        return s.fechaInicio <= fechaFin && s.fechaFin >= fechaInicio;
      });

    const conflictos = eventos;
    const disponible = conflictos.length === 0 && solicitudes.length === 0;
    const mensaje = conflictos.length > 0
      ? `${conflictos.length} evento(s) confirmado(s) en esas fechas`
      : solicitudes.length > 0
      ? `${solicitudes.length} solicitud(es) pendiente(s) en esas fechas`
      : 'Disponible';

    return { disponible, conflictos, mensaje };
  };

  // ===== BEOs =====
  beos = {
    getAll: (): BEO[] => this.getCollection<BEO>('beos').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getById: (id: string): BEO | undefined => this.getCollection<BEO>('beos').find(b => b.id === id),
    getByEvento: (eventoId: string): BEO[] => this.getCollection<BEO>('beos').filter(b => b.eventoId === eventoId).sort((a, b) => b.version - a.version),
    getByEstado: (estado: EstadoBEO): BEO[] => this.getCollection<BEO>('beos').filter(b => b.estado === estado),

    create: (data: Omit<BEO, 'id' | 'createdAt' | 'updatedAt' | 'numeroBeo' | 'version'>): BEO => {
      const items = this.getCollection<BEO>('beos');
      const item: BEO = {
        ...data,
        id: this.generateId(),
        numeroBeo: this.generateConsecutive('BEO', 'beos', 'numeroBeo'),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      items.push(item);
      this.setCollection('beos', items);
      // Mark event as beoGenerado
      this.eventosConfirmados.update(data.eventoId, { beoGenerado: true });
      return item;
    },

    update: (id: string, data: Partial<BEO>): BEO => {
      const items = this.getCollection<BEO>('beos');
      const idx = items.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('BEO no encontrado');
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      this.setCollection('beos', items);
      return items[idx];
    },

    enviar: (id: string): BEO => {
      return this.beos.update(id, { estado: 'enviado_cliente', fechaEnvio: new Date().toISOString() });
    },

    aprobar: (id: string): BEO => {
      return this.beos.update(id, { estado: 'aprobado', fechaAprobacion: new Date().toISOString() });
    },

    modificar: (id: string, cambios: Partial<BEO>, motivo: string, usuario: string): BEO => {
      const original = this.beos.getById(id);
      if (!original) throw new Error('BEO no encontrado');

      // Save history
      this.historialBeo.create({
        beoId: id,
        version: original.version,
        contenidoJson: JSON.stringify(original),
        creadoPor: usuario,
      });

      // Update BEO
      return this.beos.update(id, {
        ...cambios,
        version: original.version + 1,
        modificado: true,
        motivoModificacion: motivo,
        estado: 'modificado',
      });
    },

    delete: (id: string): void => {
      const items = this.getCollection<BEO>('beos').filter(b => b.id !== id);
      this.setCollection('beos', items);
    },
  };

  // ===== HISTORIAL BEO =====
  historialBeo = {
    getByBeo: (beoId: string): HistorialBEO[] => this.getCollection<HistorialBEO>('historialBeo').filter(h => h.beoId === beoId).sort((a, b) => b.version - a.version),
    create: (data: Omit<HistorialBEO, 'id' | 'fechaCreacion'>): HistorialBEO => {
      const items = this.getCollection<HistorialBEO>('historialBeo');
      const item: HistorialBEO = { ...data, id: this.generateId(), fechaCreacion: new Date().toISOString() };
      items.push(item);
      this.setCollection('historialBeo', items);
      return item;
    },
  };

  // ===== NOTIFICACIONES HOST =====
  notificaciones = {
    getAll: (): NotificacionHost[] => this.getCollection<NotificacionHost>('notificaciones').sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()),
    getNoLeidas: (): NotificacionHost[] => this.getCollection<NotificacionHost>('notificaciones').filter(n => !n.leido),
    getCountNoLeidas: (): number => this.getCollection<NotificacionHost>('notificaciones').filter(n => !n.leido).length,
    create: (data: Omit<NotificacionHost, 'id' | 'leido' | 'fechaCreacion'>): NotificacionHost => {
      const items = this.getCollection<NotificacionHost>('notificaciones');
      const item: NotificacionHost = { ...data, id: this.generateId(), leido: false, fechaCreacion: new Date().toISOString() };
      items.push(item);
      this.setCollection('notificaciones', items);
      return item;
    },
    marcarLeida: (id: string): void => {
      const items = this.getCollection<NotificacionHost>('notificaciones');
      const idx = items.findIndex(n => n.id === id);
      if (idx !== -1) { items[idx].leido = true; items[idx].fechaLectura = new Date().toISOString(); }
      this.setCollection('notificaciones', items);
    },
    marcarTodasLeidas: (): void => {
      const items = this.getCollection<NotificacionHost>('notificaciones');
      items.forEach(n => { n.leido = true; n.fechaLectura = new Date().toISOString(); });
      this.setCollection('notificaciones', items);
    },
  };

  // ===== CONFIGURACIÓN =====
  configuracion = {
    get: (): ConfiguracionHotel | null => this.getItem<ConfiguracionHotel>('configuracion'),
    update: (data: Partial<ConfiguracionHotel>): ConfiguracionHotel => {
      const current = this.getItem<ConfiguracionHotel>('configuracion');
      if (!current) throw new Error('Configuración no encontrada');
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      this.setItem('configuracion', updated);
      return updated;
    },
  };

  // ===== CALENDAR EVENTS =====
  getCalendarEvents = (startDate: string, endDate: string, salonFilter?: string): { id: string; title: string; start: string; end: string; color: string; type: 'evento' | 'solicitud'; resourceId: string; data: any }[] => {
    const eventos = this.eventosConfirmados.getAll()
      .filter(e => e.fechaInicio <= endDate && e.fechaFin >= startDate && e.estado !== 'cancelado')
      .filter(e => !salonFilter || e.salonId === salonFilter);

    const solicitudes = this.solicitudes.getAll()
      .filter(s => (s.estado === 'pendiente' || s.estado === 'aceptada'))
      .filter(s => s.fechaInicio <= endDate && s.fechaFin >= startDate)
      .filter(s => !salonFilter || s.salonSugeridoId === salonFilter);

    const salon = (id: string) => this.salones.getById(id);

    return [
      ...eventos.map(e => ({
        id: `evt-${e.id}`,
        title: e.nombreEvento,
        start: `${e.fechaInicio}T${e.horaInicio}`,
        end: `${e.fechaFin}T${e.horaFin}`,
        color: salon(e.salonId)?.color || '#22c55e',
        type: 'evento' as const,
        resourceId: e.salonId,
        data: e,
      })),
      ...solicitudes.map(s => ({
        id: `sol-${s.id}`,
        title: `📋 ${s.nombreEvento}`,
        start: `${s.fechaInicio}T${s.horaInicio}`,
        end: `${s.fechaFin}T${s.horaFin}`,
        color: '#eab308',
        type: 'solicitud' as const,
        resourceId: s.salonSugeridoId || '',
        data: s,
      })),
    ];
  };

  // ===== STATS =====
  getStats = () => {
    const solicitudes = this.solicitudes.getAll();
    const eventos = this.eventosConfirmados.getAll();
    const beos = this.beos.getAll();
    return {
      solicitudesPendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
      solicitudesTotal: solicitudes.length,
      eventosConfirmados: eventos.filter(e => e.estado === 'confirmado' || e.estado === 'en_planificacion').length,
      eventosEnCurso: eventos.filter(e => e.estado === 'en_curso').length,
      eventosFinalizados: eventos.filter(e => e.estado === 'finalizado').length,
      beoBorradores: beos.filter(b => b.estado === 'borrador').length,
      beoEnviados: beos.filter(b => b.estado === 'enviado_cliente').length,
      beoAprobados: beos.filter(b => b.estado === 'aprobado').length,
      notificacionesNoLeidas: this.notificaciones.getCountNoLeidas(),
    };
  };
}

export const hostDb = new HostDatabase();
hostDb.init();
