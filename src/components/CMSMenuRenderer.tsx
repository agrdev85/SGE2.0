import React from 'react';
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { CMSMenu, CMSMenuItem } from '@/lib/database';
import { ChevronDown } from 'lucide-react';

interface CMSMenuRendererProps {
  menu: CMSMenu | undefined;
  className?: string;
}

const CMSMenuRenderer: React.FC<CMSMenuRendererProps> = ({ menu, className = '' }) => {
  if (!menu || !menu.items || menu.items.length === 0) {
    return null;
  }

  // Filter top-level items (no parentId)
  const topLevelItems = menu.items.filter(item => !item.parentId);

  const getChildItems = (parentId: string) => {
    return menu.items.filter(item => item.parentId === parentId);
  };

  const renderMenuLink = (item: CMSMenuItem) => {
    const href = item.url || '#';
    const target = item.openInNewTab ? '_blank' : '_self';

    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className="block px-2 py-2 text-sm hover:text-primary transition-colors"
      >
        {item.label}
      </a>
    );
  };

  const renderMenuToggle = (item: CMSMenuItem) => {
    return (
      <NavigationMenuTrigger className="flex items-center gap-1">
        {item.label}
        <ChevronDown className="h-4 w-4" />
      </NavigationMenuTrigger>
    );
  };

  return (
    <NavigationMenu className={className}>
      <NavigationMenuList className="flex gap-1">
        {topLevelItems.map((item) => {
          const children = getChildItems(item.id);
          const hasChildren = children.length > 0;

          if (hasChildren) {
            return (
              <NavigationMenuItem key={item.id}>
                {renderMenuToggle(item)}
                <NavigationMenuContent>
                  <div className="grid w-[200px] gap-0 p-2 md:w-[250px]">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="rounded px-2 py-2 hover:bg-accent transition-colors"
                      >
                        {renderMenuLink(child)}
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuLink asChild>
                <a
                  href={item.url || '#'}
                  target={item.openInNewTab ? '_blank' : '_self'}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors inline-block"
                >
                  {item.label}
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default CMSMenuRenderer;
