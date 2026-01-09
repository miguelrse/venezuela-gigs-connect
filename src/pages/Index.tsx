import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowRight, Shield, Clock, Users, CheckCircle } from 'lucide-react';

export default function Index() {
  const features = [
    { icon: Shield, title: 'Pagos Seguros', description: 'Tu dinero protegido hasta confirmar el trabajo' },
    { icon: Users, title: 'Especialistas Verificados', description: 'Profesionales de confianza en tu zona' },
    { icon: Clock, title: 'Respuesta Rápida', description: 'Recibe ofertas en minutos' },
    { icon: CheckCircle, title: 'Garantía de Calidad', description: 'Trabajos completados a tu satisfacción' },
  ];

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-hero py-20 lg:py-32">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Conecta con los mejores{' '}
              <span className="text-primary">especialistas</span> de Venezuela
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Publica tu trabajo, recibe ofertas de profesionales y paga con seguridad. 
              La forma más fácil de encontrar ayuda confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/auth?mode=signup&role=client">
                  Publicar un Trabajo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/auth?mode=signup&role=specialist">
                  Soy Especialista
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container-wide">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            ¿Por qué Servicio?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card-elevated p-6 text-center animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container-wide text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Únete a miles de venezolanos que ya confían en Servicio para sus necesidades del hogar.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth?mode=signup">Crear Cuenta Gratis</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
