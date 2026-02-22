import React from 'react';
import { Link } from 'react-router-dom';
import { db, CMSMenu, CMSMenuItem } from '@/lib/database';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PublicHeaderProps {
  location?: 'header' | 'footer';
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ location = 'header' }) => {
  const menu = db.cmsMenus.getByLocation(location);
  const settings = db.cmsSettings.get();

  if (!menu) return null;

  const getMenuItemUrl = (item: CMSMenuItem): string => {
    switch (item.type) {
      case 'page':
        const page = db.cmsPages.getById(item.pageId || '');
        return page ? `/pagina/${page.slug}` : '#';
      case 'article':
        const article = db.cmsArticles.getById(item.articleId || '');
        return article ? `/articulo/${article.slug}` : '#';
      case 'category':
        const category = db.cmsCategories.getById(item.categoryId || '');
        return category ? `/categoria/${category.slug}` : '#';
      case 'external':
      case 'custom':
        return item.url || '#';
      default:
        return '#';
    }
  };

  const renderMenuItem = (item: CMSMenuItem, isChild = false) => {
    const url = getMenuItemUrl(item);
    const children = menu.items.filter(i => i.parentId === item.id).sort((a, b) => a.orderIndex - b.orderIndex);
    const hasChildren = children.length > 0;

    const linkElement = item.type === 'external' || item.openInNewTab ? (
      <a
        href={url}
        target={item.openInNewTab ? '_blank' : '_self'}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className={`block px-4 py-2 hover:text-primary transition-colors ${item.cssClass || ''}`}
      >
        {item.label}
      </a>
    ) : (
      <Link
        to={url}
        className={`block px-4 py-2 hover:text-primary transition-colors ${item.cssClass || ''}`}
      >
        {item.label}
      </Link>
    );

    if (hasChildren && !isChild) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 hover:text-primary transition-colors cursor-pointer">
            {item.label}
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {children.map(child => (
              <DropdownMenuItem key={child.id} asChild>
                {child.type === 'external' || child.openInNewTab ? (
                  <a
                    href={getMenuItemUrl(child)}
                    target={child.openInNewTab ? '_blank' : '_self'}
                    rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link to={getMenuItemUrl(child)}>
                    {child.label}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div key={item.id} className="flex items-center">
        {linkElement}
      </div>
    );
  };

  const parentItems = menu.items
    .filter(i => !i.parentId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (location === 'header') {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="h-8" />
              ) : (
                <span className="font-bold text-xl" style={{ color: settings?.primaryColor }}>
                  {settings?.siteName || 'Mi Sitio'}
                </span>
              )}
            </Link>

            <nav className="flex items-center gap-1">
              {parentItems.map(item => renderMenuItem(item))}
            </nav>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Footer
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="font-bold text-xl mb-4">{settings?.siteName}</h3>
            <p className="text-gray-400 mb-4">{settings?.siteDescription}</p>
            
            {/* Social Links */}
            {settings?.socialLinks && (
              <div className="flex gap-4">
                {settings.socialLinks.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    Facebook
                  </a>
                )}
                {settings.socialLinks.twitter && (
                  <a
                    href={settings.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    Twitter
                  </a>
                )}
                {settings.socialLinks.linkedin && (
                  <a
                    href={settings.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <nav className="space-y-2">
              {parentItems.slice(0, 5).map(item => (
                <Link
                  key={item.id}
                  to={getMenuItemUrl(item)}
                  className="block text-gray-400 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              {settings?.contactInfo?.email && (
                <p>Email: {settings.contactInfo.email}</p>
              )}
              {settings?.contactInfo?.phone && (
                <p>Tel: {settings.contactInfo.phone}</p>
              )}
              {settings?.contactInfo?.address && (
                <p>{settings.contactInfo.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} {settings?.siteName}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicHeader;
