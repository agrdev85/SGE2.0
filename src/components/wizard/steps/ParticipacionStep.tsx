import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { db, NomTipoParticipacion, EventoTipoParticipacion } from '@/lib/database';
import { normalizeText, findSimilarItems, isDuplicate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Save, Users, Eye, EyeOff, X, Search, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { NomenclatorModal } from '@/components/ui/NomenclatorModal';
import { useConfirmation } from '@/hooks/useConfirmation';

interface TipoParticipacionConfig {
  tipoId: string;
  nombre: string;
  precioCUP: number;
  precioMoneda: number;
  moneda: 'CUP' | 'USD' | 'EUR';
  capacidad: number;
  apareceEnListadoPublico: boolean;
}

export function ParticipacionStep() {
  const { evento, guardarYContinuar, state } = useWizard();
  const { confirm, success } = useConfirmation();
  const [tiposGlobales, setTiposGlobales] = useState<NomTipoParticipacion[]>([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [tiposConfigurados, setTiposConfigurados] = useState<TipoParticipacionConfig[]>([]);
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null);
  const [isNewTipoDialogOpen, setIsNewTipoDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingTipoGlobal, setEditingTipoGlobal] = useState<NomTipoParticipacion | null>(null);
  
  const [tipoParticipacionForm, setTipoParticipacionForm] = useState({
    nombre: '', descripcion: '', requierePago: true, apareceEnListadoPublico: true, activo: true,
  });
  
  const [tipoParticipacionErrors, setTipoParticipacionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [evento?.id]);

  useEffect(() => {
    const handleDataChange = (e: CustomEvent) => {
      const collection = e.detail?.collection;
      if (collection && (
        collection.includes('participacion') ||
        collection === 'nomTiposParticipacion' ||
        collection === 'eventoTiposParticipacion'
      )) {
        loadData();
      }
    };
    window.addEventListener('sge-data-change', handleDataChange as EventListener);
    return () => window.removeEventListener('sge-data-change', handleDataChange as EventListener);
  }, [evento?.id]);

  const loadData = () => {
    const tipos = db.nomTiposParticipacion.getAll();
    setTiposGlobales(tipos);
    
    if (evento?.id) {
      const configurados = db.eventoTiposParticipacion.getByEvento(evento.id);
      
      setTiposSeleccionados(configurados.map(etp => etp.tipoParticipacionId));
      
      setTiposConfigurados(
        configurados.map(etp => {
          const tipo = tipos.find(t => t.id === etp.tipoParticipacionId);
          return {
            tipoId: etp.tipoParticipacionId,
            nombre: tipo?.nombre || 'Desconocido',
            precioCUP: etp.precioCUP,
            precioMoneda: etp.precioMoneda,
            moneda: etp.moneda,
            capacidad: etp.capacidad,
            apareceEnListadoPublico: etp.apareceEnListadoPublico,
          };
        })
      );
    }
  };

  const toggleTipo = (tipoId: string) => {
    const tipo = tiposGlobales.find(t => t.id === tipoId);
    if (!tipo) return;

    if (tiposSeleccionados.includes(tipoId)) {
      setTiposSeleccionados(prev => prev.filter(id => id !== tipoId));
      setTiposConfigurados(prev => prev.filter(t => t.tipoId !== tipoId));
    } else {
      setTiposSeleccionados(prev => [...prev, tipoId]);
      setTiposConfigurados(prev => [...prev, {
        tipoId: tipo.id,
        nombre: tipo.nombre,
        precioCUP: 0,
        precioMoneda: 0,
        moneda: 'USD',
        capacidad: 0,
        apareceEnListadoPublico: tipo.apareceEnListadoPublico ?? true,
      }]);
    }
  };

  const updateConfig = (tipoId: string, field: keyof TipoParticipacionConfig, value: any) => {
    setTiposConfigurados(prev =>
      prev.map(t => t.tipoId === tipoId ? { ...t, [field]: value } : t)
    );
  };

  const crearTipoParticipacion = (data: any) => {
    try {
      const nuevoTipo = db.nomTiposParticipacion.create({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        activo: true,
        apareceEnListadoPublico: data.apareceEnListadoPublico ?? true,
        requierePago: data.requierePago ?? true,
      } as any);
      
      toast.success('Tipo de participación creado');
      success({ title: '¡Guardado!', description: 'Tipo de participación creado correctamente' });
      setIsNewTipoDialogOpen(false);
      setEditingTipoGlobal(null);
      
      setTiposGlobales(prev => [...prev, nuevoTipo]);
      
      toggleTipo(nuevoTipo.id);
    } catch (error) {
      toast.error('Error al crear el tipo de participación');
    }
  };

  const handleSaveTipoParticipacion = (data: any) => {
    const errors: Record<string, string> = {};
    if (!data.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (Object.keys(errors).length > 0) {
      setTipoParticipacionErrors(errors);
      return;
    }
    setTipoParticipacionErrors({});
    
    if (!editingTipoGlobal) {
      crearTipoParticipacion(data);
      return;
    }
    
    try {
      db.nomTiposParticipacion.update(editingTipoGlobal.id, {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        apareceEnListadoPublico: data.apareceEnListadoPublico ?? true,
        requierePago: data.requierePago ?? true,
      } as any);
      
      toast.success('Tipo de participación actualizado');
      success({ title: '¡Guardado!', description: 'Tipo de participación actualizado correctamente' });
      setIsNewTipoDialogOpen(false);
      setEditingTipoGlobal(null);
      setTipoParticipacionForm({ nombre: '', descripcion: '', requierePago: true, apareceEnListadoPublico: true, activo: true });
      
      loadData();
    } catch (error) {
      toast.error('Error al actualizar el tipo de participación');
    }
  };

  const handleDeleteTipoParticipacion = async (tipo: NomTipoParticipacion) => {
    await confirm({
      title: '¿Eliminar tipo de participación?',
      description: `¿Está seguro de que desea eliminar "${tipo.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          db.nomTiposParticipacion.delete(tipo.id);
          loadData();
        } catch (error) {
          toast.error('Error al eliminar el tipo de participación');
        }
      },
      successMessage: `"${tipo.nombre}" ha sido eliminado correctamente.`,
    });
  };

  const handleGuardarPaso = async () => {
    if (tiposSeleccionados.length === 0) {
      toast.error('Seleccione al menos un tipo de participación');
      return;
    }

    for (const config of tiposConfigurados) {
      if (config.capacidad <= 0) {
        toast.error(`La capacidad para "${config.nombre}" debe ser mayor a 0`);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (evento?.id) {
        db.eventoTiposParticipacion.deleteByEvento(evento.id);
        tiposConfigurados.forEach(t => {
          db.eventoTiposParticipacion.create({
            eventoId: evento.id,
            tipoParticipacionId: t.tipoId,
            precioCUP: t.precioCUP,
            precioMoneda: t.precioMoneda,
            moneda: t.moneda,
            capacidad: t.capacidad,
            apareceEnListadoPublico: t.apareceEnListadoPublico,
          });
        });
      }
      await guardarYContinuar(3, {} as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  const filteredTipos = tiposGlobales.filter(t => {
    const q = search.toLowerCase();
    return !q || t.nombre.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Tipos de Participación</CardTitle>
              <CardDescription>
                Seleccione los tipos de participantes y configure precios para este evento
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setEditingTipoGlobal(null); setIsNewTipoDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Tipo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tipo de participación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {tiposGlobales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay tipos de participación en el sistema</p>
              <p className="text-sm">Cree uno nuevo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTipos.map(tipo => {
                const isSelected = tiposSeleccionados.includes(tipo.id);
                const config = tiposConfigurados.find(c => c.tipoId === tipo.id);
                
                return (
                  <div
                    key={tipo.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleTipo(tipo.id)} 
                        className="mt-1"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => toggleTipo(tipo.id)}>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{tipo.nombre}</h4>
                          {tipo.descripcion && (
                            <span className="text-sm text-muted-foreground">- {tipo.descripcion}</span>
                          )}
                          {!tipo.activo && <Badge variant="destructive">Inactivo</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className={`flex items-center gap-1 ${tipo.apareceEnListadoPublico ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {tipo.apareceEnListadoPublico ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {tipo.apareceEnListadoPublico ? 'Visible' : 'Oculto'}
                          </span>
                          {tipo.requierePago && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="w-3 h-3" />
                              Requiere pago
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setEditingTipoGlobal(tipo); 
                            setTipoParticipacionForm({
                              nombre: tipo.nombre,
                              descripcion: tipo.descripcion || '',
                              requierePago: tipo.requierePago ?? true,
                              apareceEnListadoPublico: tipo.apareceEnListadoPublico ?? true,
                              activo: tipo.activo ?? true,
                            });
                            setIsNewTipoDialogOpen(true); 
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTipoParticipacion(tipo)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tiposSeleccionados.length > 0 && (
            <div className="p-4 bg-muted rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">Tipos seleccionados:</p>
              <div className="flex flex-wrap gap-2">
                {tiposConfigurados.map(t => (
                  <Badge key={t.tipoId} variant="default" className="gap-1">
                    {t.nombre}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => toggleTipo(t.tipoId)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tiposConfigurados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Precios</CardTitle>
            <CardDescription>
              Configure precios y capacidad para cada tipo de participante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Precio CUP</TableHead>
                  <TableHead className="text-center">Precio Moneda</TableHead>
                  <TableHead className="text-center">Moneda</TableHead>
                  <TableHead className="text-center">Capacidad</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposConfigurados.map(tipo => (
                  <TableRow key={tipo.tipoId}>
                    <TableCell className="font-medium">{tipo.nombre}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={tipo.precioCUP}
                        onChange={e => updateConfig(tipo.tipoId, 'precioCUP', parseFloat(e.target.value) || 0)}
                        className="w-24 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={tipo.precioMoneda}
                        onChange={e => updateConfig(tipo.tipoId, 'precioMoneda', parseFloat(e.target.value) || 0)}
                        className="w-24 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <select
                        value={tipo.moneda}
                        onChange={e => updateConfig(tipo.tipoId, 'moneda', e.target.value)}
                        className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CUP">CUP</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={tipo.capacidad}
                        onChange={e => updateConfig(tipo.tipoId, 'capacidad', parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={tipo.apareceEnListadoPublico}
                        onCheckedChange={v => updateConfig(tipo.tipoId, 'apareceEnListadoPublico', v)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start">
        <Button onClick={handleGuardarPaso} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>

      <NomenclatorModal
        open={isNewTipoDialogOpen}
        onOpenChange={setIsNewTipoDialogOpen}
        type="tipoParticipacion"
        mode={editingTipoGlobal ? 'edit' : 'create'}
        formData={tipoParticipacionForm}
        onFormChange={setTipoParticipacionForm}
        errors={tipoParticipacionErrors}
        onSave={handleSaveTipoParticipacion}
        onDelete={editingTipoGlobal ? () => handleDeleteTipoParticipacion(editingTipoGlobal) : undefined}
        similarItems={findSimilarItems(tiposGlobales, tipoParticipacionForm.nombre, t => t.nombre, 0.5).map(s => s.item.nombre)}
      />

    </div>
  );
}

export default ParticipacionStep;
