import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Profile, Category } from "@/types/database";
import { Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile & { custom_categories?: string[] };
  role: "client" | "specialist";
  selectedCategoryIds?: string[];
  onSuccess: () => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  profile,
  role,
  selectedCategoryIds = [],
  onSuccess,
}: ProfileEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(selectedCategoryIds);
  const [customCategories, setCustomCategories] = useState<string[]>(profile.custom_categories || []);
  const [newCustomCategory, setNewCustomCategory] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone || "",
      location: profile.location || "",
      bio: profile.bio || "",
      avatar_url: profile.avatar_url || "",
    },
  });

  useEffect(() => {
    if (role === "specialist") {
      fetchCategories();
    }
  }, [role]);

  useEffect(() => {
    setSelectedCategories(selectedCategoryIds);
  }, [selectedCategoryIds]);

  useEffect(() => {
    setCustomCategories(profile.custom_categories || []);
  }, [profile.custom_categories]);

  useEffect(() => {
    form.reset({
      full_name: profile.full_name,
      phone: profile.phone || "",
      location: profile.location || "",
      bio: profile.bio || "",
      avatar_url: profile.avatar_url || "",
    });
  }, [profile, form]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("name");
    if (data) setCategories(data);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addCustomCategory = () => {
    const trimmed = newCustomCategory.trim();
    if (trimmed && !customCategories.includes(trimmed)) {
      setCustomCategories([...customCategories, trimmed]);
      setNewCustomCategory("");
    }
  };

  const removeCustomCategory = (category: string) => {
    setCustomCategories(customCategories.filter((c) => c !== category));
  };

  const handleCustomCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomCategory();
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // Update profile (including custom_categories for specialists)
      const updateData: Record<string, unknown> = {
        full_name: values.full_name,
        phone: values.phone || null,
        location: values.location || null,
        bio: values.bio || null,
        avatar_url: values.avatar_url || null,
      };

      if (role === "specialist") {
        updateData.custom_categories = customCategories;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", profile.user_id);

      if (profileError) throw profileError;

      if (profileError) throw profileError;

      // Update specialist categories if specialist
      if (role === "specialist") {
        // Delete existing categories
        await supabase
          .from("specialist_categories")
          .delete()
          .eq("user_id", profile.user_id);

        // Insert new categories
        if (selectedCategories.length > 0) {
          const { error: catError } = await supabase
            .from("specialist_categories")
            .insert(
              selectedCategories.map((categoryId) => ({
                user_id: profile.user_id,
                category_id: categoryId,
              }))
            );
          if (catError) throw catError;
        }
      }

      toast.success("Perfil actualizado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const watchedAvatarUrl = form.watch("avatar_url");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={watchedAvatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de avatar</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://ejemplo.com/avatar.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+58 412 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad, Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos sobre ti..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialist Categories */}
            {role === "specialist" && categories.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Especialidades</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded-md border border-input hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Categories for Specialists */}
            {role === "specialist" && (
              <div className="space-y-3">
                <FormLabel>Otras especialidades</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Agrega especialidades que no estén en la lista
                </p>
                
                {/* Custom categories tags */}
                {customCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => removeCustomCategory(cat)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add custom category input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Reparación de aires"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    onKeyDown={handleCustomCategoryKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomCategory}
                    disabled={!newCustomCategory.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
