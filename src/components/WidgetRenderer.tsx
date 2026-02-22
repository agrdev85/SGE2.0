import React from 'react';
import { Link } from 'react-router-dom';
import { db, CMSWidget, CMSArticle, CMSCategory } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar } from 'lucide-react';

interface WidgetRendererProps {
  location: 'sidebar' | 'footer' | 'header';
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ location }) => {
  const widgets = db.cmsWidgets.getByLocation(location);

  if (widgets.length === 0) return null;

  const renderWidget = (widget: CMSWidget) => {
    switch (widget.type) {
      case 'text':
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{widget.content}</p>
            </CardContent>
          </Card>
        );

      case 'html':
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div dangerouslySetInnerHTML={{ __html: widget.content || '' }} />
            </CardContent>
          </Card>
        );

      case 'recent-articles':
        const recentArticles = db.cmsArticles.getPublished().slice(0, 5);
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name || 'Artículos Recientes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentArticles.map(article => (
                  <Link
                    key={article.id}
                    to={`/articulo/${article.slug}`}
                    className="block group"
                  >
                    <h4 className="font-medium text-sm group-hover:text-blue-600 transition line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'categories':
        const categories = db.cmsCategories.getAll();
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name || 'Categorías'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(category => {
                  const count = db.cmsArticles.getByCategory(category.id).length;
                  return (
                    <Link
                      key={category.id}
                      to={`/categoria/${category.slug}`}
                      className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition"
                    >
                      <span className="text-sm">{category.name}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 'search':
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name || 'Buscar'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('search');
                window.location.href = `/blog?q=${query}`;
              }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    name="search"
                    type="text"
                    placeholder="Buscar artículos..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="w-full mt-2">
                  Buscar
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'custom':
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div dangerouslySetInnerHTML={{ __html: widget.content || '' }} />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {widgets.map(widget => renderWidget(widget))}
    </div>
  );
};

export default WidgetRenderer;
