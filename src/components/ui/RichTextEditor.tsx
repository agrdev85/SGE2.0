import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link, 
  Image, AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  ChevronDown, Code, Type, Heading1, Heading2, Minus, Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const VARIABLES = [
  { key: 'userName', label: 'Nombre del usuario' },
  { key: 'userEmail', label: 'Email del usuario' },
  { key: 'eventName', label: 'Nombre del evento' },
  { key: 'eventDate', label: 'Fecha del evento' },
  { key: 'primaryColor', label: 'Color primario' },
  { key: 'secondaryColor', label: 'Color secundario' },
  { key: 'bannerImage', label: 'Banner' },
  { key: 'backgroundImage', label: 'Imagen de fondo' },
  { key: 'abstractTitle', label: 'Título del trabajo' },
  { key: 'categoryType', label: 'Categoría' },
  { key: 'workCount', label: 'Cantidad de trabajos' },
  { key: 'deadline', label: 'Fecha límite' },
];

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Escribe tu contenido aquí...',
  className,
  minHeight = '300px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value;
        setCharCount(value.replace(/<[^>]*>/g, '').length);
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string, valueParam?: string) => {
    document.execCommand(command, false, valueParam);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
      setCharCount(editorRef.current.innerText.length);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
      setCharCount(editorRef.current.innerText.length);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
      }
    }
  }, [execCommand]);

  const handleLink = useCallback(() => {
    if (linkUrl) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      execCommand('createLink', url);
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  }, [linkUrl, execCommand]);

  const insertVariable = useCallback((variable: string) => {
    const variableText = `{{${variable}}}`;
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).toString().length > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(variableText));
      range.setStartAfter(range.endContainer);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, variableText);
    }
    
    setTimeout(() => {
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
        setCharCount(editorRef.current.innerText.length);
      }
    }, 0);
  }, [onChange]);

  const insertHeading = useCallback((level: number) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  const handleImageInsert = useCallback(() => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      execCommand('insertImage', url);
    }
  }, [execCommand]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    tooltip,
    onClick
  }: { 
    icon: React.ElementType; 
    command?: string; 
    tooltip: string;
    onClick?: () => void;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => command ? execCommand(command) : onClick?.()}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <div ref={wrapperRef} className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/50 select-none">
        <ToolbarButton icon={Undo} command="undo" tooltip="Deshacer (Ctrl+Z)" />
        <ToolbarButton icon={Redo} command="redo" tooltip="Rehacer (Ctrl+Y)" />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton icon={Bold} command="bold" tooltip="Negrita (Ctrl+B)" />
        <ToolbarButton icon={Italic} command="italic" tooltip="Cursiva (Ctrl+I)" />
        <ToolbarButton icon={Underline} command="underline" tooltip="Subrayado (Ctrl+U)" />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton icon={Heading1} tooltip="Título 1" onClick={() => insertHeading(1)} />
        <ToolbarButton icon={Heading2} tooltip="Título 2" onClick={() => insertHeading(2)} />
        <ToolbarButton icon={Type} tooltip="Párrafo" onClick={() => execCommand('formatBlock', 'p')} />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton icon={List} command="insertUnorderedList" tooltip="Lista con viñetas" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" tooltip="Lista numerada" />
        <ToolbarButton icon={Minus} command="insertHorizontalRule" tooltip="Línea horizontal" />
        <ToolbarButton icon={Quote} tooltip="Cita" onClick={() => execCommand('formatBlock', 'blockquote')} />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton icon={AlignLeft} command="justifyLeft" tooltip="Alinear a la izquierda" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" tooltip="Centrar" />
        <ToolbarButton icon={AlignRight} command="justifyRight" tooltip="Alinear a la derecha" />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton icon={Link} tooltip="Insertar enlace" onClick={() => setIsLinkDialogOpen(true)} />
        <ToolbarButton icon={Image} tooltip="Insertar imagen" onClick={handleImageInsert} />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1">
              <Code className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Variables</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b bg-muted/50">
              Insertar variable
            </div>
            {VARIABLES.map(v => (
              <DropdownMenuItem 
                key={v.key} 
                onClick={() => insertVariable(v.key)}
                className="cursor-pointer"
              >
                <code className="text-primary font-mono text-sm mr-2">{`{{${v.key}}}`}</code>
                <span className="text-xs text-muted-foreground">{v.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isLinkDialogOpen && (
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 px-2 text-sm border rounded w-48 bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLink();
                }
                if (e.key === 'Escape') {
                  setIsLinkDialogOpen(false);
                  setLinkUrl('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Button size="sm" variant="outline" onClick={handleLink}>
              Insertar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              setIsLinkDialogOpen(false);
              setLinkUrl('');
            }}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
      
      <div 
        className="relative bg-white dark:bg-black"
        style={{ minHeight }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          className={cn(
            "w-full h-full p-4 outline-none overflow-auto",
            "text-foreground",
            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3",
            "[&_p]:mb-2",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2",
            "[&_li]:mb-1",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
            "[&_a]:text-blue-600 [&_a]:underline",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:my-2",
            "[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-muted [&_hr]:my-4",
            "[&_strong]:font-bold",
            "[&_em]:italic",
            "[&_u]:underline"
          )}
          style={{ 
            minHeight: `calc(${minHeight} - 80px)`,
            lineHeight: '1.6',
            color: '#000',
            backgroundColor: 'white'
          }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onScroll={handleScroll}
          data-placeholder={placeholder}
        />
      </div>
      
      <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between select-none">
        <span className={isFocused ? 'text-primary' : ''}>
          {isFocused ? 'Editando...' : 'Haz clic para editar'}
        </span>
        <span>{charCount} caracteres</span>
      </div>
    </div>
  );
}

export default RichTextEditor;
