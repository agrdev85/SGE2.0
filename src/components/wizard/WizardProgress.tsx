import React from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { Check, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function WizardProgress() {
  const { 
    evento, 
    getPasosInfo, 
    irAPaso, 
    porcentajeCompletado,
    state 
  } = useWizard();

  const pasosInfo = getPasosInfo();

  const getStepStyles = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/20';
      case 'actual':
        return 'bg-primary/10 border-primary text-primary ring-2 ring-primary';
      case 'pendiente':
        return 'bg-muted border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary';
      case 'bloqueado':
        return 'bg-muted/50 border-muted-foreground/10 text-muted-foreground/50 cursor-not-allowed';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  const getIcon = (estado: string, icon: string) => {
    switch (estado) {
      case 'completado':
        return <Check className="w-4 h-4" />;
      case 'bloqueado':
        return <Lock className="w-4 h-4" />;
      default:
        return <span className="text-sm font-bold">{icon}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Configurar Evento</h2>
          {evento && (
            <p className="text-muted-foreground">{evento.name}</p>
          )}
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {porcentajeCompletado}% Completado
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress value={porcentajeCompletado} className="h-2" />
        <p className="text-sm text-muted-foreground text-right">
          {state.pasosCompletados.length}/7 pasos completados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {pasosInfo.map((paso) => (
          <button
            key={paso.numero}
            onClick={() => irAPaso(paso.numero)}
            disabled={paso.estado === 'bloqueado'}
            className={`
              flex items-center gap-2 p-3 rounded-lg border transition-all
              ${getStepStyles(paso.estado)}
            `}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${paso.estado === 'completado' ? 'bg-green-500 text-white' : ''}
              ${paso.estado === 'actual' ? 'bg-primary text-white' : ''}
              ${paso.estado === 'bloqueado' ? 'bg-muted-foreground/20' : ''}
              ${paso.estado === 'pendiente' ? 'bg-muted' : ''}
            `}>
              {getIcon(paso.estado, paso.icon)}
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className={`text-xs font-medium truncate`}>
                {paso.numero}. {paso.titulo}
              </p>
              {paso.estado === 'completado' && (
                <p className="text-xs text-green-600">Completado</p>
              )}
              {paso.estado === 'actual' && (
                <p className="text-xs text-primary">En progreso</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {state.ultimaModificacion && (
        <p className="text-xs text-muted-foreground text-center">
          Última modificación: {new Date(state.ultimaModificacion).toLocaleString('es-ES')}
          {state.modificadoPor && ` por ${state.modificadoPor}`}
        </p>
      )}
    </div>
  );
}

export default WizardProgress;
