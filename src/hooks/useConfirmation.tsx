import { useCallback } from 'react';
import {
  ConfirmationDialog,
  SuccessDialog as SuccessDialogExport,
  ConfirmationVariant,
} from '@/components/ui/ConfirmationDialog';

const SuccessDialog = SuccessDialogExport;

export interface ConfirmationConfig {
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  successMessage?: string;
  errorMessage?: string;
  autoCloseDelay?: number;
}

export function useConfirmation() {
  const confirm = useCallback(async (config: ConfirmationConfig) => {
    const result = await ConfirmationDialog.show({
      title: config.title,
      description: config.description,
      itemName: config.itemName,
      itemType: config.itemType,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      variant: config.variant,
    });
    
    if (result && config.onConfirm) {
      await config.onConfirm();
      if (config.successMessage) {
        await SuccessDialog.show({
          title: '¡Eliminado!',
          description: config.successMessage,
          autoClose: config.autoCloseDelay || 2000,
        });
      } else if (config.itemName) {
        await SuccessDialog.show({
          title: '¡Eliminado!',
          description: `${config.itemType || 'Elemento'} "${config.itemName}" ha sido eliminado correctamente.`,
          autoClose: config.autoCloseDelay || 2000,
        });
      }
    } else if (!result && config.onCancel) {
      config.onCancel();
    }
  }, []);

  const success = useCallback(async (options: { title?: string; description?: string; autoClose?: number }) => {
    await SuccessDialog.show(options);
  }, []);

  return { confirm, success };
}

export default useConfirmation;
