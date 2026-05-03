import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Building2, MapPin, Search, Users } from 'lucide-react';

const cities = [
  { name: 'Caracas', focus: 'Hogar, tecnología, belleza y eventos', signal: 'Mayor densidad de demanda' },
  { name: 'Valencia', focus: 'Reparaciones, clases, diseño y servicios para negocios', signal: 'Mercado regional fuerte' },
  { name: 'Maracaibo', focus: 'Oficios, climatización, eventos y soporte técnico', signal: 'Alta necesidad de servicios locales' },
  { name: 'Barquisimeto', focus: 'Belleza, eventos, clases y hogar', signal: 'Buen punto para validar categorías' },
  { name: 'Maracay', focus: 'Reparaciones, mudanzas, tecnología y cuidado personal', signal: 'Demanda local variada' },
  { name: 'Remoto', focus: 'Diseño, web, marketing, tutorías y automatización', signal: 'Escalable fuera de una ciudad' },
];

export default function Cities() {
  return (
    <MainLayout>
      <section className="bg-gradient-hero py-16">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">Cobertura inicial</Badge>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl text-balance">
              Servicios por ciudad para validar demanda local
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Una marketplace de servicios necesita liquidez por zonas. Estas ciudades funcionan como primeras superficies públicas para organizar demanda, especialistas y categorías con intención local.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup&role=client">
                  Publicar solicitud
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/servicios">Ver servicios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-wide">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold">Ciudades y zonas iniciales</h2>
              <p className="mt-2 text-muted-foreground">Base para futuras páginas SEO tipo “plomeros en Caracas” o “diseñadores remotos”.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <Search className="mr-2 h-4 w-4" />
                Inicio
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Card key={city.name} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      {city.name === 'Remoto' ? <Users className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{city.name}</h3>
                      <p className="text-xs text-primary">{city.signal}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{city.focus}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Marketplace local / regional
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
