import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, CMSCategory, CMSArticle } from '@/lib/database';
import PublicHeader from '@/components/PublicHeader';
import WidgetRenderer from '@/components/WidgetRenderer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Tag } from 'lucide-react';

const PublicCategory: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<CMSCategory | null>(null);
  const [articles, setArticles] = useState<CMSArticle[]>([]);
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
      const cat = db.cmsCategories.getBySlug(slug);
      setCategory(cat);
      if (cat) {
        const categoryArticles = db.cmsArticles.getByCategory(cat.id);
        setArticles(categoryArticles.filter(a => a.status === 'published'));
      }
    }
  }, [slug]);

  if (!category) {
    return (
      <>
        <PublicHeader />
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-foreground">Categoría no encontrada</h1>
          <p className="text-center mt-4 text-muted-foreground">
            La categoría que buscas no existe.
          </p>
          <div className="text-center mt-8">
            <Link
              to="/blog"
              className="text-primary hover:underline"
            >
              ← Volver al blog
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          {' > '}
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
          {' > '}
          <span className="text-foreground">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
          <div className="mt-4">
            <Badge variant="secondary">
              {articles.length} artículo{articles.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles List */}
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No hay artículos en esta categoría aún.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {articles.map(article => (
                  <Card key={article.id} className="overflow-hidden hover:shadow-lg transition">
                    <Link to={`/articulo/${article.slug}`}>
                      {article.featuredImage && (
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <CardHeader>
                        <h2 className="text-2xl font-bold hover:text-primary transition text-foreground">
                          {article.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                          </div>
                          {article.views > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.views}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground line-clamp-3">{article.excerpt}</p>
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {article.tags.map(tag => (
                              <Badge key={tag} variant="outline">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with Widgets */}
          <div className="lg:col-span-1">
            <WidgetRenderer location="sidebar" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicCategory;
