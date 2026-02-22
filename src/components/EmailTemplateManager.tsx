import { useState, useEffect } from 'react';
import { db, Event, EmailTemplate, User } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Send, Eye, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateManagerProps {
  event: Event;
}

const templateTypes = [
  { value: 'INSCRIPCION', label: 'Confirmación de Inscripción' },
  { value: 'ASIGNACION_JURADO', label: 'Asignación de Jurado' },
  { value: 'APROBADO', label: 'Trabajo Aprobado' },
  { value: 'RECHAZADO', label: 'Trabajo Rechazado' },
  { value: 'CERTIFICADO', label: 'Envío de Certificado' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const availableVariables = [
  { key: 'userName', description: 'Nombre del usuario' },
  { key: 'userEmail', description: 'Email del usuario' },
  { key: 'eventName', description: 'Nombre del evento' },
  { key: 'eventDate', description: 'Fecha del evento' },
  { key: 'primaryColor', description: 'Color primario' },
  { key: 'secondaryColor', description: 'Color secundario' },
  { key: 'bannerImage', description: 'URL del banner' },
  { key: 'backgroundImage', description: 'URL imagen de fondo' },
  { key: 'abstractTitle', description: 'Título del trabajo' },
  { key: 'categoryType', description: 'Categoría asignada' },
  { key: 'workCount', description: 'Cantidad de trabajos' },
  { key: 'deadline', description: 'Fecha límite' },
];

export function EmailTemplateManager({ event }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    type: 'CUSTOM' as EmailTemplate['type'],
    name: '',
    subject: '',
    htmlBody: '',
  });

  useEffect(() => {
    loadTemplates();
    setUsers(db.users.getAll());
  }, [event.id]);

  const loadTemplates = () => {
    setTemplates(db.emailTemplates.getByEvent(event.id));
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      type: 'CUSTOM',
      name: '',
      subject: '',
      htmlBody: getDefaultTemplate(),
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name || '',
      subject: template.subject,
      htmlBody: template.htmlBody,
    });
    setIsDialogOpen(true);
  };

  const getDefaultTemplate = () => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); padding: 40px; text-align: center;">
    <img src="{{bannerImage}}" alt="{{eventName}}" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <h1 style="color: {{primaryColor}};">Hola {{userName}},</h1>
    <p>Escribe tu mensaje aquí...</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Botón de Acción</a>
    </div>
  </div>
  <div style="padding: 20px; background: #f5f5f5; text-align: center; font-size: 12px; color: #666;">
    <p>{{eventName}} - Todos los derechos reservados</p>
  </div>
</div>
  `.trim();

  const handleSave = () => {
    if (!formData.subject || !formData.htmlBody) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      if (editingTemplate) {
        db.emailTemplates.update(editingTemplate.id, {
          ...formData,
          eventId: event.id,
        });
        toast.success('Plantilla actualizada');
      } else {
        db.emailTemplates.create({
          ...formData,
          eventId: event.id,
        });
        toast.success('Plantilla creada');
      }
      setIsDialogOpen(false);
      loadTemplates();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta plantilla?')) {
      db.emailTemplates.delete(id);
      toast.success('Plantilla eliminada');
      loadTemplates();
    }
  };

  const openSendDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSelectedRecipients([]);
    setIsSendDialogOpen(true);
  };

  const openPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSendEmails = () => {
    if (!selectedTemplate || selectedRecipients.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    try {
      db.emailService.sendBulkEmail(
        event.id,
        selectedTemplate.id,
        selectedRecipients,
        {
          eventDate: `${event.startDate} - ${event.endDate}`,
        }
      );
      toast.success(`${selectedRecipients.length} email(s) enviado(s) correctamente`);
      setIsSendDialogOpen(false);
    } catch {
      toast.error('Error al enviar emails');
    }
  };

  const renderPreviewHtml = (template: EmailTemplate) => {
    let html = template.htmlBody;
    const variables: Record<string, string> = {
      userName: 'Usuario de Ejemplo',
      userEmail: 'usuario@ejemplo.com',
      eventName: event.name,
      primaryColor: event.primaryColor,
      secondaryColor: event.secondaryColor,
      bannerImage: event.bannerImageUrl,
      backgroundImage: event.backgroundImageUrl || event.bannerImageUrl,
      eventDate: `${event.startDate} - ${event.endDate}`,
      abstractTitle: 'Título del Trabajo de Ejemplo',
      categoryType: 'Ponencia',
      workCount: '5',
      deadline: '2024-12-31',
    };

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });

    return html;
  };

  const insertVariable = (key: string) => {
    setFormData(prev => ({
      ...prev,
      htmlBody: prev.htmlBody + `{{${key}}}`,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Plantillas de Email</h2>
          <p className="text-sm text-muted-foreground">
            Crea y gestiona emails personalizados para el evento
          </p>
        </div>
        <Button variant="hero" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
            <p className="text-muted-foreground mb-4">
              Crea plantillas de email personalizadas para tu evento
            </p>
            <Button variant="hero" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Crear Plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-display">
                      {template.name || template.subject}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {templateTypes.find(t => t.value === template.type)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPreview(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.subject}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openSendDialog(template)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Email'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Email</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as EmailTemplate['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre (opcional)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre descriptivo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asunto *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Asunto del email..."
                />
              </div>

              <div className="space-y-2">
                <Label>Contenido HTML *</Label>
                <Textarea
                  value={formData.htmlBody}
                  onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="p-4"
                  dangerouslySetInnerHTML={{
                    __html: renderPreviewHtml({ ...formData, id: '', eventId: event.id } as EmailTemplate),
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="variables" className="mt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Haz clic en una variable para insertarla en el contenido. Usa el formato {'{{variable}}'}.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableVariables.map(v => (
                    <Button
                      key={v.key}
                      variant="outline"
                      className="justify-start h-auto py-2"
                      onClick={() => insertVariable(v.key)}
                    >
                      <code className="text-primary mr-2">{`{{${v.key}}}`}</code>
                      <span className="text-muted-foreground text-xs">{v.description}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSave}>
              {editingTemplate ? 'Actualizar' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Enviar Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Plantilla</Label>
              <p className="text-sm text-muted-foreground">{selectedTemplate?.subject}</p>
            </div>

            <div>
              <Label className="mb-2 block">Seleccionar Destinatarios</Label>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {users.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipients([...selectedRecipients, user.id]);
                        } else {
                          setSelectedRecipients(selectedRecipients.filter(id => id !== user.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedRecipients.length} destinatario(s) seleccionado(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSendEmails}>
              <Send className="h-4 w-4 mr-2" />
              Enviar ({selectedRecipients.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Vista Previa del Email</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="border rounded-lg overflow-hidden">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderPreviewHtml(selectedTemplate),
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
