import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  speed: number;
  drift: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({ text, speed = 30, className, onComplete }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span className={cn('inline-block', className)}>{displayedText}<span className="animate-pulse">|</span></span>;
}

export function Confetti({ 
  active, 
  colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b'], 
  particleCount = 80,
  duration = 3000 
}: { 
  active: boolean; 
  colors?: string[];
  particleCount?: number;
  duration?: number;
}) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < particleCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        speed: Math.random() * 3 + 2,
        drift: Math.random() * 2 - 1,
      });
    }
    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, colors, particleCount, duration]);

  if (!active || pieces.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confettiFall ${duration / 1000}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            ['--drift' as string]: piece.drift,
            ['--speed' as string]: piece.speed,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) translateX(calc(var(--drift) * 100px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function Particles({ 
  active, 
  origin = 'center',
  count = 20,
  color = '#10b981' 
}: { 
  active: boolean;
  origin?: 'center' | 'top' | 'bottom';
  count?: number;
  color?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>();

  const startParticles = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = origin === 'top' ? 0 : origin === 'bottom' ? window.innerHeight : window.innerHeight / 2;
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = Math.random() * 8 + 4;
      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: color,
        size: Math.random() * 8 + 4,
        life: 1,
      });
    }
    setParticles(newParticles);

    const animate = () => {
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2,
          life: p.life - 0.02,
        })).filter(p => p.life > 0);
        
        if (updated.length > 0) {
          frameRef.current = requestAnimationFrame(animate);
        }
        return updated;
      });
    };

    frameRef.current = requestAnimationFrame(animate);

    setTimeout(() => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      setParticles([]);
    }, 1500);
  }, [origin, count, color]);

  useEffect(() => {
    if (active) {
      startParticles();
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, startParticles]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  duration: number;
  color?: string;
  onComplete?: () => void;
}

export function ProgressBar({ duration, color = '#10b981', onComplete }: ProgressBarProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10 rounded-b-3xl overflow-hidden">
      <div 
        className="h-full transition-all duration-75 ease-linear"
        style={{ 
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

interface ShakeWrapperProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ShakeWrapper({ active, children, className }: ShakeWrapperProps) {
  return (
    <div className={cn(active && 'animate-shake', className)}>
      {children}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}

interface PulseWrapperProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PulseWrapper({ active, children, className }: PulseWrapperProps) {
  return (
    <div className={cn(active && 'animate-pulse-scale', className)}>
      {children}
      <style>{`
        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-scale {
          animation: pulseScale 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

interface BounceIconProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BounceIcon({ active, children, className }: BounceIconProps) {
  return (
    <div className={cn(active && 'animate-iconBounce', className)}>
      {children}
      <style>{`
        @keyframes iconBounce {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          70% { transform: scale(0.9) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-iconBounce {
          animation: iconBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </div>
  );
}

export function SparkleEffect({ active, color = '#fbbf24' }: { active: boolean; color?: string }) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (active) {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setSparkles(newSparkles);
      
      setTimeout(() => setSparkles([]), 1000);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            backgroundColor: color,
            animation: `sparkle 0.8s ease-out forwards`,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      ))}
      <style>{`
        @keyframes sparkle {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
