import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    setClicking(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setClicking(false), 800);
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={cn(
        'fixed bottom-8 right-8 z-50 group',
        'h-14 w-14 rounded-full',
        'flex items-center justify-center',
        'shadow-2xl',
        'transition-all duration-500 ease-out',
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-20 opacity-0 scale-50 pointer-events-none',
        clicking && 'scale-90',
      )}
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--info, var(--primary))))',
      }}
    >
      {/* Pulse ring */}
      <span
        className={cn(
          'absolute inset-0 rounded-full animate-ping opacity-30',
        )}
        style={{ background: 'hsl(var(--primary))' }}
      />
      {/* Glow */}
      <span
        className="absolute inset-[-4px] rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity"
        style={{ background: 'hsl(var(--primary))' }}
      />
      {/* Icon */}
      <ArrowUp
        className={cn(
          'h-6 w-6 text-primary-foreground relative z-10 transition-transform duration-300',
          'group-hover:-translate-y-1',
          clicking && '-translate-y-3',
        )}
      />
    </button>
  );
}
