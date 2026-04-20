import React, { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { db, NomencladorEvento, SubEvento } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Save, Globe, Layers, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmation';
import { SubEventoFormModal } from '@/components/SubEventos/SubEventoFormModal';
import { ThematicsManagerModal } from '@/components/ui/ThematicsManagerModal';

export function NomencladoresStep() {
  const { evento, guardarYContinuar } = useWizard();
  const { confirm, success } = useConfirmation();
  const [subEventos, setSubEventos] = useState<SubEvento[]>([]);
  const [tematicas, setTematicas] = useState<NomencladorEvento[]>([]);
  const [isSubeventoModalOpen, setIsSubeventoModalOpen] = useState(false);
  const [editingSubeventoId, setEditingSubeventoId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isThematicsManagerOpen, setIsThematicsManagerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [evento?.id]);

  const loadData = () => {
    if (evento?.id) {
      setSubEventos(db.subEventos.getByEvento(evento.id));
      setTematicas(db.nomencladoresEvento.getByEventoAndTipo(evento.id, 'TEMATICA'));
    }
  };

  const getTematicasByIds = (ids: string[]) => {
    return tematicas.filter(t => ids.includes(t.id));
  };

  const openCreateSubevento = () => {
    setEditingSubeventoId(null);
    setIsSubeventoModalOpen(true);
  };

  const openEditSubevento = (subevento: SubEvento) => {
    setEditingSubeventoId(subevento.id);
    setIsSubeventoModalOpen(true);
  };

  const handleDeleteSubevento = async (subevento: SubEvento) => {
    await confirm({
      title: '¿Eliminar Subevento?',
      description: `¿Está seguro de que desea eliminar "${subevento.nombre}"?`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        db.subEventos.delete(subevento.id);
        loadData();
        success({ title: 'Eliminado', description: 'Subevento eliminado correctamente' });
      },
    });
  };

  const handleGuardarPaso = async () => {
    setIsSaving(true);
    try {
      await guardarYContinuar(6, {} as any);
      success({ title: '¡Guardado!', description: 'Continuando al siguiente paso...' });
    } catch (error) {
      toast.error('Error al guardar');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Sección Temáticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Temáticas del Evento
              </CardTitle>
              <CardDescription>
                Administre las temáticas disponibles para los subeventos
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsThematicsManagerOpen(true)}>
              <Layers className="w-4 h-4 mr-2" />
              Gestionar Temáticas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tematicas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay temáticas configuradas</p>
              <p className="text-sm">Haga clic en "Gestionar Temáticas" para agregar</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tematicas.map(t => {
                const assignedSubevento = subEventos.find(se => se.tematicaIds?.includes(t.id));
                return (
                  <Badge 
                    key={t.id} 
                    variant={assignedSubevento ? "default" : "outline"}
                    className="px-3 py-2"
                  >
                    {t.nombre}
                    {assignedSubevento && (
                      <span className="ml-1 text-xs opacity-80">→ {assignedSubevento.nombre}</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección Subeventos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                SubEventos
              </CardTitle>
              <CardDescription>
                Cree simposios, cursos, workshops o ponencias
              </CardDescription>
            </div>
            <Button onClick={openCreateSubevento}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Subevento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subEventos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay subeventos configurados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Temáticas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subEventos.map(se => (
                  <TableRow key={se.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span>{se.nombre}</span>
                        {se.nombreEn && <span className="block text-xs text-muted-foreground">{se.nombreEn}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{se.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      {se.tematicaIds && se.tematicaIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {getTematicasByIds(se.tematicaIds).map(t => (
                            <Badge key={t.id} variant="secondary" className="text-xs">
                              {t.nombre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin temáticas</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={se.isActive ? "default" : "secondary"}>
                        {se.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditSubevento(se)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSubevento(se)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Botón Guardar y Continuar */}
      <div className="flex justify-start">
        <Button onClick={handleGuardarPaso} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>

      {/* Modal de SubEventos - Componente Unificado */}
      <SubEventoFormModal
        isOpen={isSubeventoModalOpen}
        onClose={() => {
          setIsSubeventoModalOpen(false);
          setEditingSubeventoId(null);
        }}
        onSuccess={() => {
          loadData();
          setIsSubeventoModalOpen(false);
          setEditingSubeventoId(null);
        }}
        evento={evento}
        subeventoId={editingSubeventoId}
      />

      {/* Modal de Gestión de Temáticas */}
      <ThematicsManagerModal
        open={isThematicsManagerOpen}
        onOpenChange={setIsThematicsManagerOpen}
        eventoId={evento?.id || ''}
        onSave={loadData}
      />
    </div>
  );
}

export default NomencladoresStep;