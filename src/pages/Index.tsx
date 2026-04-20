import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, Event, MacroEvent, CMSArticle, CMSSettings } from '@/lib/database';
import PublicHeader from '@/components/PublicHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  FileText, 
  Calendar,
  Award,
  Globe,
  Zap,
  Newspaper
} from 'lucide-react';

export default function Index() {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [settings, setSettings] = useState<CMSSettings | null>(null);

  useEffect(() => {
    db.init();
    const activeEvents = db.macroEvents.getAll().filter(e => e.isActive);
    setEvents(activeEvents);
    const featuredArticles = db.cmsArticles.getFeatured();
    setArticles(featuredArticles);
    setSettings(db.cmsSettings.get() || null);
  }, []);

  const stats = [
    { value: '500+', label: language === 'es' ? 'Participantes' : 'Participants' },
    { value: '150+', label: language === 'es' ? 'Trabajos Presentados' : 'Submitted Works' },
    { value: '25+', label: language === 'es' ? 'Instituciones' : 'Institutions' },
    { value: '10+', label: language === 'es' ? 'Países' : 'Countries' },
  ];

  const features = [
    {
      icon: FileText,
      title: t('home.features.abstracts'),
      description: t('home.features.abstracts.desc'),
    },
    {
      icon: Users,
      title: t('home.features.peerReview'),
      description: t('home.features.peerReview.desc'),
    },
    {
      icon: Calendar,
      title: t('home.features.multiple'),
      description: t('home.features.multiple.desc'),
    },
    {
      icon: Award,
      title: t('home.features.certificates'),
      description: t('home.features.certificates.desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ 
          backgroundImage: `url('/images/taller-pre-evento-sigestic25-leaves-background.png')`,
          opacity: 0.15
        }}
      />
      
      <div className="relative z-10">
        <PublicHeader location="header" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              {t('home.title')}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              {language === 'es' ? 'Gestiona tus ' : 'Manage your '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
                {language === 'es' ? 'eventos' : 'events'}
              </span>
              {language === 'es' ? ' de forma eficiente' : ' efficiently'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Desde el envío de resúmenes hasta la emisión de certificados. Una plataforma integral para congresos, conferencias y simposios.'
                : 'From abstract submission to certificate issuance. A comprehensive platform for congresses, conferences, and symposia.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/login">
                  {t('home.cta.start')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">
                  {t('home.cta.login')}
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
              {t('home.features.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Una plataforma completa para la gestión integral de eventos'
                : 'A complete platform for comprehensive event management'}
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
              {t('home.events.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.events.subtitle')}
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t('home.events.noEvents')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventUrl = (event as any).urlEvento || event.acronym?.toLowerCase() || event.id;
                return (
                  <Link key={event.id} to={`/evento/${eventUrl}`} className="group">
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="relative h-48">
                        <img
                          src={event.bannerImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${event.primaryColor}dd, transparent)` }} />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-foreground">
                            {event.isActive ? t('home.events.open') : t('home.events.coming')}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="text-lg font-bold line-clamp-2">{event.name}</h3>
                          <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.startDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })} - {new Date(event.endDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {db.abstracts.getByEvent(event.id).length} {language === 'es' ? 'trabajos' : 'works'}
                          </span>
                          <Button size="sm" style={{ backgroundColor: event.primaryColor }} className="text-white">
                            {t('home.events.viewEvent')} <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('home.howItWorks')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Un proceso simple y transparente para participar en eventos'
                : 'A simple and transparent process to participate in events'}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: t('home.step1.title'), desc: t('home.step1.desc') },
                { step: '02', title: t('home.step2.title'), desc: t('home.step2.desc') },
                { step: '03', title: t('home.step3.title'), desc: t('home.step3.desc') },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-display font-bold text-primary/10 mb-4">{item.step}</div>
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
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('home.cta.ready')}</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {language === 'es'
              ? 'Únete a cientos de profesionales que ya utilizan SigEvent para gestionar sus eventos'
              : 'Join hundreds of professionals who already use SigEvent to manage their events'}
          </p>
          <Button size="xl" variant="secondary" asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/login">{t('home.cta.join')} <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Featured Articles */}
      {articles.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4"><Newspaper className="w-4 h-4 mr-2" />{t('home.news.title')}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.news.title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {language === 'es'
                  ? 'Mantente informado con nuestras últimas noticias y actualizaciones'
                  : 'Stay informed with our latest news and updates'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {articles.slice(0, 3).map(article => (
                <Link key={article.id} to={`/articulo/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition cursor-pointer">
                    {article.featuredImage && (
                      <img src={article.featuredImage} alt={article.title} className="w-full h-48 object-cover rounded-t-lg" />
                    )}
                    <CardContent className="pt-6">
                      <Badge variant="secondary" className="mb-3">Destacado</Badge>
                      <h3 className="font-bold text-xl mb-2 line-clamp-2">{article.title}</h3>
                      {article.excerpt && <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{article.excerpt}</p>}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>
                        <span>{article.views} vistas</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/blog">{t('home.news.viewAll')} <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <PublicHeader location="footer" />
      </div>
    </div>
  );
}
