import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, CMSArticle, CMSCategory } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Eye, Tag } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import WidgetRenderer from '@/components/WidgetRenderer';

const PublicArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<CMSArticle | null>(null);
  const [category, setCategory] = useState<CMSCategory | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<CMSArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const foundArticle = db.cmsArticles.getBySlug(slug);
      if (foundArticle && foundArticle.status === 'published') {
        setArticle(foundArticle);
        db.cmsArticles.incrementViews(foundArticle.id);

        if (foundArticle.categoryId) {
          const cat = db.cmsCategories.getById(foundArticle.categoryId);
          setCategory(cat || null);
          
          const related = db.cmsArticles
            .getByCategory(foundArticle.categoryId)
            .filter(a => a.id !== foundArticle.id)
            .slice(0, 3);
          setRelatedArticles(related);
        }
      }
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
          <p className="text-gray-600 mb-6">El artículo que buscas no existe o no está publicado.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver todos los artículos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al blog
          </Button>
          
          <div className="flex items-center gap-2 mb-4">
            {category && (
              <Link to={`/categoria/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            )}
            {article.featured && (
              <Badge className="bg-yellow-500">Destacado</Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {article.views} vistas
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-96 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <article
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-gray-600" />
                    {article.tags.map(tag => (
                      <Link key={tag} to={`/tag/${tag}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <WidgetRenderer location="sidebar" />
          </aside>
        </div>
      </main>

      <PublicHeader />
    </div>
  );
};

export default PublicArticle;
