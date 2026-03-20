import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Search, Briefcase, User, TrendingUp, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const specialistItems = [
    { path: '/specialist', icon: Home, label: 'Inicio', exact: true },
    { path: '/specialist/browse', icon: Search, label: 'Buscar' },
    { path: '/specialist/bids', icon: FileText, label: 'Ofertas' },
    { path: '/specialist/earnings', icon: TrendingUp, label: 'Ganancias' },
    { path: `/specialist/profile/${user.id}`, icon: User, label: 'Perfil' },
  ];

  const clientItems = [
    { path: '/client', icon: Home, label: 'Inicio', exact: true },
    { path: '/client/jobs/new', icon: Plus, label: 'Publicar' },
    { path: '/client/jobs', icon: Briefcase, label: 'Trabajos' },
    { path: `/client/profile/${user.id}`, icon: User, label: 'Perfil' },
  ];

  const items = role === 'specialist' ? specialistItems : clientItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = item.exact 
            ? location.pathname === item.path 
            : isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
