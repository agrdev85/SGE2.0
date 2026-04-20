import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Check, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallpaperConfig, getAuroraPreset } from '@/hooks/useWallpaperConfig';

export type ConfirmationVariant = 'danger' | 'success' | 'warning' | 'info';

export interface ConfirmationDialogOptions {
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  autoClose?: number;
}

export interface SuccessDialogOptions {
  title?: string;
  description?: string;
  icon?: 'success' | 'error' | 'info';
  autoClose?: number;
}

interface DialogInstance {
  id: string;
  type: 'confirmation' | 'success';
  open: boolean;
  options: ConfirmationDialogOptions | SuccessDialogOptions;
  resolve: (value: boolean | void) => void;
}

interface DialogContextType {
  showConfirmation: (options: ConfirmationDialogOptions) => Promise<boolean>;
  showSuccess: (options: SuccessDialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

let globalShowConfirmation: ((options: ConfirmationDialogOptions) => Promise<boolean>) | null = null;
let globalShowSuccess: ((options: SuccessDialogOptions) => Promise<void>) | null = null;

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    return {
      showConfirmation: async () => false,
      showSuccess: async () => {},
    };
  }
  return context;
}

const variantStyles = {
  danger: {
    icon: X,
    iconClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    confirmClass: 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white',
    borderClass: 'border-red-200/50 dark:border-red-800/30',
    progressColor: '#ef4444',
  },
  success: {
    icon: Check,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    confirmClass: 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white',
    borderClass: 'border-emerald-200/50 dark:border-emerald-800/30',
    progressColor: '#10b981',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    confirmClass: 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white',
    borderClass: 'border-amber-200/50 dark:border-amber-800/30',
    progressColor: '#f59e0b',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    confirmClass: 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white',
    borderClass: 'border-blue-200/50 dark:border-blue-800/30',
    progressColor: '#3b82f6',
  },
};

function AuroraOverlay({ colors, speed = 15, intensity = 60 }: { colors: string[]; speed?: number; intensity?: number }) {
  const baseOpacity = intensity / 100;
  const speedMultiplier = 15 / speed;
  
  return (
    <>
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${colors.map((c, i) => `${c} ${(i / colors.length) * 100}%`).join(', ')})`,
          opacity: baseOpacity * 0.3,
        }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-[var(--aurora-opacity)]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="aurora-blur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g filter="url(#aurora-blur)">
          {colors.map((color, i) => (
            <ellipse
              key={i}
              cx={`${20 + i * 25}%`}
              cy={`${30 + Math.sin(i) * 20}%`}
              rx="30%"
              ry="40%"
              fill={color}
              style={{
                animation: `auroraFloat ${8 / speedMultiplier}s ease-in-out infinite alternate`,
                animationDelay: `${i * 1.5}s`,
              }}
            />
          ))}
        </g>
      </svg>
      <style>{`
        @keyframes auroraFloat {
          0% { transform: translateY(0) scale(1); opacity: ${baseOpacity}; }
          100% { transform: translateY(-10%) scale(1.1); opacity: ${baseOpacity * 0.7}; }
        }
      `}</style>
    </>
  );
}

function AnimatedCheckSVG({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} viewBox="0 0 52 52" fill="none">
      <circle 
        className="check-circle" 
        cx="26" 
        cy="26" 
        r="24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        className="check-path" 
        d="M14 27l7 7 16-16" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <style>{`
        .check-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .check-path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
        }
        @keyframes strokeCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

function AnimatedXSVG({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} viewBox="0 0 52 52" fill="none">
      <circle 
        className="x-circle" 
        cx="26" 
        cy="26" 
        r="24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        className="x-path" 
        d="M17 17l18 18M35 17l-18 18" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`
        .x-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeCircle 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .x-path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: strokeX 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
        }
        @keyframes strokeCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeX {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

function AnimatedInfoSVG({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} viewBox="0 0 52 52" fill="none">
      <circle 
        className="info-circle" 
        cx="26" 
        cy="26" 
        r="24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        className="info-path" 
        d="M26 16v12M26 34v2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`
        .info-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeCircle 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .info-path {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: strokeInfo 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
        }
        @keyframes strokeCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeInfo {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

function ProgressBar({ duration, color }: { duration: number; color: string }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 rounded-b-2xl overflow-hidden">
      <div 
        className="h-full transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
    </div>
  );
}

function DialogContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {children}
    </div>
  );
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([]);
  const { config: wallpaperConfig, getCurrentBackground } = useWallpaperConfig();
  
  const showConfirmation = useCallback((options: ConfirmationDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = `confirm-${Date.now()}-${Math.random()}`;
      setDialogs(prev => [...prev, {
        id,
        type: 'confirmation',
        open: true,
        options,
        resolve: (value) => {
          resolve(value as boolean);
          setDialogs(prev => prev.filter(d => d.id !== id));
        },
      }]);
    });
  }, []);

  const showSuccess = useCallback((options: SuccessDialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      const id = `success-${Date.now()}-${Math.random()}`;
      setDialogs(prev => [...prev, {
        id,
        type: 'success',
        open: true,
        options,
        resolve: () => {
          resolve();
          setDialogs(prev => prev.filter(d => d.id !== id));
        },
      }]);

      const autoClose = options.autoClose || 2500;
      setTimeout(() => {
        setDialogs(prev => {
          const dialog = prev.find(d => d.id === id);
          if (dialog) dialog.resolve();
          return prev.filter(d => d.id !== id);
        });
      }, autoClose);
    });
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (!open) {
      setDialogs(prev => {
        const dialog = prev.find(d => d.id === id);
        if (dialog && dialog.type === 'confirmation') dialog.resolve(false);
        return prev.filter(d => d.id !== id);
      });
    }
  }, []);

  useEffect(() => {
    globalShowConfirmation = showConfirmation;
    globalShowSuccess = showSuccess;
    return () => {
      globalShowConfirmation = null;
      globalShowSuccess = null;
    };
  }, [showConfirmation, showSuccess]);

  return (
    <DialogContext.Provider value={{ showConfirmation, showSuccess }}>
      {children}
      {dialogs.map(dialog => {
        const isConfirmation = dialog.type === 'confirmation';
        const opts = dialog.options as ConfirmationDialogOptions;
        const successOpts = dialog.options as SuccessDialogOptions;
        const background = getCurrentBackground();
        const isAurora = background?.startsWith('aurora:') || false;
        const isDefault = background === 'default:glass';
        const auroraPresetId = isAurora ? background.replace('aurora:', '') : null;
        const auroraPreset = auroraPresetId ? getAuroraPreset(auroraPresetId) : null;

        const variant = isConfirmation ? (opts.variant || 'danger') : 'success';
        const style = variantStyles[variant];

        const IconComponent = variant === 'danger' 
          ? ({ className }: { className?: string }) => <AnimatedXSVG className={className} />
          : variant === 'success'
          ? ({ className }: { className?: string }) => <AnimatedCheckSVG className={className} />
          : ({ className }: { className?: string }) => <AnimatedInfoSVG className={className} />;

        return (
          <DialogContainer key={dialog.id}>
            <AlertDialogPrimitive.Root open={dialog.open} onOpenChange={(open) => handleOpenChange(dialog.id, open)}>
              <AlertDialogPrimitive.Portal>
                <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[100] animate-fade-in" style={{
                  filter: `brightness(${wallpaperConfig.brightness / 100}) saturate(${wallpaperConfig.saturation / 100})`,
                }}>
                  {isDefault ? (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                  ) : isAurora && auroraPreset ? (
                    <AuroraOverlay colors={auroraPreset.colors} intensity={wallpaperConfig.auroraIntensity} speed={wallpaperConfig.auroraSpeed} />
                  ) : (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${background})` }}
                    />
                  )}
                  <div 
                    className="absolute inset-0 backdrop-blur-sm"
                    style={{ background: `rgba(0,0,0,${1 - wallpaperConfig.opacity / 100})` }}
                  />
                </AlertDialogPrimitive.Overlay>

                <AlertDialogPrimitive.Content
                  className={cn(
                    'fixed left-1/2 top-1/2 z-[101]',
                    '-translate-x-1/2 -translate-y-1/2',
                    'w-full max-w-md',
                    'bg-background/95 backdrop-blur-xl',
                    'border border-border/50',
                    'rounded-2xl',
                    'shadow-2xl shadow-black/20',
                    'animate-dialog-enter',
                  )}
                >
                  <div className={cn('relative p-8', !isConfirmation && style.bgClass)}>
                    <div className={cn('flex justify-center mb-6', style.iconClass)}>
                      <IconComponent className={style.iconClass} />
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-semibold text-foreground tracking-tight">
                        {isConfirmation ? (opts.title || '¿Está seguro?') : (successOpts.title || 'Operación exitosa')}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isConfirmation 
                          ? (opts.description || 'Esta acción no se puede deshacer.')
                          : (successOpts.description || '')}
                      </p>
                      {isConfirmation && opts.itemName && (
                        <p className="font-medium text-foreground pt-1">{opts.itemName}</p>
                      )}
                    </div>

                    <div className={cn('flex gap-3 mt-8', isConfirmation ? 'justify-center' : 'justify-center')}>
                      {isConfirmation && (
                        <>
                          <button
                            onClick={() => dialog.resolve(false)}
                            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors bg-muted hover:bg-muted/80 text-foreground"
                          >
                            {opts.cancelText || 'Cancelar'}
                          </button>
                          <button
                            onClick={() => dialog.resolve(true)}
                            className={cn(
                              'px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-colors',
                              style.confirmClass
                            )}
                          >
                            {opts.confirmText || 'Confirmar'}
                          </button>
                        </>
                      )}
                      {!isConfirmation && (
                        <button
                          onClick={() => dialog.resolve()}
                          className="px-6 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          Aceptar
                        </button>
                      )}
                    </div>
                  </div>

                  {isConfirmation && opts.autoClose && (
                    <ProgressBar duration={opts.autoClose} color={style.progressColor} />
                  )}
                  {!isConfirmation && successOpts.autoClose && (
                    <ProgressBar duration={successOpts.autoClose} color={style.progressColor} />
                  )}
                </AlertDialogPrimitive.Content>
              </AlertDialogPrimitive.Portal>
            </AlertDialogPrimitive.Root>
          </DialogContainer>
        );
      })}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dialog-enter {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-48%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(-50%) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-dialog-enter {
          animation: dialog-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </DialogContext.Provider>
  );
}

export function useConfirmation() {
  const context = useDialog();
  return {
    confirm: context.showConfirmation,
    success: context.showSuccess,
  };
}

function LegacyConfirmationDialogComponent(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  successMessage?: string;
  autoCloseDelay?: number;
}) {
  const { confirm, success } = useConfirmation();
  const hasOpenedRef = React.useRef(false);
  
  React.useEffect(() => {
    if (props.open && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      confirm({
        title: props.title,
        description: props.description,
        itemName: props.itemName,
        itemType: props.itemType,
        confirmText: props.confirmText,
        cancelText: props.cancelText,
        variant: props.variant,
      }).then(async (result) => {
        if (result && props.onConfirm) {
          await props.onConfirm();
          if (props.successMessage) {
            await success({
              title: '¡Completado!',
              description: props.successMessage,
              autoClose: props.autoCloseDelay || 2500,
            });
          }
        }
        if (props.onOpenChange) props.onOpenChange(false);
        hasOpenedRef.current = false;
      });
    }
    return () => { hasOpenedRef.current = false; };
  }, [props.open]);

  return null;
}

const ConfirmationDialogComponent = Object.assign(LegacyConfirmationDialogComponent, {
  show: async (options: ConfirmationDialogOptions) => {
    if (globalShowConfirmation) return globalShowConfirmation(options);
    return false;
  },
});

const SuccessDialogStandalone = {
  show: async (options: SuccessDialogOptions) => {
    if (globalShowSuccess) return globalShowSuccess(options);
  },
};

export { ConfirmationDialogComponent as ConfirmationDialog, SuccessDialogStandalone as SuccessDialog };
export default ConfirmationDialogComponent;
