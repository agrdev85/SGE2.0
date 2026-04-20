import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  showDivider?: boolean;
}

export function FloatingActionBar({ 
  leftContent, 
  rightContent, 
  className,
  showDivider = true 
}: FloatingActionBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4',
        'bg-background/80 backdrop-blur-xl border-t',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.1)]',
        className
      )}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          {leftContent && (
            <div className="flex items-center gap-3">
              {leftContent}
            </div>
          )}
          
          {showDivider && leftContent && rightContent && (
            <div className="hidden md:block w-px h-8 bg-border mx-2" />
          )}
          
          {rightContent && (
            <div className="flex items-center gap-3 ml-auto">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  icon,
  className
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      {loading ? (
        <span className="animate-spin mr-2">⏳</span>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </Button>
  );
}

export default FloatingActionBar;
