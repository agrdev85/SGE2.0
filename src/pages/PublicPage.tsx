import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, CMSPage } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (slug) {
      const foundPage = db.cmsPages.getBySlug(slug);
      if (foundPage && foundPage.status === 'published') {
        setPage(foundPage);
      }
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Página no encontrada</h1>
          <p className="text-muted-foreground mb-6">La página que buscas no existe o no está publicada.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const getTemplateClass = () => {
    switch (page.template) {
      case 'full-width':
        return 'max-w-full px-8';
      case 'sidebar':
        return 'max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8';
      case 'landing':
        return 'max-w-full';
      default:
        return 'max-w-4xl mx-auto px-4';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
          {page.excerpt && (
            <p className="text-xl text-blue-100 max-w-3xl">{page.excerpt}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="py-12">
        <div className={getTemplateClass()}>
          {page.template === 'sidebar' ? (
            <>
              <div className="lg:col-span-2">
                <article
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </div>
              <aside className="space-y-6">
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4 text-foreground">Información</h3>
                  <p className="text-sm text-muted-foreground">
                    Publicado el {new Date(page.publishedAt || page.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </aside>
            </>
          ) : (
            <article
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Sistema de Gestión de Eventos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPage;
