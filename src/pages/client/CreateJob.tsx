import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, MapPin, Clock, Briefcase, DollarSign, FileText, Calendar } from 'lucide-react';

export default function CreateJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location: '',
    budget_min: null as number | null,
    budget_max: null as number | null,
    job_type: 'presencial' as 'presencial' | 'remoto' | 'hibrido',
    urgency: 'flexible' as 'asap' | 'flexible' | 'fecha_especifica',
    urgency_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!formData.category_id) {
      toast.error('Selecciona una categoría');
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        client_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        location: formData.location.trim() || null,
        budget_min: formData.budget_min,
        budget_max: formData.budget_max,
        job_type: formData.job_type,
        urgency: formData.urgency,
        urgency_date: formData.urgency === 'fecha_especifica' && formData.urgency_date ? formData.urgency_date : null,
        status: 'open',
      } as any)
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error('Error creating job:', error);
      toast.error('Error al crear el trabajo');
      return;
    }

    toast.success('Trabajo publicado exitosamente');
    navigate(`/client/jobs/${data.id}`);
  };

  return (
    <MainLayout>
      <div className="container-narrow py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/client')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al panel
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Publicar Nuevo Trabajo
            </CardTitle>
            <CardDescription>
              Describe el trabajo que necesitas y recibe ofertas de especialistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Título del Trabajo *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Reparación de aire acondicionado"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Categoría *
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Tipo de Trabajo
                </Label>
                <RadioGroup
                  value={formData.job_type}
                  onValueChange={(v) => setFormData({ ...formData, job_type: v as any })}
                  className="flex flex-wrap gap-3"
                >
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.job_type === 'presencial' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="presencial" />
                    <span className="text-sm font-medium">Presencial</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.job_type === 'remoto' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="remoto" />
                    <span className="text-sm font-medium">Remoto</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.job_type === 'hibrido' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="hibrido" />
                    <span className="text-sm font-medium">Híbrido</span>
                  </label>
                </RadioGroup>
              </div>

              {/* Location */}
              {formData.job_type !== 'remoto' && (
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Ubicación
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ej: Caracas, Los Palos Grandes"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              )}

              {/* Urgency */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Urgencia
                </Label>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(v) => setFormData({ ...formData, urgency: v as any })}
                  className="flex flex-wrap gap-3"
                >
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.urgency === 'asap' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="asap" />
                    <span className="text-sm font-medium">Lo antes posible</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.urgency === 'flexible' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="flexible" />
                    <span className="text-sm font-medium">Flexible</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.urgency === 'fecha_especifica' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
                    <RadioGroupItem value="fecha_especifica" />
                    <span className="text-sm font-medium">Fecha específica</span>
                  </label>
                </RadioGroup>
                {formData.urgency === 'fecha_especifica' && (
                  <div className="mt-2">
                    <Input
                      type="date"
                      value={formData.urgency_date}
                      onChange={(e) => setFormData({ ...formData, urgency_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder={"¿Qué necesitas?\nEj: Necesito instalar un aire acondicionado split de 12,000 BTU en una habitación del segundo piso.\n\nDetalles adicionales:\n- La habitación ya tiene el tubo de desagüe\n- Tengo el equipo, solo falta la instalación"}
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Mientras más detallada sea la descripción, mejores ofertas recibirás
                </p>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Presupuesto ($)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Mínimo"
                      value={formData.budget_min ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        budget_min: e.target.value ? Number(e.target.value) : null 
                      })}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Máximo"
                      value={formData.budget_max ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        budget_max: e.target.value ? Number(e.target.value) : null 
                      })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional. Ayuda a los especialistas a enviarte ofertas ajustadas a tu presupuesto
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/client')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar Trabajo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
