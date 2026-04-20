import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTheme();
  };

  const handleSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const options = [
    { value: 'light' as Theme, label: 'Claro', icon: Sun },
    { value: 'dark' as Theme, label: 'Oscuro', icon: Moon },
    { value: 'system' as Theme, label: 'Sistema', icon: Monitor },
  ];

  const currentOption = options.find(opt => opt.value === theme);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-xl',
          'bg-muted/50 hover:bg-muted transition-all duration-200',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        title="Cambiar tema"
      >
        <div className="relative w-5 h-5">
          <Sun 
            className={cn(
              'absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300',
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            )} 
          />
          <Moon 
            className={cn(
              'absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300',
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            )} 
          />
        </div>
        
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/20 via-transparent to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'flex items-center justify-center w-6 h-10 rounded-r-xl -ml-2',
          'bg-transparent hover:bg-muted/30 transition-all duration-200',
          'focus:outline-none'
        )}
        title="Más opciones de tema"
      >
        <ChevronDown 
          className={cn(
            'w-3 h-3 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-48 rounded-xl border bg-background/95 backdrop-blur-xl shadow-lg shadow-black/10',
            'animate-scale-in origin-top-right'
          )}>
            <div className="p-1.5 space-y-0.5">
              {options.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-sm font-medium transition-all duration-150',
                    theme === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4', theme === value && 'text-primary')} />
                  <span className="flex-1 text-left">{label}</span>
                  {theme === value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-1.5 pt-0">
              <div className="h-px bg-border mx-1" />
              <p className="text-[10px] text-muted-foreground text-center pt-2 px-2">
                {theme === 'system' 
                  ? `Usando tema del sistema (${isDark ? 'oscuro' : 'claro'})`
                  : `Tema ${isDark ? 'oscuro' : 'claro'} activo`}
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default ThemeToggle;
