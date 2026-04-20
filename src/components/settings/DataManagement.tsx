import React, { useState, useRef } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, FileJson, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/hooks/useConfirmation';
import { 
  exportDatabase, 
  downloadExport, 
  importDatabase, 
  validateImportData,
  getImportPreview,
  getDatabaseStats,
  getTotalDataSize,
  formatBytes,
  type CollectionInfo
} from '@/lib/exportImport';

interface DataManagementProps {
  className?: string;
}

export function DataManagement({ className }: DataManagementProps) {
  const { isSuperAdmin } = useAuth();
  const { confirm, success } = useConfirmation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<CollectionInfo[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importData, setImportData] = useState<unknown | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [totalSize, setTotalSize] = useState(0);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setStats(getDatabaseStats());
    setTotalSize(getTotalDataSize());
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      downloadExport();
      await success({
        title: '¡Exportación completada!',
        description: 'El archivo se ha descargado correctamente.',
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview(null);
    setImportData(null);
    setShowPreview(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        const validation = validateImportData(data);
        if (!validation.valid) {
          setImportError(validation.errors.join('\n'));
          return;
        }

        const preview = getImportPreview(data);
        setImportPreview(preview);
        setImportData(data);
        setShowPreview(true);
      } catch (error) {
        setImportError('El archivo no es un JSON válido');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async (mode: 'replace' | 'merge') => {
    if (!importData) return;

    const modeText = mode === 'replace' ? 'reemplazar todos los datos' : 'combinar con datos existentes';
    
    setIsImporting(true);
    try {
      const result = importDatabase(importData, mode);
      
      if (result.success) {
        await success({
          title: '¡Importación completada!',
          description: result.message,
        });
        setImportPreview(null);
        setImportData(null);
        setShowPreview(false);
        loadStats();
      } else {
        setImportError(result.errors.join('\n'));
      }
    } catch (error) {
      setImportError('Error al importar los datos');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    setImportPreview(null);
    setImportData(null);
    setImportError(null);
    setShowPreview(false);
  };

  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);

  if (!isSuperAdmin) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Gestión de Datos
          </CardTitle>
          <CardDescription>
            Solo los administradores pueden gestionar los datos del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg text-muted-foreground">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Acceso restringido</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Gestión de Datos
        </CardTitle>
        <CardDescription>
          Exporta e importa todos los datos del sistema. Total: {totalItems.toLocaleString()} elementos ({formatBytes(totalSize)})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">Exportar</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Descarga una copia de seguridad de todos los datos en formato JSON.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Base de Datos
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-card border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium">Importar</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Restaura los datos desde un archivo de respaldo JSON previamente exportado.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
              id="import-file"
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Archivo
            </Button>
          </div>
        </div>

        {importError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200">Error de importación</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-line">
                  {importError}
                </p>
              </div>
            </div>
          </div>
        )}

        {showPreview && importPreview && (
          <div className="p-4 bg-card border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium">Vista Previa de Importación</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancelImport}>
                Cancelar
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Colección</th>
                    <th className="text-right py-2 px-3 font-medium">Elementos</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((collection) => (
                    <tr key={collection.name} className="border-b dark:border-border">
                      <td className="py-2 px-3">{collection.displayName}</td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                        {collection.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 border-t">
                  <tr>
                    <td className="py-2 px-3 font-medium">Total</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {importPreview.reduce((sum, c) => sum + c.count, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  confirm({
                    title: 'Confirmar Importación',
                    description: '¿Está seguro de que desea importar los datos? Se combinarán con los datos existentes. Esta acción no se puede deshacer.',
                    variant: 'danger',
                    confirmText: 'Importar',
                    cancelText: 'Cancelar',
                    onConfirm: () => handleImport('merge'),
                  });
                }}
                disabled={isImporting}
                className="flex-1"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Combinar (Mantener datos existentes)
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  confirm({
                    title: 'Confirmar Importación',
                    description: '¿Está seguro de que desea importar los datos? Esto reemplazará TODOS los datos existentes. Esta acción no se puede deshacer.',
                    variant: 'danger',
                    confirmText: 'Reemplazar',
                    cancelText: 'Cancelar',
                    onConfirm: () => handleImport('replace'),
                  });
                }}
                disabled={isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Reemplazar Todo
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 bg-muted/30 rounded-xl">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Resumen de Datos
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(stats)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([key, count]) => (
                <div key={key} className="flex justify-between px-2 py-1 bg-background/50 rounded">
                  <span className="text-muted-foreground truncate">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono ml-2">{count}</span>
                </div>
              ))}
          </div>
          {Object.values(stats).filter(c => c > 0).length > 12 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              y {Object.values(stats).filter(c => c > 0).length - 12} más...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DataManagement;
