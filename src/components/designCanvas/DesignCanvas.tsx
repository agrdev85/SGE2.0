import { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasElement, DesignConfig } from './types';
import { cn } from '@/lib/utils';
import { Move, Maximize2 } from 'lucide-react';

interface DesignCanvasProps {
  config: DesignConfig;
  elements: CanvasElement[];
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  previewData?: Record<string, string>;
  device: 'desktop' | 'mobile';
  interactive?: boolean;
  className?: string;
}

export function DesignCanvas({
  config,
  elements,
  onElementUpdate,
  previewData = {},
  device,
  interactive = true,
  className
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>(null);

  // Calculate canvas dimensions
  const isLandscape = config.orientation === 'landscape';
  const aspectRatio = isLandscape 
    ? config.width / config.height 
    : config.height / config.width;
  
  const maxWidth = device === 'mobile' ? 320 : 500;
  const maxHeight = device === 'mobile' ? 480 : 600;

  const getColor = (colorKey?: string): string => {
    if (!colorKey) return 'transparent';
    switch (colorKey) {
      case 'primary': return config.primaryColor;
      case 'secondary': return config.secondaryColor;
      case 'white': return '#ffffff';
      case 'muted': return '#94a3b8';
      default: return colorKey.startsWith('#') ? colorKey : config.textColor;
    }
  };

  const replaceTemplateVars = (content: string): string => {
    let result = content;
    Object.entries(previewData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const handleMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    if (!interactive || element.locked) return;
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setSelectedId(element.id);
    setDragging({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: element.x,
      origY: element.y
    });
  };

  const handleResizeStart = (e: React.MouseEvent, element: CanvasElement) => {
    if (!interactive || element.locked) return;
    e.stopPropagation();
    
    setResizing({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      origW: element.width,
      origH: element.height
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      const deltaX = ((e.clientX - dragging.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragging.startY) / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, dragging.origX + deltaX));
      const newY = Math.max(0, Math.min(100, dragging.origY + deltaY));
      
      onElementUpdate(dragging.id, { x: newX, y: newY });
    }

    if (resizing) {
      const deltaW = ((e.clientX - resizing.startX) / rect.width) * 100;
      const deltaH = ((e.clientY - resizing.startY) / rect.height) * 100;
      
      const newW = Math.max(5, Math.min(100, resizing.origW + deltaW));
      const newH = Math.max(3, Math.min(100, resizing.origH + deltaH));
      
      onElementUpdate(resizing.id, { width: newW, height: newH });
    }
  }, [dragging, resizing, onElementUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const renderElement = (element: CanvasElement) => {
    if (!element.enabled) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x - element.width / 2}%`,
      top: `${element.y - element.height / 2}%`,
      width: `${element.width}%`,
      height: `${element.height}%`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.style.textAlign || 'center',
      fontSize: element.style.fontSize ? `${element.style.fontSize * (device === 'mobile' ? 0.6 : 0.8)}px` : undefined,
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      color: getColor(element.style.color),
      backgroundColor: getColor(element.style.backgroundColor),
      borderRadius: element.style.borderRadius,
      padding: element.style.padding,
      cursor: interactive && !element.locked ? 'move' : 'default',
      userSelect: 'none',
      zIndex: selectedId === element.id ? 50 : 1,
      outline: selectedId === element.id ? '2px solid hsl(var(--primary))' : 'none',
      outlineOffset: '2px',
      transition: dragging?.id === element.id || resizing?.id === element.id ? 'none' : 'outline 0.15s',
    };

    const content = replaceTemplateVars(element.content);

    return (
      <div
        key={element.id}
        style={style}
        onMouseDown={(e) => handleMouseDown(e, element)}
        onClick={(e) => { e.stopPropagation(); setSelectedId(element.id); }}
        className="group"
      >
        {element.type === 'shape' && (
          <div className="absolute inset-0 rounded" style={{ backgroundColor: getColor(element.style.backgroundColor) }} />
        )}
        
        {element.type === 'line' && (
          <div className="absolute inset-x-0 top-1/2 h-px" style={{ backgroundColor: getColor(element.style.backgroundColor) }} />
        )}

        {element.type === 'text' && (
          <span className="text-center w-full break-words leading-tight">{content || element.content}</span>
        )}

        {element.type === 'logo' && (
          element.content ? (
            <img src={element.content} alt="Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-muted-foreground text-xs">
              Logo
            </div>
          )
        )}

        {element.type === 'photo' && (
          <div 
            className="w-full h-full border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs"
            style={{ 
              borderColor: config.secondaryColor,
              backgroundColor: '#f1f5f9',
              borderRadius: element.style.borderRadius 
            }}
          >
            FOTO
          </div>
        )}

        {element.type === 'qr' && (
          <div className="w-full h-full bg-white border rounded flex items-center justify-center">
            <div className="w-4/5 h-4/5 bg-gray-200 rounded flex items-center justify-center text-xs text-muted-foreground">
              QR
            </div>
          </div>
        )}

        {/* Resize handle */}
        {interactive && selectedId === element.id && !element.locked && element.type !== 'line' && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, element)}
          >
            <Maximize2 className="w-2 h-2 text-primary-foreground" />
          </div>
        )}

        {/* Move indicator */}
        {interactive && selectedId === element.id && !element.locked && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Move className="w-2 h-2 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        ref={canvasRef}
        className="relative bg-white shadow-lg rounded overflow-hidden"
        style={{
          width: device === 'mobile' ? 200 : maxWidth,
          height: device === 'mobile' 
            ? (isLandscape ? 130 : 280) 
            : (isLandscape ? maxWidth / aspectRatio : maxHeight),
          aspectRatio: isLandscape ? `${config.width}/${config.height}` : `${config.height}/${config.width}`,
        }}
        onClick={() => setSelectedId(null)}
      >
        {/* Grid overlay for guidance */}
        {interactive && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
              backgroundSize: '10% 10%'
            }}
          />
        )}

        {/* Render elements */}
        {elements.filter(e => e.enabled).map(renderElement)}
      </div>
    </div>
  );
}
