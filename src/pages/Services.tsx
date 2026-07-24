import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Briefcase, Hammer, Home, Laptop, MapPin, PartyPopper, Scissors, Search, Sparkles, Users, Wrench } from 'lucide-react';

const serviceGroups = [
  {
    title: 'Hogar y reparaciones',
    icon: Home,
    services: ['Plomería', 'Electricidad', 'Aires acondicionados', 'Pintura', 'Carpintería', 'Jardinería'],
  },
  {
    title: 'Tecnología y negocios',
    icon: Laptop,
    services: ['Soporte técnico', 'Páginas web', 'Diseño gráfico', 'Automatizaciones', 'Redes/WiFi', 'Marketing digital'],
  },
  {
    title: 'Belleza y bienestar',
    icon: Scissors,
    services: ['Barbería', 'Uñas', 'Maquillaje', 'Peluquería', 'Masajes', 'Entrenamiento'],
  },
  {
    title: 'Eventos y producción',
    icon: PartyPopper,
    services: ['Fotografía', 'Video', 'Decoración', 'Sonido', 'Catering', 'Animación'],
  },
  {
    title: 'Clases y asesorías',
    icon: Users,
    services: ['Inglés', 'Matemáticas', 'Música', 'Tareas dirigidas', 'Finanzas', 'Asesoría legal'],
  },
  {
    title: 'Oficios y mandados',
    icon: Hammer,
    services: ['Mudanzas', 'Delivery', 'Limpieza', 'Mecánica', 'Instalaciones', 'Ayudante por día'],
  },
];

export default function Services() {
  return (
    <MainLayout>
      <PageMeta
        title="Servicios en Venezuela — Reparaciones, tecnología, belleza y más | ChambaLink"
        description="Explora las categorías de servicios disponibles en ChambaLink: hogar, tecnología, belleza, eventos, clases y negocios. Encuentra el especialista ideal."
        path="/servicios"
      />
      <section className="bg-gradient-hero py-16">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">Directorio de servicios</Badge>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl text-balance">
              Encuentra el servicio correcto antes de publicar tu solicitud
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              ChambaLink organiza servicios por intención: hogar, tecnología, belleza, eventos, clases y oficios. La meta es que el cliente llegue rápido a la categoría correcta y el especialista reciba solicitudes mejor filtradas.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup&role=client">
                  Publicar una solicitud
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth?mode=signup&role=specialist">Ofrecer mis servicios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-wide">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold">Categorías principales</h2>
              <p className="mt-2 text-muted-foreground">Pensadas para SEO, navegación pública y futuras páginas por ciudad/categoría.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <Search className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {serviceGroups.map((group) => (
              <Card key={group.title} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <group.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{group.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.services.map((service) => (
                      <Badge key={service} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/50 py-12">
        <div className="container-wide grid gap-5 md:grid-cols-3">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Local + remoto:</strong> útil para oficios presenciales y trabajos digitales.</p>
          </div>
          <div className="flex gap-3">
            <Wrench className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Solicitudes guiadas:</strong> cada categoría puede tener preguntas propias.</p>
          </div>
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Perfiles vendibles:</strong> los especialistas pueden crear servicios empaquetados después.</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
