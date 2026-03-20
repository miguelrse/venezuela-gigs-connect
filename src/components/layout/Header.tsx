import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, User, LogOut, LayoutDashboard, Briefcase, Settings } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'specialist':
        return '/specialist';
      case 'client':
      default:
        return '/client';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Servicio
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                {role === 'client' && (
                  <Link
                    to="/client/jobs"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mis Trabajos
                  </Link>
                )}
                {role === 'specialist' && (
                  <>
                    <Link
                      to="/specialist/browse"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Buscar Trabajos
                    </Link>
                    <Link
                      to="/specialist/bids"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Mis Ofertas
                    </Link>
                    <Link
                      to="/specialist/earnings"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ganancias
                    </Link>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{role}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    {role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Button asChild>
                  <Link to="/auth?mode=signup">Registrarse</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{role}</p>
                      </div>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center gap-2 text-sm font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {role === 'client' && (
                      <Link
                        to="/client/jobs"
                        className="flex items-center gap-2 text-sm font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        Mis Trabajos
                      </Link>
                    )}
                    {role === 'specialist' && (
                      <>
                        <Link
                          to="/specialist/browse"
                          className="flex items-center gap-2 text-sm font-medium py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Briefcase className="h-4 w-4" />
                          Buscar Trabajos
                        </Link>
                        <Link
                          to="/specialist/bids"
                          className="flex items-center gap-2 text-sm font-medium py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Briefcase className="h-4 w-4" />
                          Mis Ofertas
                        </Link>
                      </>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-sm font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm font-medium py-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="text-sm font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                    <Button asChild>
                      <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                        Registrarse
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
