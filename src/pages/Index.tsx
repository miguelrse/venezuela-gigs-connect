import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Hammer,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react';

const categories = [
  { name: 'Reparaciones', icon: Wrench, demand: 'Alta demanda', examples: 'Plomería, electricidad, aires' },
  { name: 'Hogar y limpieza', icon: Hammer, demand: 'Servicios rápidos', examples: 'Limpieza, pintura, jardinería' },
  { name: 'Tecnología', icon: Zap, demand: 'Remoto o presencial', examples: 'Soporte PC, redes, páginas web' },
  { name: 'Belleza y bienestar', icon: Sparkles, demand: 'Por cita', examples: 'Uñas, barbería, maquillaje' },
  { name: 'Clases y tutorías', icon: Users, demand: 'Online o local', examples: 'Idiomas, matemáticas, música' },
  { name: 'Eventos', icon: Briefcase, demand: 'Por proyecto', examples: 'Fotografía, sonido, decoración' },
];

const featuredSpecialists = [
  { name: 'Carlos R.', role: 'Técnico en refrigeración', city: 'Caracas', rating: '4.9', jobs: '86 trabajos', price: 'Desde $25', verified: true },
  { name: 'María F.', role: 'Diseñadora gráfica', city: 'Valencia', rating: '5.0', jobs: '42 proyectos', price: 'Desde $15', verified: true },
  { name: 'Luis M.', role: 'Electricista residencial', city: 'Maracaibo', rating: '4.8', jobs: '63 trabajos', price: 'Cotiza rápido', verified: true },
];

const liveRequests = [
  { title: 'Instalar aire split 12.000 BTU', city: 'Caracas', budget: '$35 - $60', urgency: 'Urgente', bids: '5 ofertas' },
  { title: 'Landing page para negocio de comida', city: 'Remoto', budget: '$80 - $180', urgency: 'Flexible', bids: '9 ofertas' },
  { title: 'Maquillaje para evento el sábado', city: 'Barquisimeto', budget: '$25 - $45', urgency: 'Fecha fija', bids: '3 ofertas' },
];

const trustSignals = [
  'Perfiles con foto, ciudad, bio y servicios claros',
  'Reviews visibles después de trabajos completados',
  'Historial de propuestas, contratos y entregas',
  'WhatsApp como canal rápido de coordinación',
  'Filtros por categoría, ubicación, presupuesto y urgencia',
];

const roadmapTools = [
  { title: 'Publicación guiada', description: 'El cliente describe necesidad, presupuesto, ubicación, tipo de trabajo y urgencia.' },
  { title: 'Propuestas competitivas', description: 'Especialistas envían precio, mensaje y tiempo estimado para comparar calidad/precio.' },
  { title: 'Perfiles vendibles', description: 'Portafolio, rating, servicios, ciudad, categorías y prueba social para generar confianza.' },
  { title: 'Paneles por rol', description: 'Cliente gestiona trabajos; especialista gestiona ofertas, contratos y ganancias.' },
];

export default function Index() {
  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-gradient-hero py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="container-wide relative">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="animate-fade-in">
              <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/10">
                Marketplace venezolano de servicios y chambas
              </Badge>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground md:text-6xl text-balance">
                Encuentra gente confiable para resolver trabajos reales en Venezuela
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Publica lo que necesitas, compara especialistas por experiencia, precio y reputación, y coordina rápido. También puedes crear tu perfil y empezar a recibir clientes.
              </p>

              <div className="mt-8 rounded-2xl border bg-card p-3 shadow-lg">
                <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-12 pl-10" placeholder="¿Qué necesitas? Ej: electricista, diseñador, profesora..." />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-12 pl-10" placeholder="Ciudad o remoto" />
                  </div>
                  <Button size="lg" asChild className="h-12 uppercase">
                    <Link to="/auth?mode=signup&role=client">
                      Publicar solicitud
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Ofrecer mis servicios</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link to="#como-funciona">Ver cómo funciona</Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl">
                {[
                  ['+40', 'categorías listas'],
                  ['4 pasos', 'para contratar'],
                  ['0$', 'para empezar'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border bg-background/70 p-4">
                    <p className="font-display text-2xl font-bold text-primary">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-slide-up">
              <div className="rounded-3xl border bg-card p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Solicitudes activas</p>
                    <p className="text-xs text-muted-foreground">Ejemplos del tipo de mercado</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Clock3 className="h-3 w-3" /> En vivo
                  </Badge>
                </div>
                <div className="space-y-3">
                  {liveRequests.map((request) => (
                    <div key={request.title} className="rounded-2xl border bg-gradient-card p-4 transition hover:border-primary/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold leading-tight">{request.title}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {request.city}
                          </p>
                        </div>
                        <Badge variant={request.urgency === 'Urgente' ? 'destructive' : 'outline'}>{request.urgency}</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="h-4 w-4 text-primary" />{request.budget}</span>
                        <span className="text-muted-foreground">{request.bids}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-primary p-4 text-primary-foreground">
                  <p className="text-sm font-semibold">Motor de confianza</p>
                  <p className="mt-1 text-sm text-primary-foreground/80">La app prioriza perfiles completos, reviews, tiempos de respuesta y propuestas claras antes que solo precio bajo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-wide">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="outline" className="mb-3">Categorías populares</Badge>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Servicios que la gente busca todos los días</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">Inspirado en marketplaces como Fiverr, Thumbtack y TaskRabbit: categorías claras, intención rápida y perfiles comparables.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/auth?mode=signup&role=client">Pedir un servicio</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.name} className="card-interactive group p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <p className="mt-1 text-sm text-primary">{category.demand}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{category.examples}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-secondary/60 py-16">
        <div className="container-wide">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-3 bg-background">Cómo funciona</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Dos caminos: contratar o conseguir clientes</h2>
            <p className="mt-3 text-muted-foreground">El flujo está diseñado para que el cliente no se pierda y el especialista pueda venderse bien.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              ['1', 'Describe el trabajo', 'Categoría, ciudad, presupuesto, urgencia y detalles útiles.'],
              ['2', 'Recibe propuestas', 'Compara precio, tiempo estimado, mensaje, perfil y reputación.'],
              ['3', 'Elige especialista', 'Acepta la mejor oferta y pasa el trabajo a contrato.'],
              ['4', 'Cierra con review', 'Marca completado, califica y alimenta la confianza del marketplace.'],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{step}</div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-wide grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="outline" className="mb-3">Especialistas destacados</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Perfiles pensados para vender confianza</h2>
            <p className="mt-4 text-muted-foreground">La página debe empujar a que cada proveedor tenga una mini vitrina: qué hace, dónde trabaja, desde cuánto cobra, reviews y pruebas de trabajos anteriores.</p>
            <div className="mt-6 space-y-3">
              {trustSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">{signal}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredSpecialists.map((specialist) => (
              <div key={specialist.name} className="card-elevated p-5">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-lg font-bold text-primary-foreground">
                  {specialist.name.split(' ').map((part) => part[0]).join('')}
                </div>
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold">{specialist.name}</h3>
                  {specialist.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{specialist.role}</p>
                <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{specialist.city}</p>
                <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-warning text-warning" />{specialist.rating}</span>
                  <span className="text-muted-foreground">{specialist.jobs}</span>
                </div>
                <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold">{specialist.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground py-16 text-background">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-background/10 text-background hover:bg-background/10">Herramientas del marketplace</Badge>
              <h2 className="font-display text-3xl font-bold md:text-4xl">No es solo una landing: ya hay estructura de producto</h2>
              <p className="mt-4 text-background/70">El proyecto tiene rutas para clientes, especialistas, perfiles, trabajos, ofertas, contratos, ganancias y reviews. La dirección ahora es convertirlo en un marketplace más creíble y accionable.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth?mode=signup&role=client">Crear solicitud</Link>
                </Button>
                <Button size="lg" className="bg-background/10 text-background hover:bg-background/20" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Crear perfil profesional</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {roadmapTools.map((tool) => (
                <div key={tool.title} className="rounded-2xl border border-background/10 bg-background/5 p-5">
                  <ShieldCheck className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-background">{tool.title}</h3>
                  <p className="mt-2 text-sm text-background/70">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-glow md:p-12">
          <WalletCards className="mx-auto mb-4 h-10 w-10" />
          <h2 className="font-display text-3xl font-bold md:text-4xl">Empieza gratis, valida demanda y luego monetiza</h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">La estrategia inteligente: primero liquidez y confianza. Más adelante se pueden probar planes destacados, verificación premium o comisión por contrato, pero sin gastar ni activar pagos ahora.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth?mode=signup">Crear cuenta gratis</Link>
            </Button>
            <Button size="lg" className="bg-primary-foreground/10 hover:bg-primary-foreground/20" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t py-10">
        <div className="container-wide grid gap-6 text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <p><strong className="text-foreground">WhatsApp-first:</strong> ideal para Venezuela; reduce fricción mientras el producto madura.</p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p><strong className="text-foreground">Confianza visible:</strong> ratings, perfiles completos y verificación ligera antes de pagos complejos.</p>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-primary" />
            <p><strong className="text-foreground">Oferta híbrida:</strong> gigs empaquetados + solicitudes abiertas para cubrir más casos.</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
