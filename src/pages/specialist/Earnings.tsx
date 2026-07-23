import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { PAYMENTS_ENABLED } from '@/lib/features';
import EarningsLive from './EarningsLive';

export default function Earnings() {
  if (PAYMENTS_ENABLED) {
    return <EarningsLive />;
  }

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Mis Ganancias
            </h1>
            <p className="text-muted-foreground">Resumen de tus ingresos en la plataforma</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              El módulo de pagos dentro de la plataforma aún no está activo.
              Cuando lo habilitemos, aquí verás tus ingresos, comisiones y liberaciones de pago.
              Mientras tanto, coordina cobros directamente con tu cliente.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
