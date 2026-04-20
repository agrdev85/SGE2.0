import { useState, useEffect, useMemo } from 'react';
import { db, Event, EmailTemplate, User } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { 
  Plus, Pencil, Trash2, Send, Eye, Mail, CheckCircle, AlertCircle,
  Settings, Zap, Users, Clock, Check, X, Copy, Code, Variable
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/ConfirmationDialog';
import { cn } from '@/lib/utils';

interface EmailTemplateManagerProps {
  event: Event;
}

const templateTypes = [
  { value: 'INSCRIPCION', label: 'Confirmación de Inscripción', icon: '📧', color: 'bg-green-100 text-green-700' },
  { value: 'ASIGNACION_JURADO', label: 'Asignación de Jurado', icon: '👥', color: 'bg-blue-100 text-blue-700' },
  { value: 'APROBADO', label: 'Trabajo Aprobado', icon: '✅', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'RECHAZADO', label: 'Trabajo Rechazado', icon: '❌', color: 'bg-red-100 text-red-700' },
  { value: 'CERTIFICADO', label: 'Envío de Certificado', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CUSTOM', label: 'Plantilla Personalizada', icon: '📝', color: 'bg-purple-100 text-purple-700' },
];

const autoTriggerOptions = [
  { value: 'ON_INSCRIPTION', label: 'Nueva Inscripción', description: 'Se envía cuando un usuario se inscribe al evento' },
  { value: 'ON_ABSTRACT_SUBMIT', label: 'Envío de Trabajo', description: 'Se envía al submitir un resumen/abstract' },
  { value: 'ON_ABSTRACT_APPROVED', label: 'Trabajo Aprobado', description: 'Se envía cuando un trabajo es aprobado' },
  { value: 'ON_ABSTRACT_REJECTED', label: 'Trabajo Rechazado', description: 'Se envía cuando un trabajo es rechazado' },
  { value: 'ON_CERTIFICATE_READY', label: 'Certificado Listo', description: 'Se envía cuando el certificado está disponible' },
];

const VARIABLES = [
  { key: 'userName', label: 'Nombre del usuario', example: 'Juan Pérez' },
  { key: 'userEmail', label: 'Correo electrónico', example: 'juan@email.com' },
  { key: 'eventName', label: 'Nombre del evento', example: 'Congreso 2026' },
  { key: 'eventDate', label: 'Fecha del evento', example: '15-20 Jun 2026' },
  { key: 'primaryColor', label: 'Color primario', example: '#3b82f6' },
  { key: 'secondaryColor', label: 'Color secundario', example: '#60a5fa' },
  { key: 'bannerImage', label: 'Banner del evento', example: 'https://...' },
  { key: 'abstractTitle', label: 'Título del trabajo', example: 'Mi Investigación' },
  { key: 'categoryType', label: 'Categoría', example: 'Ponencia' },
  { key: 'deadline', label: 'Fecha límite', example: '31 Dic 2024' },
];

export function EmailTemplateManager({ event }: EmailTemplateManagerProps) {
  const { success, confirm } = useConfirmation();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [sendDialog, setSendDialog] = useState<{ open: boolean; templateId: string | null }>({ open: false, templateId: null });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);

  const [formData, setFormData] = useState<{
    type: EmailTemplate['type'];
    name: string;
    subject: string;
    htmlBody: string;
    autoTrigger?: string;
  }>({
    type: 'CUSTOM',
    name: '',
    subject: '',
    htmlBody: '',
    autoTrigger: undefined,
  });

  useEffect(() => {
    loadData();
  }, [event.id]);

  const loadData = () => {
    setTemplates(db.emailTemplates.getByEvent(event.id));
    setUsers(db.users.getAll());
  };

  const resetEditor = () => {
    setEditorKey(prev => prev + 1);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      type: 'CUSTOM',
      name: '',
      subject: '',
      htmlBody: getDefaultTemplate(),
      autoTrigger: undefined,
    });
    setShowVariablesPanel(false);
    resetEditor();
    setIsEditorOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name || '',
      subject: template.subject,
      htmlBody: template.htmlBody || '',
      autoTrigger: template.autoTrigger || undefined,
    });
    setShowVariablesPanel(false);
    resetEditor();
    setIsEditorOpen(true);
  };

  const getDefaultTemplate = () => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">{{eventName}}</h1>
  </div>
  <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e5e5;">
    <h2 style="color: #333; margin-top: 0;">Hola {{userName}},</h2>
    <p style="color: #666; line-height: 1.6;">Escribe tu mensaje aquí...</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: {{primaryColor}}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Botón de Acción</a>
    </div>
  </div>
  <div style="padding: 20px; background: #f5f5f5; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px;">
    <p style="margin: 0;">{{eventName}} - Todos los derechos reservados</p>
  </div>
</div>`.trim();

  const handleSave = () => {
    if (!formData.subject || !formData.htmlBody) {
      toast.error('Completa el asunto y el contenido del email');
      return;
    }

    try {
      if (editingTemplate) {
        db.emailTemplates.update(editingTemplate.id, {
          type: formData.type,
          name: formData.name,
          subject: formData.subject,
          htmlBody: formData.htmlBody,
          autoTrigger: formData.autoTrigger as any,
        });
        toast.success('Plantilla actualizada correctamente');
      } else {
        db.emailTemplates.create({
          type: formData.type,
          name: formData.name,
          subject: formData.subject,
          htmlBody: formData.htmlBody,
          eventId: event.id,
          autoTrigger: formData.autoTrigger as any,
        });
        toast.success('Plantilla creada correctamente');
      }
      setIsEditorOpen(false);
      loadData();
    } catch {
      toast.error('Error al guardar la plantilla');
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    const confirmed = await confirm({
      title: '¿Eliminar plantilla?',
      description: `Se eliminará "${template.name || template.subject}". Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
    });

    if (confirmed) {
      db.emailTemplates.delete(template.id);
      toast.success('Plantilla eliminada');
      loadData();
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

  const openSendDialog = (templateId: string) => {
    setSelectedUsers([]);
    setUserSearch('');
    setSendDialog({ open: true, templateId });
  };

  const handleSendEmails = async () => {
    if (!sendDialog.templateId || selectedUsers.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    try {
      db.emailService.sendBulkEmail(
        event.id,
        sendDialog.templateId,
        selectedUsers,
        { eventDate: `${event.startDate} - ${event.endDate}` }
      );
      
      toast.success(`${selectedUsers.length} email(s) enviado(s) correctamente`);
      setSendDialog({ open: false, templateId: null });
    } catch {
      toast.error('Error al enviar los emails');
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      htmlBody: prev.htmlBody + `{{${variable}}}`,
    }));
    toast.success(`Variable {{${variable}}} insertada`);
  };

  const handleAutoTriggerChange = async (trigger: string, enabled: boolean, templateId: string) => {
    if (enabled && templateId) {
      templates.forEach(t => {
        if (t.autoTrigger === trigger && t.id !== templateId) {
          db.emailTemplates.update(t.id, { autoTrigger: undefined } as any);
        }
      });
      db.emailTemplates.update(templateId, { autoTrigger: trigger } as any);
      toast.success('Automatización activada');
    } else {
      const t = templates.find(t => t.autoTrigger === trigger);
      if (t) {
        db.emailTemplates.update(t.id, { autoTrigger: undefined } as any);
      }
      toast.success('Automatización desactivada');
    }
    loadData();
  };

  const getTemplateTypeInfo = (type: string) => templateTypes.find(t => t.value === type) || templateTypes[5];

  const renderPreviewHtml = (template: EmailTemplate) => {
    let html = template.htmlBody;
    const variables: Record<string, string> = {
      userName: 'Usuario de Ejemplo',
      userEmail: 'usuario@ejemplo.com',
      eventName: event.name,
      primaryColor: event.primaryColor,
      secondaryColor: event.secondaryColor,
      bannerImage: event.bannerImageUrl || 'https://picsum.photos/600/200',
      eventDate: `${event.startDate} - ${event.endDate}`,
      abstractTitle: 'Título del Trabajo',
      categoryType: 'Ponencia',
      deadline: '31 Dic 2024',
    };
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return html;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Gestión de Plantillas de Email
          </h2>
          <p className="text-muted-foreground mt-1">
            Configura plantillas y automatizaciones para comunicar con los participantes
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="h-20 w-20 rounded-2xl bg-muted mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay plantillas creadas</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crea tu primera plantilla de email para comenzar a comunicarte con los participantes del evento
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Primera Plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(template => {
            const typeInfo = getTemplateTypeInfo(template.type);
            const autoTrigger = autoTriggerOptions.find(t => t.value === template.autoTrigger);
            return (
              <Card key={template.id} className="hover:shadow-lg transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xl", typeInfo.color)}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {template.name || template.subject}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSendDialog(template.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(template)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.subject}</p>
                  {autoTrigger && (
                    <Badge variant="outline" className="gap-1 mb-3 bg-purple-50 text-purple-700 border-purple-200">
                      <Zap className="h-3 w-3" />
                      {autoTrigger.label}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openSendDialog(template.id)}>
                      <Send className="h-3 w-3" /> Enviar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEditDialog(template)}>
                      <Settings className="h-3 w-3" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Automatizaciones</CardTitle>
              <CardDescription>Configura el envío automático de emails según eventos del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {autoTriggerOptions.map(trigger => {
            const linkedTemplate = templates.find(t => t.autoTrigger === trigger.value);
            return (
              <div key={trigger.value} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{trigger.label}</p>
                    <p className="text-sm text-muted-foreground">{trigger.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={linkedTemplate?.id || ''}
                    onValueChange={(templateId) => {
                      if (templateId) {
                        handleAutoTriggerChange(trigger.value, true, templateId);
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sin asignar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name || t.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    linkedTemplate ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    {linkedTemplate ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogPrimitive.Portal>
          <DialogOverlay className="fixed inset-0 bg-black/70 z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full h-full max-w-7xl max-h-[calc(100vh-2rem)] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  {editingTemplate ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  <h2 className="text-xl font-bold">
                    {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Email'}
                  </h2>
                </div>
                <button
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  onClick={() => setIsEditorOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Config Row */}
              <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nombre (opcional)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre descriptivo"
                    />
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-muted-foreground">Asunto del Email *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Asunto que verán los destinatarios..."
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Editor Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Contenido del Email *</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                      className="gap-2"
                    >
                      <Variable className="h-4 w-4" />
                      {showVariablesPanel ? 'Ocultar' : 'Insertar'} Variables
                    </Button>
                  </div>
                  
                  {showVariablesPanel && (
                    <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Haz clic para insertar una variable:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {VARIABLES.map(v => (
                          <button
                            key={v.key}
                            onClick={() => insertVariable(v.key)}
                            className="flex items-center gap-2 p-2 text-left rounded-lg hover:bg-background transition-colors text-sm"
                          >
                            <code className="text-primary font-mono text-xs bg-primary/10 px-1.5 py-0.5 rounded">{'{{' + v.key + '}}'}</code>
                            <span className="text-muted-foreground text-xs">{v.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <RichTextEditor
                      key={editorKey}
                      value={formData.htmlBody}
                      onChange={(value) => setFormData({ ...formData, htmlBody: value })}
                      placeholder="Escribe el contenido de tu email aquí..."
                      minHeight="400px"
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 flex flex-col overflow-y-auto">
                  <div className="mb-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Vista Previa
                    </h4>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <div 
                        className="p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: renderPreviewHtml({ ...formData, id: '', eventId: event.id } as EmailTemplate) }}
                      />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automatización
                    </h4>
                    <Select
                      value={formData.autoTrigger || 'none'}
                      onValueChange={(v) => setFormData({ ...formData, autoTrigger: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin automatizar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin automatizar</SelectItem>
                        {autoTriggerOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Check className="h-4 w-4" />
                    {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Portal>
      </Dialog>

      <Dialog open={sendDialog.open} onOpenChange={(open) => !open && setSendDialog({ open: false, templateId: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar Email
            </DialogTitle>
            <DialogDescription>
              Selecciona los destinatarios para enviar esta plantilla
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar usuarios</Label>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
              />
            </div>

            <div className="border rounded-xl max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-0 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="h-4 w-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">
                <Users className="h-4 w-4 inline mr-1" />
                {selectedUsers.length} de {users.length} destinatarios
              </span>
              {selectedUsers.length > 0 && selectedUsers.length < users.length && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(users.map(u => u.id))}>
                  Seleccionar todos
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog({ open: false, templateId: null })}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmails} disabled={selectedUsers.length === 0} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
