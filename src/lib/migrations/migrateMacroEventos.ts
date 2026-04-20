import { db, MacroEvent } from '@/lib/database';

interface MigrationResult {
  success: boolean;
  eventosMigrados: number;
  subEventosMigrados: number;
  errores: string[];
}

export async function migrateMacroEventos(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    eventosMigrados: 0,
    subEventosMigrados: 0,
    errores: [],
  };

  try {
    const macroEventos = db.macroEvents.getAll();

    for (const macro of macroEventos) {
      try {
        const tasasPorDefecto = { USD: 120, EUR: 130 };
        
        db.macroEvents.update(macro.id, {
          monedaPrincipal: 'USD',
          tasasCambio: tasasPorDefecto,
          estadoConfiguracion: 'CONFIGURACION',
          pasoActual: 9,
        } as any);

        result.eventosMigrados++;
      } catch (error: any) {
        result.errores.push(`Error migrando ${macro.id}: ${error.message}`);
      }
    }

    result.success = true;
  } catch (error: any) {
    result.errores.push(`Error general: ${error.message}`);
  }

  return result;
}

export function getMigrationStatus(): { necesitaMigracion: boolean; count: number } {
  const macroEventos = db.macroEvents.getAll();
  const necesitaMigracion = macroEventos.some(m => !(m as any).monedaPrincipal);
  
  return {
    necesitaMigracion,
    count: macroEventos.length,
  };
}

export function runMigrationIfNeeded(): MigrationResult | null {
  const status = getMigrationStatus();
  
  if (!status.necesitaMigracion) {
    return null;
  }

  const result: MigrationResult = {
    success: false,
    eventosMigrados: 0,
    subEventosMigrados: 0,
    errores: [],
  };

  const macroEventos = db.macroEvents.getAll();

  for (const macro of macroEventos) {
    try {
      if (!(macro as any).monedaPrincipal) {
        db.macroEvents.update(macro.id, {
          monedaPrincipal: 'USD',
          tasasCambio: { USD: 120, EUR: 130 },
          estadoConfiguracion: 'CONFIGURACION',
          pasoActual: 9,
        } as any);

        result.eventosMigrados++;
      }
    } catch (error: any) {
      result.errores.push(`Error migrando ${macro.id}: ${error.message}`);
    }
  }

  result.success = result.errores.length === 0;
  return result;
}

export default runMigrationIfNeeded;
