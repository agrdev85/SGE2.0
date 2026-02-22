import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type, Image as ImageIcon, LayoutGrid, Minus, Square, AlignLeft, Code, Eye,
  ChevronUp, ChevronDown, Trash2, GripVertical
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: string;
  html: string;
  label: string;
}

const COMPONENT_LIBRARY = [
  { type: 'heading1', label: 'Título H1', icon: Type, html: '<h1 class="text-3xl font-bold mb-4">Título Principal</h1>' },
  { type: 'heading2', label: 'Título H2', icon: Type, html: '<h2 class="text-2xl font-semibold mb-3">Subtítulo</h2>' },
  { type: 'paragraph', label: 'Párrafo', icon: AlignLeft, html: '<p class="mb-4">Escribe aquí tu contenido...</p>' },
  { type: 'image', label: 'Imagen', icon: ImageIcon, html: '<img src="https://placehold.co/800x400" alt="Descripción" class="w-full rounded-lg mb-4" />' },
  { type: 'button', label: 'Botón', icon: Square, html: '<a href="#" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">Botón de Acción</a>' },
  { type: 'divider', label: 'Separador', icon: Minus, html: '<hr class="my-6 border-gray-300" />' },
  { type: 'grid2', label: 'Grid 2 Col', icon: LayoutGrid, html: '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4"><div class="p-4 bg-gray-50 rounded-lg">Columna 1</div><div class="p-4 bg-gray-50 rounded-lg">Columna 2</div></div>' },
  { type: 'card', label: 'Tarjeta', icon: Square, html: '<div class="border rounded-lg p-6 shadow-sm mb-4"><h3 class="text-lg font-semibold mb-2">Título Tarjeta</h3><p class="text-gray-600">Contenido de la tarjeta...</p></div>' },
  { type: 'hero', label: 'Hero Banner', icon: LayoutGrid, html: '<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-lg mb-4 text-center"><h1 class="text-4xl font-bold mb-4">Título del Evento</h1><p class="text-xl opacity-90">Descripción del evento aquí</p></div>' },
  { type: 'list', label: 'Lista', icon: AlignLeft, html: '<ul class="list-disc pl-6 mb-4 space-y-2"><li>Elemento 1</li><li>Elemento 2</li><li>Elemento 3</li></ul>' },
];

interface EventContentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const EventContentEditor: React.FC<EventContentEditorProps> = ({ content, onChange }) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => parseContentToBlocks(content));
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  function parseContentToBlocks(html: string): ContentBlock[] {
    if (!html?.trim()) return [];
    // Split by top-level tags roughly
    const parts = html.split(/(?=<(?:h[1-6]|p|div|img|a|hr|ul|ol|section|header|nav|footer|table)[>\s])/i).filter(p => p.trim());
    return parts.map((part, i) => ({
      id: `block-${Date.now()}-${i}`,
      type: 'custom',
      html: part.trim(),
      label: 'Bloque personalizado',
    }));
  }

  function blocksToHtml(b: ContentBlock[]): string {
    return b.map(bl => bl.html).join('\n');
  }

  const syncBlocks = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    onChange(blocksToHtml(newBlocks));
  };

  const addBlock = (component: typeof COMPONENT_LIBRARY[0]) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: component.type,
      html: component.html,
      label: component.label,
    };
    syncBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, html: string) => {
    syncBlocks(blocks.map(b => b.id === id ? { ...b, html } : b));
  };

  const removeBlock = (id: string) => {
    syncBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    syncBlocks(newBlocks);
  };

  if (editorMode === 'html') {
    return (
      <div className="space-y-2">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditorMode('visual')}>
            <Eye className="h-4 w-4 mr-1" />Visual
          </Button>
          <Button variant="default" size="sm" disabled>
            <Code className="h-4 w-4 mr-1" />HTML
          </Button>
        </div>
        <Textarea
          value={content}
          onChange={(e) => {
            onChange(e.target.value);
            setBlocks(parseContentToBlocks(e.target.value));
          }}
          rows={20}
          className="font-mono text-sm"
          placeholder="<div>Contenido HTML aquí...</div>"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <Button variant="default" size="sm" disabled>
          <Eye className="h-4 w-4 mr-1" />Visual
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditorMode('html')}>
          <Code className="h-4 w-4 mr-1" />HTML
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '500px' }}>
        {/* Component Library */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Componentes</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {COMPONENT_LIBRARY.map(comp => (
                <Button
                  key={comp.type}
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-auto py-3 gap-1 text-xs"
                  onClick={() => addBlock(comp)}
                >
                  <comp.icon className="h-4 w-4" />
                  {comp.label}
                </Button>
              ))}
            </div>

            {/* Block list */}
            {blocks.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Bloques ({blocks.length})</p>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className={`flex items-center gap-1 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                          selectedBlockId === block.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{block.label} #{idx + 1}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor + Preview split */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Editor panel */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Editor</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[450px]">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Agrega componentes desde el panel izquierdo
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className={`border rounded p-2 cursor-pointer transition-all ${
                          selectedBlockId === block.id ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground font-medium">{block.label} #{idx + 1}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {selectedBlockId === block.id ? (
                          <Textarea
                            value={block.html}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            rows={4}
                            className="font-mono text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 font-mono">{block.html}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Preview panel */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[450px]">
                <div
                  className="prose prose-sm max-w-none p-3"
                  dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks) || '<p class="text-gray-400 text-center py-8">Sin contenido</p>' }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventContentEditor;
