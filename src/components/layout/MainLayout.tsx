import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <footer className="border-t py-6 mt-auto hidden md:block">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-sm font-bold text-primary-foreground">C</span>
              </div>
              <span className="font-display font-semibold text-foreground">ChambaLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ChambaLink. Marketplace de servicios, gigs y talento en Venezuela.
            </p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
