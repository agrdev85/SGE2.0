// Export/Import Database Utilities
// Functions to export and import all SGE data

export interface ExportData {
  version: string;
  exportDate: string;
  appVersion: string;
  collections: Record<string, unknown[]>;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCounts: Record<string, number>;
  errors: string[];
}

export interface CollectionInfo {
  name: string;
  displayName: string;
  count: number;
}

const APP_VERSION = '1.0.0';

const COLLECTION_NAMES = [
  // Nomencladores
  'nomencladores_receptivos',
  'nomencladores_empresas',
  'nomencladores_hoteles',
  'nomencladores_tiposHabitacion',
  'nomencladores_tiposParticipacion',
  'nomencladores_tiposTransporte',
  'nomencladores_hotelTiposHabitacion',
  'nomencladores_eventoHotel',
  'nomencladoresEvento',
  
  // Core Entities
  'users',
  'macroEvents',
  'events',
  'eventSessions',
  'sessionAttendance',
  'salones',
  'subEventos',
  
  // Hotel & Accommodation
  'eventoHoteles',
  'eventoHotelHabitaciones',
  'eventoSalones',
  'eventoSesiones',
  
  // Activities
  'actividadesSociales',
  'reservasActividades',
  
  // Transportation
  'rutasTransporte',
  'reservasTransporte',
  
  // Registration
  'eventoTiposParticipacion',
  'registrations',
  
  // Abstracts & Reviews
  'abstracts',
  'reviews',
  'juryAssignments',
  'delegatePrograms',
  
  // Committee & Thematics
  'thematics',
  'committeeMembers',
  
  // Work Assignments
  'workAssignments',
  'programSessions',
  
  // Notifications & Emails
  'notifications',
  'emailTemplates',
  'sentEmails',
  
  // CMS
  'cms_pages',
  'cms_articles',
  'cms_categories',
  'cms_menus',
  'cms_widgets',
  'cms_settings',
  
  // Audit & System
  'auditLog',
  'wizardProgress',
] as const;

type CollectionName = typeof COLLECTION_NAMES[number];

export function getAllCollectionNames(): string[] {
  return [...COLLECTION_NAMES];
}

export function getCollectionDisplayNames(): Record<string, string> {
  return {
    'nomencladores_receptivos': 'Receptivos',
    'nomencladores_empresas': 'Empresas',
    'nomencladores_hoteles': 'Hoteles',
    'nomencladores_tiposHabitacion': 'Tipos de Habitación',
    'nomencladores_tiposParticipacion': 'Tipos de Participación',
    'nomencladores_tiposTransporte': 'Tipos de Transporte',
    'nomencladores_hotelTiposHabitacion': 'Habitaciones por Hotel',
    'nomencladores_eventoHotel': 'Eventos-Hotel',
    'nomencladoresEvento': 'Nomencladores de Evento',
    'users': 'Usuarios',
    'macroEvents': 'Macro Eventos',
    'events': 'Eventos',
    'eventSessions': 'Sesiones de Evento',
    'sessionAttendance': 'Asistencia a Sesiones',
    'salones': 'Salones',
    'subEventos': 'Sub Eventos',
    'eventoHoteles': 'Eventos-Hotel',
    'eventoHotelHabitaciones': 'Habitaciones de Evento',
    'eventoSalones': 'Salones de Evento',
    'eventoSesiones': 'Sesiones de Evento',
    'actividadesSociales': 'Actividades Sociales',
    'reservasActividades': 'Reservas de Actividades',
    'rutasTransporte': 'Rutas de Transporte',
    'reservasTransporte': 'Reservas de Transporte',
    'eventoTiposParticipacion': 'Tipos de Participación',
    'registrations': 'Registros',
    'abstracts': 'Resúmenes',
    'reviews': 'Revisiones',
    'juryAssignments': 'Asignaciones de Jury',
    'delegatePrograms': 'Programas de Delegados',
    'thematics': 'Temáticas',
    'committeeMembers': 'Miembros del Comité',
    'workAssignments': 'Asignaciones de Trabajo',
    'programSessions': 'Sesiones del Programa',
    'notifications': 'Notificaciones',
    'emailTemplates': 'Plantillas de Email',
    'sentEmails': 'Emails Enviados',
    'cms_pages': 'Páginas CMS',
    'cms_articles': 'Artículos CMS',
    'cms_categories': 'Categorías CMS',
    'cms_menus': 'Menús CMS',
    'cms_widgets': 'Widgets CMS',
    'cms_settings': 'Configuración CMS',
    'auditLog': 'Registro de Auditoría',
    'wizardProgress': 'Progreso del Wizard',
  };
}

export function exportDatabase(): ExportData {
  const collections: Record<string, unknown[]> = {};
  
  for (const collectionName of COLLECTION_NAMES) {
    try {
      const key = `db_${collectionName}`;
      const data = localStorage.getItem(key);
      if (data) {
        collections[collectionName] = JSON.parse(data);
      } else {
        collections[collectionName] = [];
      }
    } catch (error) {
      console.error(`Error exporting collection ${collectionName}:`, error);
      collections[collectionName] = [];
    }
  }

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    collections,
  };
}

export function downloadExport(): void {
  const data = exportDatabase();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `sge_backup_${date}.json`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateImportData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('El archivo no tiene el formato correcto');
    return { valid: false, errors };
  }

  const importData = data as Partial<ExportData>;

  if (!importData.version) {
    errors.push('Falta el campo "version"');
  }

  if (!importData.collections || typeof importData.collections !== 'object') {
    errors.push('Falta el campo "collections"');
  }

  if (importData.collections && typeof importData.collections === 'object') {
    const collections = importData.collections;
    const validCollections = Object.keys(collections);
    
    if (validCollections.length === 0) {
      errors.push('No hay colecciones para importar');
    }

    for (const [key, value] of Object.entries(collections)) {
      if (!Array.isArray(value)) {
        errors.push(`La colección "${key}" no es un array válido`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getImportPreview(data: unknown): CollectionInfo[] {
  const preview: CollectionInfo[] = [];
  const displayNames = getCollectionDisplayNames();

  if (!data || typeof data !== 'object' || !('collections' in data)) {
    return preview;
  }

  const importData = data as ExportData;

  for (const [key, value] of Object.entries(importData.collections)) {
    preview.push({
      name: key,
      displayName: displayNames[key] || key,
      count: Array.isArray(value) ? value.length : 0,
    });
  }

  return preview.sort((a, b) => b.count - a.count);
}

export function importDatabase(data: unknown, mode: 'replace' | 'merge' = 'replace'): ImportResult {
  const result: ImportResult = {
    success: false,
    message: '',
    importedCounts: {},
    errors: [],
  };

  const validation = validateImportData(data);
  if (!validation.valid) {
    result.errors = validation.errors;
    result.message = 'Error de validación';
    return result;
  }

  const importData = data as ExportData;
  let totalImported = 0;

  for (const [collectionName, items] of Object.entries(importData.collections)) {
    try {
      const key = `db_${collectionName}`;
      let existingData: unknown[] = [];
      
      if (mode === 'merge') {
        try {
          const existingRaw = localStorage.getItem(key);
          if (existingRaw) {
            existingData = JSON.parse(existingRaw);
          }
        } catch {
          existingData = [];
        }
      }

      let finalData: unknown[];
      let importedCount = 0;

      if (mode === 'replace') {
        finalData = items;
        importedCount = items.length;
      } else {
        const existingIds = new Set(existingData.map((item: any) => item.id));
        const newItems = (items as unknown[]).filter((item: any) => !existingIds.has(item.id));
        finalData = [...existingData, ...newItems];
        importedCount = newItems.length;
      }

      localStorage.setItem(key, JSON.stringify(finalData));
      result.importedCounts[collectionName] = importedCount;
      totalImported += importedCount;

      window.dispatchEvent(new CustomEvent('sge-data-change', { 
        detail: { collection: collectionName } 
      }));

    } catch (error) {
      const errorMsg = `Error importando "${collectionName}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  result.success = result.errors.length === 0;
  result.message = result.success 
    ? `Importación completada. ${totalImported} elementos importados.` 
    : `Importación completada con errores. ${totalImported} elementos importados.`;

  return result;
}

export function getDatabaseStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  
  for (const collectionName of COLLECTION_NAMES) {
    try {
      const key = `db_${collectionName}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        stats[collectionName] = Array.isArray(parsed) ? parsed.length : 0;
      } else {
        stats[collectionName] = 0;
      }
    } catch {
      stats[collectionName] = 0;
    }
  }

  return stats;
}

export function getTotalDataSize(): number {
  let totalSize = 0;
  
  for (const collectionName of COLLECTION_NAMES) {
    try {
      const key = `db_${collectionName}`;
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    } catch {
      // Ignore errors
    }
  }

  return totalSize;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
