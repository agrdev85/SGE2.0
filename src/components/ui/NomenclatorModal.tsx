import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AlertTriangle, Lightbulb, Pencil, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type NomenclatorType = 'hotel' | 'salon' | 'tipoHabitacion' | 'tipoParticipacion';

interface BaseFormData {
  nombre: string;
  descripcion?: string;
}

interface HotelFormData extends BaseFormData {
  cadenaHotelera?: string;
  ciudad?: string;
  categoriaEstrellas: number;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

interface SalonFormData extends BaseFormData {
  codigo: string;
  ubicacion?: string;
  capacidadMaxima: number;
  estado?: 'ACTIVO' | 'INACTIVO';
  hotelId?: string;
}

interface TipoHabitacionFormData extends BaseFormData {
  capacidadMaxPersonas?: number;
  activo?: boolean;
}

interface TipoParticipacionFormData extends BaseFormData {
  requierePago?: boolean;
  apareceEnListadoPublico?: boolean;
  activo?: boolean;
}

type FormData = HotelFormData | SalonFormData | TipoHabitacionFormData | TipoParticipacionFormData;

interface NomenclatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: NomenclatorType;
  mode: 'create' | 'edit';
  formData: FormData;
  onFormChange: (data: FormData) => void;
  errors: Record<string, string>;
  onSave: (data: FormData) => void;
  onDelete?: () => void;
  similarItems?: string[];
  isLoading?: boolean;
}

const getTitle = (type: NomenclatorType, mode: 'create' | 'edit') => {
  const titles = {
    hotel: { create: 'Nuevo Hotel', edit: 'Editar Hotel' },
    salon: { create: 'Nuevo Salón', edit: 'Editar Salón' },
    tipoHabitacion: { create: 'Nuevo Tipo de Habitación', edit: 'Editar Tipo de Habitación' },
    tipoParticipacion: { create: 'Nuevo Tipo de Participación', edit: 'Editar Tipo de Participación' },
  };
  return titles[type][mode];
};

const getDescription = (type: NomenclatorType) => {
  const descriptions = {
    hotel: 'Complete la información del hotel',
    salon: 'Complete la información del salón',
    tipoHabitacion: 'Complete la información del tipo de habitación',
    tipoParticipacion: 'Complete la información del tipo de participación',
  };
  return descriptions[type];
};

export function NomenclatorModal({
  open,
  onOpenChange,
  type,
  mode,
  formData,
  onFormChange,
  errors,
  onSave,
  onDelete,
  similarItems = [],
  isLoading = false,
}: NomenclatorModalProps) {
  const updateField = (field: string, value: any) => {
    onFormChange({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCreateWithDifferentName = () => {
    const fieldName = type === 'salon' ? 'codigo' : 'nombre';
    updateField(fieldName, '');
  };

  const getItemTypeName = (): string => {
    switch (type) {
      case 'hotel':
        return 'hotel';
      case 'salon':
        return 'salón';
      case 'tipoHabitacion':
        return 'tipo de habitación';
      case 'tipoParticipacion':
        return 'tipo de participación';
      default:
        return 'elemento';
    }
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const renderHotelFields = () => {
    const data = formData as HotelFormData;
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Hotel *</Label>
            <Input
              id="nombre"
              value={data.nombre || ''}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Ej: Hotel Sierra Maestra"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cadena">Cadena Hotelera</Label>
            <Input
              id="cadena"
              value={data.cadenaHotelera || ''}
              onChange={(e) => updateField('cadenaHotelera', e.target.value)}
              placeholder="Ej: Gaviota, Islazul"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad *</Label>
            <Input
              id="ciudad"
              value={data.ciudad || ''}
              onChange={(e) => updateField('ciudad', e.target.value)}
              placeholder="Ej: La Habana"
              className={errors.ciudad ? 'border-red-500' : ''}
            />
            {errors.ciudad && <p className="text-xs text-red-500">{errors.ciudad}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="estrellas">Categoría (Estrellas)</Label>
            <Select
              value={String(data.categoriaEstrellas || 3)}
              onValueChange={(v) => updateField('categoriaEstrellas', parseInt(v))}
            >
              <SelectTrigger className="justify-start">
                <span className="text-yellow-400 mr-2">{'⭐'.repeat(data.categoriaEstrellas || 3)}</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1"><span className="text-yellow-400">⭐</span> 1 Estrella</SelectItem>
                <SelectItem value="2"><span className="text-yellow-400">⭐⭐</span> 2 Estrellas</SelectItem>
                <SelectItem value="3"><span className="text-yellow-400">⭐⭐⭐</span> 3 Estrellas</SelectItem>
                <SelectItem value="4"><span className="text-yellow-400">⭐⭐⭐⭐</span> 4 Estrellas</SelectItem>
                <SelectItem value="5"><span className="text-yellow-400">⭐⭐⭐⭐⭐</span> 5 Estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={data.telefono || ''}
              onChange={(e) => updateField('telefono', e.target.value)}
              placeholder="+53 7 xxx xxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contacto@hotel.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={data.descripcion || ''}
            onChange={(e) => updateField('descripcion', e.target.value)}
            placeholder="Descripción detallada del hotel..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="activo"
            checked={data.activo ?? true}
            onCheckedChange={(checked) => updateField('activo', checked)}
          />
          <Label htmlFor="activo">Hotel activo</Label>
        </div>
      </>
    );
  };

  const renderSalonFields = () => {
    const data = formData as SalonFormData;
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código del Salón *</Label>
            <Input
              id="codigo"
              value={data.codigo || ''}
              onChange={(e) => updateField('codigo', e.target.value.toUpperCase())}
              placeholder="Ej: SALON-01"
              className={errors.codigo ? 'border-red-500' : ''}
            />
            {errors.codigo && <p className="text-xs text-red-500">{errors.codigo}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Salón *</Label>
            <Input
              id="nombre"
              value={data.nombre || ''}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Ej: Sala Principal"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={data.ubicacion || ''}
              onChange={(e) => updateField('ubicacion', e.target.value)}
              placeholder="Ej: Piso 2, Ala Norte"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacidad">Capacidad Máxima</Label>
            <Input
              id="capacidad"
              type="number"
              value={data.capacidadMaxima || 100}
              onChange={(e) => updateField('capacidadMaxima', parseInt(e.target.value) || 0)}
              min={1}
              className={errors.capacidadMaxima ? 'border-red-500' : ''}
            />
            {errors.capacidadMaxima && <p className="text-xs text-red-500">{errors.capacidadMaxima}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={data.descripcion || ''}
            onChange={(e) => updateField('descripcion', e.target.value)}
            placeholder="Descripción del salón, servicios disponibles..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={data.estado || 'ACTIVO'}
            onValueChange={(v) => updateField('estado', v as 'ACTIVO' | 'INACTIVO')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  };

  const renderTipoHabitacionFields = () => {
    const data = formData as TipoHabitacionFormData;
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Tipo *</Label>
          <Input
            id="nombre"
            value={data.nombre || ''}
            onChange={(e) => updateField('nombre', e.target.value)}
            placeholder="Ej: Habitación Estándar"
            className={errors.nombre ? 'border-red-500' : ''}
          />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={data.descripcion || ''}
            onChange={(e) => updateField('descripcion', e.target.value)}
            placeholder="Descripción del tipo de habitación, servicios incluidos..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacidad">Capacidad Máxima de Personas</Label>
          <Input
            id="capacidad"
            type="number"
            value={data.capacidadMaxPersonas || 2}
            onChange={(e) => updateField('capacidadMaxPersonas', parseInt(e.target.value) || 1)}
            min={1}
            max={10}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="activo"
            checked={data.activo ?? true}
            onCheckedChange={(checked) => updateField('activo', checked)}
          />
          <Label htmlFor="activo">Tipo de habitación activo</Label>
        </div>
      </>
    );
  };

  const renderTipoParticipacionFields = () => {
    const data = formData as TipoParticipacionFormData;
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Tipo *</Label>
          <Input
            id="nombre"
            value={data.nombre || ''}
            onChange={(e) => updateField('nombre', e.target.value)}
            placeholder="Ej: Participante Regular"
            className={errors.nombre ? 'border-red-500' : ''}
          />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={data.descripcion || ''}
            onChange={(e) => updateField('descripcion', e.target.value)}
            placeholder="Descripción del tipo de participación, derechos incluidos..."
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="requierePago"
              checked={data.requierePago ?? true}
              onCheckedChange={(checked) => updateField('requierePago', checked)}
            />
            <Label htmlFor="requierePago">Requiere pago de inscripción</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="apareceEnListado"
              checked={data.apareceEnListadoPublico ?? true}
              onCheckedChange={(checked) => updateField('apareceEnListadoPublico', checked)}
            />
            <Label htmlFor="apareceEnListado">Visible en listado público</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="activo"
              checked={data.activo ?? true}
              onCheckedChange={(checked) => updateField('activo', checked)}
            />
            <Label htmlFor="activo">Tipo de participación activo</Label>
          </div>
        </div>
      </>
    );
  };

  const renderFields = () => {
    switch (type) {
      case 'hotel':
        return renderHotelFields();
      case 'salon':
        return renderSalonFields();
      case 'tipoHabitacion':
        return renderTipoHabitacionFields();
      case 'tipoParticipacion':
        return renderTipoParticipacionFields();
    }
  };

  const getCurrentValue = (): string => {
    switch (type) {
      case 'hotel':
      case 'tipoHabitacion':
      case 'tipoParticipacion':
        return (formData as BaseFormData).nombre || '';
      case 'salon':
        return (formData as SalonFormData).codigo || '';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-primary" />
            )}
            {getTitle(type, mode)}
          </DialogTitle>
          <DialogDescription>{getDescription(type)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {renderFields()}
        </form>
        
        {similarItems.length > 0 && (
          <div className="mx-6 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  "{getCurrentValue()}" ya existe
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                  {mode === 'edit' 
                    ? 'Ya existe otro elemento con este nombre. El cambio puede generar duplicados.'
                    : 'Este nombre ya está en uso. Puede seleccionar uno existente o usar otro nombre.'}
                </p>
                {mode === 'create' && similarItems.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {similarItems.slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
          
          <div className="flex gap-2 sm:ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            
            {similarItems.length > 0 && mode === 'create' ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Seleccionar existente
                </Button>
                <Button onClick={handleCreateWithDifferentName} disabled={isLoading}>
                  Crear con otro nombre
                </Button>
              </>
            ) : mode === 'edit' && similarItems.length > 0 ? (
              <>
                <Button variant="outline" onClick={handleCreateWithDifferentName} disabled={isLoading}>
                  Cambiar nombre
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                  Guardar de todos modos
                </Button>
              </>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {mode === 'edit' ? 'Guardar Cambios' : 'Crear'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`¿Eliminar ${getItemTypeName()}?`}
        description={`¿Está seguro de que desea eliminar este ${getItemTypeName()}? Esta acción no se puede deshacer.`}
        itemName={getCurrentValue()}
        itemType={getItemTypeName()}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          onDelete?.();
          setIsDeleteConfirmOpen(false);
        }}
      />
    </Dialog>
  );
}

export default NomenclatorModal;
