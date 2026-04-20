import React, { useState, useEffect, useMemo } from 'react';
import { db, NomencladorEvento, SubEvento, MacroEvent } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Save, Globe, Layers, X, Check, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmation';

export interface SubEventoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  evento: MacroEvent | null;
  subeventoId?: string | null;
}

const TIPOS_SUBEVENTO = [
  { value: 'SIMPOSIO', label: 'Simposio' },
  { value: 'CURSO', label: 'Curso' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PONENCIA', label: 'Ponencia' },
  { value: 'MESA_REDONDA', label: 'Mesa Redonda' },
  { value: 'CONFERENCIA', label: 'Conferencia' },
  { value: 'SEMINARIO', label: 'Seminario' },
  { value: 'TALLER', label: 'Taller' },
];

interface SubeventoFormData {
  nombre: string;
  nombreEn: string;
  descripcion: string;
  tipo: string;
  tematicaIds: string[];
  capacidad: number;
  isActive: boolean;
}

const emptyForm: SubeventoFormData = {
  nombre: '',
  nombreEn: '',
  descripcion: '',
  tipo: 'SIMPOSIO',
  tematicaIds: [],
  capacidad: 100,
  isActive: true,
};

export function SubEventoFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  evento, 
  subeventoId 
}: SubEventoFormModalProps) {
  const { success } = useConfirmation();
  const [form, setForm] = useState<SubeventoFormData>(emptyForm);
  const [tematicas, setTematicas] = useState<NomencladorEvento[]>([]);
  const [allSubEventos, setAllSubEventos] = useState<SubEvento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!subeventoId;

  useEffect(() => {
    if (isOpen && evento?.id) {
      loadData();
      if (subeventoId) {
        const existing = db.subEventos.getById(subeventoId);
        if (existing) {
          setForm({
            nombre: existing.nombre,
            nombreEn: existing.nombreEn || '',
            descripcion: existing.descripcion || '',
            tipo: existing.tipo,
            tematicaIds: existing.tematicaIds || [],
            capacidad: existing.capacidad || 100,
            isActive: existing.isActive,
          });
        }
      } else {
        setForm(emptyForm);
      }
    }
  }, [isOpen, evento?.id, subeventoId]);

  const loadData = () => {
    if (!evento?.id) return;
    setTematicas(db.nomencladoresEvento.getByEventoAndTipo(evento.id, 'TEMATICA'));
    setAllSubEventos(db.subEventos.getByEvento(evento.id));
  };

  const filteredTematicas = useMemo(() => {
    const usedIds = new Set<string>();
    allSubEventos.forEach(se => {
      if (se.tematicaIds) {
        se.tematicaIds.forEach(tid => {
          if (se.id !== subeventoId) {
            usedIds.add(tid);
          }
        });
      }
    });
    
    return tematicas.filter(t => {
      const isUsed = usedIds.has(t.id);
      const matchesSearch = !searchTerm || 
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [tematicas, allSubEventos, subeventoId, searchTerm]);

  const selectedTematicas = useMemo(() => {
    return tematicas.filter(t => form.tematicaIds.includes(t.id));
  }, [tematicas, form.tematicaIds]);

  const handleToggleTematica = (tematicaId: string) => {
    setForm(prev => ({
      ...prev,
      tematicaIds: prev.tematicaIds.includes(tematicaId)
        ? prev.tematicaIds.filter(id => id !== tematicaId)
        : [...prev.tematicaIds, tematicaId]
    }));
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre en español es obligatorio');
      return;
    }

    if (!evento?.id) {
      toast.error('No hay evento seleccionado');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        eventoId: evento.id,
        nombre: form.nombre.trim(),
        nombreEn: form.nombreEn.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        tipo: form.tipo as any,
        tematicaIds: form.tematicaIds,
        capacidad: form.capacidad,
        isActive: form.isActive,
        precio: { CUP: 0, moneda: 0, monedaSeleccionada: 'USD' as any },
      };

      if (isEditing && subeventoId) {
        db.subEventos.update(subeventoId, data);
        toast.success('Subevento actualizado');
      } else {
        db.subEventos.create(data);
        toast.success('Subevento creado');
      }

      success({
        title: isEditing ? '¡Actualizado!' : '¡Creado!',
        description: isEditing 
          ? 'Los cambios se han guardado correctamente' 
          : 'El subevento se ha creado correctamente'
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditing ? 'Editar' : 'Crear'} Sub Evento
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Campo Evento Informativo */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">📍 Evento Padre:</span>
              <span className="font-medium">
                {evento?.name} ({evento?.acronym})
              </span>
            </div>
          </div>

          {/* Información Básica */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre en Español *</Label>
                <Input
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Simposio de Inteligencia Artificial"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre en Inglés</Label>
                <Input
                  value={form.nombreEn}
                  onChange={e => setForm(prev => ({ ...prev, nombreEn: e.target.value }))}
                  placeholder="Ej: Artificial Intelligence Symposium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción del subevento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={v => setForm(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SUBEVENTO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  value={form.capacidad}
                  onChange={e => setForm(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 0 }))}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="subeventoActive"
                checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="subeventoActive" className="text-sm">Activo</label>
            </div>
          </div>

          {/* Temáticas Asociadas */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Temáticas Asociadas</Label>
              <Badge variant="outline">{form.tematicaIds.length} seleccionadas</Badge>
            </div>

            {tematicas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay temáticas disponibles</p>
                <p className="text-xs">Cree temáticas primero en la configuración del evento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar temática..."
                    className="pl-9"
                  />
                </div>

                {/* Grid de temáticas */}
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-3 space-y-2">
                    {filteredTematicas.map(t => {
                      const isUsedInOther = allSubEventos.some(se => 
                        se.id !== subeventoId && 
                        se.tematicaIds?.includes(t.id)
                      );
                      const isSelected = form.tematicaIds.includes(t.id);
                      
                      return (
                        <div
                          key={t.id}
                          onClick={() => !isUsedInOther && handleToggleTematica(t.id)}
                          className={`
                            flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-primary/10 border-primary' 
                              : isUsedInOther
                              ? 'bg-muted/50 border-muted-foreground/30 opacity-60 cursor-not-allowed'
                              : 'hover:bg-muted'
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded border flex items-center justify-center shrink-0
                            ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}
                          `}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{t.nombre}</p>
                            {t.descripcion && (
                              <p className="text-xs text-muted-foreground truncate">{t.descripcion}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {t.duracion || 30} min
                          </Badge>
                          {isUsedInOther && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              En uso
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {filteredTematicas.length === 0 && searchTerm && (
                      <p className="text-center text-muted-foreground py-4">
                        No se encontraron temáticas
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Temáticas seleccionadas */}
                {selectedTematicas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTematicas.map(t => (
                      <Badge key={t.id} variant="default" className="gap-1 pl-2">
                        {t.nombre}
                        <button 
                          onClick={() => handleToggleTematica(t.id)}
                          className="ml-1 hover:text-destructive rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Sub Evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubEventoFormModal;