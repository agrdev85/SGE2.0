import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, Event, CMSArticle, CMSSettings } from '@/lib/database';
import PublicHeader from '@/components/PublicHeader';
import { 
  Beaker, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  FileText, 
  Calendar,
  Award,
  Globe,
  Zap,
  MapPin,
  Newspaper
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Gestión de Resúmenes',
    description: 'Envía y gestiona tus trabajos científicos con seguimiento en tiempo real del proceso de revisión.',
  },
  {
    icon: Users,
    title: 'Revisión por Pares',
    description: 'Sistema de evaluación transparente con árbitros especializados en cada área temática.',
  },
  {
    icon: Calendar,
    title: 'Múltiples Eventos',
    description: 'Participa en diferentes congresos y conferencias desde una única plataforma.',
  },
  {
    icon: Award,
    title: 'Certificados Digitales',
    description: 'Recibe certificados de participación y presentación verificables digitalmente.',
  },
];

const stats = [
  { value: '500+', label: 'Investigadores' },
  { value: '150+', label: 'Trabajos Presentados' },
  { value: '25+', label: 'Instituciones' },
  { value: '10+', label: 'Países' },
];

export default function Index() {
  const [events, setEvents] = useState<Event[]>([]);
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [settings, setSettings] = useState<CMSSettings | null>(null);

  useEffect(() => {
    db.init();
    const activeEvents = db.events.getAll().filter(e => e.isActive);
    setEvents(activeEvents);
    
    // Load CMS content
    const featuredArticles = db.cmsArticles.getFeatured();
    setArticles(featuredArticles);
    setSettings(db.cmsSettings.get() || null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* CMS Header */}
      <PublicHeader location="header" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              Plataforma de Eventos Científicos
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Gestiona tus{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
                eventos científicos
              </span>{' '}
              de forma eficiente
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Desde el envío de resúmenes hasta la emisión de certificados. Una plataforma integral
              para congresos, conferencias y simposios científicos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/login">
                  Comenzar Ahora
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa para la gestión integral de eventos científicos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Active Events Section */}
      <section id="events" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Eventos Activos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre los próximos eventos científicos y únete a la comunidad de investigadores
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No hay eventos activos en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} to={`/event/${event.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-48">
                      <img
                        src={event.bannerImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to top, ${event.primaryColor}dd, transparent)`,
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-foreground">
                          {event.isActive ? 'Inscripciones Abiertas' : 'Próximamente'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-lg font-bold line-clamp-2">{event.name}</h3>
                        <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.startDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })} - {new Date(event.endDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {db.abstracts.getByEvent(event.id).length} trabajos
                        </span>
                        <Button
                          size="sm"
                          style={{ backgroundColor: event.primaryColor }}
                          className="text-white"
                        >
                          Ver Evento
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un proceso simple y transparente para participar en eventos científicos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Regístrate', desc: 'Crea tu cuenta con tus datos profesionales' },
                { step: '02', title: 'Envía tu trabajo', desc: 'Sube tu resumen con título, autores y palabras clave' },
                { step: '03', title: 'Recibe feedback', desc: 'Los revisores evalúan y el comité clasifica tu trabajo' },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                      <ArrowRight className="h-6 w-6 text-primary/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Zap className="h-12 w-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            ¿Listo para participar?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a cientos de investigadores que ya utilizan SciEvent para gestionar sus eventos científicos
          </p>
          <Button size="xl" variant="secondary" asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/login">
              Iniciar Sesión
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Articles Section */}
      {articles.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Newspaper className="w-4 h-4 mr-2" />
                Noticias y Artículos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Últimas Publicaciones
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Mantente informado con nuestras últimas noticias, artículos y actualizaciones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {articles.slice(0, 3).map(article => (
                <Link key={article.id} to={`/articulo/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition cursor-pointer">
                    {article.featuredImage && (
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="pt-6">
                      <Badge variant="secondary" className="mb-3">Destacado</Badge>
                      <h3 className="font-bold text-xl mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          {article.views} vistas
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/blog">
                  Ver Todos los Artículos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <PublicHeader location="footer" />
    </div>
  );
}
