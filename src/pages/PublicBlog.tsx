import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, CMSArticle, CMSCategory } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar, Eye, Star, Tag } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import WidgetRenderer from '@/components/WidgetRenderer';

const PublicBlog: React.FC = () => {
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [categories, setCategories] = useState<CMSCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<CMSArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    const published = db.cmsArticles.getPublished();
    setArticles(published);
    setCategories(db.cmsCategories.getAll());
    setFeaturedArticles(db.cmsArticles.getFeatured());
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Sin categoría';
    return categories.find(c => c.id === categoryId)?.name || 'Sin categoría';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Blog y Noticias</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl">
            Mantente informado con las últimas noticias, artículos y actualizaciones
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && !searchTerm && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Artículos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map(article => (
              <Link key={article.id} to={`/articulo/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition cursor-pointer">
                  {article.featuredImage && (
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {getCategoryName(article.categoryId)}
                      </Badge>
                      <Badge className="bg-yellow-500">Destacado</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Articles Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory 
                  ? `Categoría: ${getCategoryName(selectedCategory)}`
                  : 'Todos los Artículos'
                }
              </h2>
              <p className="text-gray-600">{filteredArticles.length} artículos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map(article => (
                <Link key={article.id} to={`/articulo/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition cursor-pointer">
                    {article.featuredImage && (
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">
                        {getCategoryName(article.categoryId)}
                      </Badge>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views}
                        </div>
                      </div>
                      {article.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-3">
                          {article.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No se encontraron artículos</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <WidgetRenderer location="sidebar" />
          </aside>
        </div>
      </section>

      <PublicHeader />
    </div>
  );
};

export default PublicBlog;
