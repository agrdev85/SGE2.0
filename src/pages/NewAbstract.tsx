import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { db, Author } from '@/lib/database';
import { ArrowLeft, Loader2, Send, X, Plus, Star, User } from 'lucide-react';
import { toast } from 'sonner';

export default function NewAbstract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summaryText: '',
    eventId: '1',
    thematicId: '',
  });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [authors, setAuthors] = useState<Author[]>([
    {
      id: Date.now().toString(),
      name: user?.name || '',
      email: user?.email || '',
      affiliation: user?.affiliation || '',
      isMainAuthor: true,
    }
  ]);
  const [newAuthor, setNewAuthor] = useState<Partial<Author>>({
    name: '',
    email: '',
    affiliation: '',
  });

  const thematics = db.thematics.getByEvent(formData.eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (keywords.length < 3) {
      toast.error('Añade al menos 3 palabras clave');
      return;
    }
    
    if (formData.summaryText.length < 100) {
      toast.error('El resumen debe tener al menos 100 caracteres');
      return;
    }

    if (!formData.thematicId) {
      toast.error('Selecciona una temática');
      return;
    }

    const mainAuthor = authors.find(a => a.isMainAuthor);
    if (!mainAuthor) {
      toast.error('Debe haber un autor principal');
      return;
    }
    
    setIsLoading(true);
    try {
      db.abstracts.create({
        ...formData,
        keywords,
        authors,
        mainAuthorId: mainAuthor.id,
        userId: user!.id,
      });
      toast.success('Resumen enviado correctamente');
      navigate('/abstracts');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el resumen');
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addAuthor = () => {
    if (!newAuthor.name?.trim()) {
      toast.error('Ingresa el nombre del autor');
      return;
    }

    const author: Author = {
      id: Date.now().toString(),
      name: newAuthor.name.trim(),
      email: newAuthor.email?.trim() || '',
      affiliation: newAuthor.affiliation?.trim() || '',
      isMainAuthor: false,
    };

    setAuthors([...authors, author]);
    setNewAuthor({ name: '', email: '', affiliation: '' });
  };

  const removeAuthor = (authorId: string) => {
    const authorToRemove = authors.find(a => a.id === authorId);
    if (authorToRemove?.isMainAuthor) {
      toast.error('No puedes eliminar al autor principal. Selecciona otro autor principal primero.');
      return;
    }
    setAuthors(authors.filter(a => a.id !== authorId));
  };

  const setMainAuthor = (authorId: string) => {
    setAuthors(authors.map(a => ({
      ...a,
      isMainAuthor: a.id === authorId
    })));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/abstracts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Resúmenes
        </Button>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Enviar Nuevo Resumen</CardTitle>
            <CardDescription>
              Completa el formulario para enviar tu trabajo científico a revisión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Selection */}
              <div className="space-y-2">
                <Label>Evento *</Label>
                <Select
                  value={formData.eventId}
                  onValueChange={(v) => setFormData({ ...formData, eventId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Congreso Internacional de Biotecnología 2024</SelectItem>
                    <SelectItem value="2">Simposio de Nanociencias 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thematic Selection */}
              <div className="space-y-2">
                <Label>Temática *</Label>
                <Select
                  value={formData.thematicId}
                  onValueChange={(v) => setFormData({ ...formData, thematicId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una temática" />
                  </SelectTrigger>
                  <SelectContent>
                    {thematics.map(thematic => (
                      <SelectItem key={thematic.id} value={thematic.id}>
                        {thematic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título del Trabajo *</Label>
                <Input
                  id="title"
                  placeholder="Ingresa el título de tu investigación"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Authors Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Autores *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecciona quién es el autor principal del trabajo
                  </p>
                </div>

                {/* Existing Authors */}
                <div className="space-y-2">
                  {authors.map((author) => (
                    <div
                      key={author.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <RadioGroup
                        value={authors.find(a => a.isMainAuthor)?.id}
                        onValueChange={setMainAuthor}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={author.id} id={`author-${author.id}`} />
                        </div>
                      </RadioGroup>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{author.name}</p>
                          {author.isMainAuthor && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Principal
                            </Badge>
                          )}
                        </div>
                        {author.email && (
                          <p className="text-sm text-muted-foreground">{author.email}</p>
                        )}
                        {author.affiliation && (
                          <p className="text-sm text-muted-foreground">{author.affiliation}</p>
                        )}
                      </div>

                      {!author.isMainAuthor && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAuthor(author.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Author */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Agregar Co-autor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="authorName">Nombre Completo</Label>
                      <Input
                        id="authorName"
                        placeholder="Ej: Dr. Juan Pérez"
                        value={newAuthor.name || ''}
                        onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorEmail">Correo Electrónico (opcional)</Label>
                      <Input
                        id="authorEmail"
                        type="email"
                        placeholder="juan@example.com"
                        value={newAuthor.email || ''}
                        onChange={(e) => setNewAuthor({ ...newAuthor, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorAffiliation">Afiliación (opcional)</Label>
                      <Input
                        id="authorAffiliation"
                        placeholder="Universidad o institución"
                        value={newAuthor.affiliation || ''}
                        onChange={(e) => setNewAuthor({ ...newAuthor, affiliation: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAuthor}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Autor
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Resumen *</Label>
                <Textarea
                  id="summary"
                  placeholder="Describe tu trabajo (mínimo 100 caracteres)"
                  value={formData.summaryText}
                  onChange={(e) => setFormData({ ...formData, summaryText: e.target.value })}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.summaryText.length} / 100 caracteres mínimos
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Palabras Clave * (mínimo 3)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="pl-3 pr-1 py-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 p-0.5 hover:bg-muted-foreground/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe una palabra clave"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/abstracts')}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="hero" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Resumen
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
