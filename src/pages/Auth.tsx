import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/types/database';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    (searchParams.get('role') as AppRole) || 'client'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role) {
      const path = role === 'admin' ? '/admin' : role === 'specialist' ? '/specialist' : '/client';
      navigate(path);
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
      } else {
        if (!fullName.trim()) {
          toast({ title: 'Error', description: 'Por favor ingresa tu nombre completo.', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) throw error;
        toast({ title: '¡Cuenta creada!', description: 'Tu cuenta ha sido creada exitosamente.' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
          </Link>
          <CardTitle className="text-2xl font-display">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Ingresa tus credenciales para continuar'
              : 'Regístrate para empezar a usar Servicio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>¿Cómo usarás Servicio?</Label>
                  <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="flex-1 cursor-pointer">
                        <span className="font-medium">Cliente</span>
                        <p className="text-sm text-muted-foreground">Busco especialistas para mis proyectos</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="specialist" id="specialist" />
                      <Label htmlFor="specialist" className="flex-1 cursor-pointer">
                        <span className="font-medium">Especialista</span>
                        <p className="text-sm text-muted-foreground">Ofrezco mis servicios profesionales</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            {isLogin ? (
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button onClick={() => setIsLogin(false)} className="text-primary hover:underline font-medium">
                  Regístrate
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setIsLogin(true)} className="text-primary hover:underline font-medium">
                  Inicia Sesión
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
