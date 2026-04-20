import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import i18n, { changeLanguage, getCurrentLanguage } from '@/i18n';

export function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
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

  const handleSelect = (lang: 'es' | 'en') => {
    changeLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);
    window.location.reload();
  };

  const options = [
    { value: 'es' as const, label: 'Español', flag: '🇨🇺', native: 'Español' },
    { value: 'en' as const, label: 'English', flag: '🇺🇸', native: 'English' },
  ];

  const currentOption = options.find(opt => opt.value === currentLang);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'relative flex items-center justify-center gap-2 h-10 px-3 rounded-xl',
          'bg-muted/50 hover:bg-muted transition-all duration-200',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        title="Cambiar idioma"
      >
        <Globe className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium">{currentOption?.flag}</span>
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
            'w-56 rounded-xl border bg-background/95 backdrop-blur-xl shadow-lg shadow-black/10',
            'animate-scale-in origin-top-right'
          )}>
            <div className="p-1.5 space-y-0.5">
              {options.map(({ value, label, flag, native }) => (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-sm font-medium transition-all duration-150',
                    currentLang === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="text-xl">{flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{native}</p>
                  </div>
                  {currentLang === value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-1.5 pt-0">
              <div className="h-px bg-border mx-1" />
              <p className="text-[10px] text-muted-foreground text-center pt-2 px-2">
                Idioma actual: {currentOption?.label}
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

export default LanguageToggle;