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
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { JobFormData } from '@/types/database';

export default function CreateJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    category_id: '',
    location: '',
    budget_min: null,
    budget_max: null,
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
        status: 'open',
      })
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
            <CardTitle>Publicar Nuevo Trabajo</CardTitle>
            <CardDescription>
              Describe el trabajo que necesitas y recibe ofertas de especialistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Trabajo *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Reparación de aire acondicionado"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ej: Caracas, Los Palos Grandes"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el trabajo con más detalle..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Presupuesto Mínimo ($)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.budget_min ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      budget_min: e.target.value ? Number(e.target.value) : null 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Presupuesto Máximo ($)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.budget_max ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      budget_max: e.target.value ? Number(e.target.value) : null 
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
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
