import React from 'react';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeSettings({ className }: { className?: string }) {
  const { theme, setTheme, isDark } = useTheme();

  const options = [
    { 
      value: 'light' as Theme, 
      label: 'Claro', 
      description: 'Ideal para espacios con buena iluminación',
      icon: Sun,
      preview: 'bg-gradient-to-br from-slate-50 to-slate-100',
      previewIcon: 'text-amber-500',
    },
    { 
      value: 'dark' as Theme, 
      label: 'Oscuro', 
      description: 'Reduce fatiga visual en ambientes oscuros',
      icon: Moon,
      preview: 'bg-gradient-to-br from-slate-900 to-slate-800',
      previewIcon: 'text-blue-400',
    },
    { 
      value: 'system' as Theme, 
      label: 'Sistema', 
      description: 'Sigue la configuración de tu dispositivo',
      icon: Monitor,
      preview: 'bg-gradient-to-br from-slate-100 to-slate-900',
      previewIcon: 'text-muted-foreground',
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle className="font-display">Tema de la Aplicación</CardTitle>
        </div>
        <CardDescription>
          Personaliza la apariencia visual del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map(({ value, label, description, icon: Icon, preview, previewIcon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'relative p-4 rounded-2xl border-2 transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                theme === value
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-full h-16 rounded-xl mb-4 flex items-center justify-center',
                preview
              )}>
                <Icon className={cn('w-8 h-8', previewIcon)} />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{label}</h3>
                  {theme === value && (
                    <div className="p-0.5 bg-primary rounded-full">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>

              {theme === value && (
                <div className="absolute -bottom-px left-4 right-4 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Tema actual</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {theme === 'system' 
                  ? `Seguir sistema (actualmente ${isDark ? 'oscuro' : 'claro'})`
                  : `Tema ${theme === 'dark' ? 'oscuro' : 'claro'} seleccionado`}
              </p>
            </div>
            <div className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium',
              isDark 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            )}>
              {isDark ? '🌙 Oscuro' : '☀️ Claro'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="w-4 h-4" />
          <span>También puedes cambiar el tema rápidamente desde el icono en la barra superior</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThemeSettings;
