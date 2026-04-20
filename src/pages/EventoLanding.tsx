import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, MacroEvent, Event } from '@/lib/database';
import { Calendar, ArrowLeft, Users, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

export default function EventoLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [macro, setMacro] = useState<MacroEvent | null>(null);
  const [subEvents, setSubEvents] = useState<Event[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      return;
    }

    const allMacroEvents = db.macroEvents.getAll();
    
    const me = allMacroEvents.find(m => {
      const urlEvento = (m as any).urlEvento || '';
      return urlEvento.toLowerCase() === slug.toLowerCase() || 
             m.acronym?.toLowerCase() === slug.toLowerCase() ||
             m.id === slug;
    });

    if (me) {
      setMacro(me);
      const events = db.events.getAll().filter(e => e.macroEventId === me.id);
      setSubEvents(events);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }, [slug]);

  if (notFound || !macro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-muted-foreground mb-2">404</h1>
          <p className="text-xl text-muted-foreground">Evento no encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            El evento "{slug}" no existe o no está disponible.
          </p>
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          Volver al inicio
        </Button>
      </div>
    );
  }

  const primaryColor = macro.primaryColor || '#3b82f6';
  const secondaryColor = macro.secondaryColor || '#60a5fa';
  const backgroundColor = (macro as any).backgroundColor || '';
  const backgroundImage = (macro as any).backgroundImageUrl || '';

  return (
    <div 
      className="min-h-screen bg-background"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : backgroundColor ? {
        backgroundColor,
      } : undefined}
    >
      {/* Header */}
      <header className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={macro.bannerImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&h=600&fit=crop'}
          alt={macro.name}
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0" 
          style={{ background: `linear-gradient(to top, ${primaryColor}ee, ${secondaryColor}66, transparent)` }}
        />
        <div className="absolute top-4 left-4">
          <Button variant="secondary" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t('event.back')}
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <Badge className="mb-2 bg-white/20 text-white">{macro.acronym}</Badge>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-2">{macro.name}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {macro.startDate && format(new Date(macro.startDate), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })} - 
              {macro.endDate && format(new Date(macro.endDate), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Description */}
        {macro.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-lg text-muted-foreground">{macro.description}</p>
            </CardContent>
          </Card>
        )}

        {/* HTML Content */}
        {(macro as any).contenidoHtml && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: (macro as any).contenidoHtml }}
              />
            </CardContent>
          </Card>
        )}

        {/* Sub Events */}
        <section>
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Layers className="h-6 w-6" />
            {t('event.activities')}
          </h2>
          
          {subEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('event.noSubEvents')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subEvents.filter(e => e.isActive).map(event => (
                <Link key={event.id} to={`/event/${event.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <div 
                      className="h-32 relative"
                      style={{ backgroundColor: primaryColor + '20' }}
                    >
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-bold text-white line-clamp-2">{event.name}</h3>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      {event.nameEn && (
                        <p className="text-sm text-muted-foreground mb-2">{event.nameEn}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {event.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t('event.viewDetails')}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
