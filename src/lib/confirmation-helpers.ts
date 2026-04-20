import { ConfirmationConfig } from '@/hooks/useConfirmation';

export const confirmDelete = (
  itemName: string,
  itemType: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'itemName' | 'itemType' | 'variant' | 'onConfirm'>>
): ConfirmationConfig => ({
  title: `¿Eliminar ${itemType}?`,
  description: `¿Está seguro de que desea eliminar este ${itemType}? Esta acción no se puede deshacer.`,
  itemName,
  itemType,
  variant: 'danger',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  onConfirm,
  ...options,
});

export const confirmDeleteMultiple = (
  count: number,
  itemType: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'variant' | 'onConfirm'>>
): ConfirmationConfig => ({
  title: `¿Eliminar ${count} ${itemType}${count > 1 ? 's' : ''}?`,
  description: `¿Está seguro de que desea eliminar ${count > 1 ? 'estos' : 'esta'} ${count} ${itemType}${count > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
  itemName: `${count} elemento${count > 1 ? 's' : ''}`,
  itemType,
  variant: 'danger',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  onConfirm,
  ...options,
});

export const confirmCreate = (
  itemType: string,
  itemName: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'itemName' | 'itemType' | 'variant' | 'onConfirm'>>
): ConfirmationConfig => ({
  title: `¿Crear ${itemType}?`,
  description: `¿Está seguro de que desea crear este ${itemType}?`,
  itemName,
  itemType,
  variant: 'success',
  confirmText: 'Crear',
  cancelText: 'Cancelar',
  onConfirm,
  ...options,
});

export const confirmUpdate = (
  itemType: string,
  itemName: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'itemName' | 'itemType' | 'variant' | 'onConfirm'>>
): ConfirmationConfig => ({
  title: `¿Actualizar ${itemType}?`,
  description: `¿Está seguro de que desea guardar los cambios en este ${itemType}?`,
  itemName,
  itemType,
  variant: 'info',
  confirmText: 'Guardar',
  cancelText: 'Cancelar',
  onConfirm,
  ...options,
});

export const confirmAction = (
  title: string,
  description: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'onConfirm'>>
): ConfirmationConfig => ({
  title,
  description,
  variant: 'warning',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  onConfirm,
  ...options,
});

export const confirmBulkAction = (
  action: 'delete' | 'update' | 'create',
  count: number,
  itemType: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<ConfirmationConfig, 'title' | 'description' | 'itemName' | 'itemType' | 'variant' | 'onConfirm'>>
): ConfirmationConfig => {
  const actionConfig = {
    delete: {
      title: `¿Eliminar ${count} ${itemType}${count > 1 ? 's' : ''}?`,
      description: `¿Está seguro de que desea eliminar ${count > 1 ? 'estos' : 'esta'} ${count} ${itemType}${count > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      variant: 'danger' as const,
      confirmText: 'Eliminar',
    },
    update: {
      title: `¿Actualizar ${count} ${itemType}${count > 1 ? 's' : ''}?`,
      description: `¿Está seguro de que desea aplicar los cambios a ${count > 1 ? 'estos' : 'esta'} ${count} ${itemType}${count > 1 ? 's' : ''}?`,
      variant: 'info' as const,
      confirmText: 'Actualizar',
    },
    create: {
      title: `¿Crear ${count} ${itemType}${count > 1 ? 's' : ''}?`,
      description: `¿Está seguro de que desea crear ${count > 1 ? 'estos' : 'esta'} ${count} ${itemType}${count > 1 ? 's' : ''}?`,
      variant: 'success' as const,
      confirmText: 'Crear',
    },
  };

  const config = actionConfig[action];

  return {
    ...config,
    itemName: `${count} elemento${count > 1 ? 's' : ''}`,
    itemType,
    cancelText: 'Cancelar',
    onConfirm,
    ...options,
  };
};
