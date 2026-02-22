import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Users,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  Beaker,
  CalendarDays,
  CalendarCheck,
  Layout as LayoutIcon,
  Newspaper,
  Menu,
  Shield,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['USER', 'REVIEWER', 'COMMITTEE', 'ADMIN'] },
  { label: 'Mis Resúmenes', icon: FileText, href: '/abstracts', roles: ['USER'] },
  { label: 'Revisar', icon: ClipboardCheck, href: '/review', roles: ['REVIEWER'] },
  { label: 'Comité', icon: Users, href: '/committee', roles: ['COMMITTEE', 'ADMIN'] },
  { label: 'Programa', icon: CalendarDays, href: '/program', roles: ['COMMITTEE', 'ADMIN'] },
  { label: 'Mi Programa', icon: CalendarCheck, href: '/my-program', roles: ['USER', 'REVIEWER'] },
  { label: 'Gestión Eventos', icon: Calendar, href: '/events', roles: ['ADMIN'] },
  { label: 'Usuarios', icon: Users, href: '/users', roles: ['ADMIN'] },
  // CMS Menu Items
  { label: 'Páginas CMS', icon: LayoutIcon, href: '/cms/pages', roles: ['ADMIN'] },
  { label: 'Artículos', icon: Newspaper, href: '/cms/articles', roles: ['ADMIN'] },
  { label: 'Menús', icon: Menu, href: '/cms/menus', roles: ['ADMIN'] },
  { label: 'Widgets', icon: Package, href: '/cms/widgets', roles: ['ADMIN'] },
  { label: 'SuperAdmin', icon: Shield, href: '/superadmin', roles: ['ADMIN'] },
  { label: 'Configuración', icon: Settings, href: '/settings', roles: ['USER', 'REVIEWER', 'COMMITTEE', 'ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const roleLabels: Record<string, string> = {
    USER: 'Participante',
    REVIEWER: 'Revisor',
    COMMITTEE: 'Comité',
    ADMIN: 'Administrador',
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow-sm">
              <Beaker className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-foreground">SciEvent</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-muted-foreground hover:text-destructive", collapsed && "justify-center")}
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Cerrar Sesión</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
