import { useState, useEffect, useRef, useCallback } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Profile, Category } from "@/types/database";
import { Loader2, X, Plus, Camera, Check, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Cropper, { Area } from "react-easy-crop";

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
}).superRefine((values, ctx) => {
  const phone = values.phone?.trim() || "";
  const bio = values.bio?.trim() || "";

  if (phone && !/^\+?[0-9\s().-]{7,20}$/.test(phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Usa un teléfono válido, idealmente WhatsApp con código de país",
    });
  }

  if (bio && bio.length < 40) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bio"],
      message: "Agrega al menos 40 caracteres para generar confianza",
    });
  }
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
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(selectedCategoryIds);
  const [customCategories, setCustomCategories] = useState<string[]>(profile.custom_categories || []);
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropper state
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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

  // Only reset custom categories when dialog opens (not on every profile change)
  useEffect(() => {
    if (open) {
      setCustomCategories(profile.custom_categories || []);
    }
  }, [open]);

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
    const alreadyExists = [...customCategories, ...categories.map((category) => category.name)]
      .some((category) => category.toLowerCase() === trimmed.toLowerCase());

    if (trimmed && trimmed.length < 3) {
      toast.error("La especialidad debe tener al menos 3 caracteres");
      return;
    }

    if (trimmed && alreadyExists) {
      toast.error("Esa especialidad ya está en tu perfil");
      return;
    }

    if (trimmed) {
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

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");

    // Set canvas size to the cropped size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await createCroppedImage(imageToCrop, croppedAreaPixels);
      const fileName = `${profile.user_id}/${Date.now()}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      form.setValue("avatar_url", urlData.publicUrl);
      setImageToCrop(null);
      toast.success("Foto subida correctamente");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Error al subir la foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    const bio = values.bio?.trim() || "";
    const location = values.location?.trim() || "";

    if (role === "specialist") {
      if (selectedCategories.length === 0 && customCategories.length === 0) {
        toast.error("Selecciona o agrega al menos una especialidad para aparecer mejor ante clientes");
        return;
      }

      if (!location) {
        form.setError("location", { message: "Agrega ciudad/zona para que los clientes sepan dónde trabajas" });
        return;
      }

      if (!bio || bio.length < 80) {
        form.setError("bio", { message: "Para especialistas, escribe al menos 80 caracteres sobre experiencia, servicios y forma de trabajo" });
        return;
      }
    }

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
  const watchedBio = form.watch("bio") || "";
  const watchedPhone = form.watch("phone") || "";
  const watchedLocation = form.watch("location") || "";
  const completionItems = [
    Boolean(watchedAvatarUrl),
    Boolean(watchedPhone.trim()),
    Boolean(watchedLocation.trim()),
    watchedBio.trim().length >= (role === "specialist" ? 80 : 40),
    role !== "specialist" || selectedCategories.length + customCategories.length > 0,
  ];
  const completionScore = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Perfil {completionScore}% completo
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role === "specialist"
                      ? "Los clientes confían más en perfiles con foto, ciudad, WhatsApp, bio clara y especialidades concretas."
                      : "Un perfil claro ayuda a que especialistas respondan con mejores propuestas."}
                  </p>
                </div>
                <Badge variant={completionScore >= 80 ? "default" : "secondary"}>
                  {completionScore >= 80 ? "Fuerte" : "Mejorable"}
                </Badge>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-3">
              <FormLabel>Foto de perfil</FormLabel>
              
              {/* Image Cropper */}
              {imageToCrop ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Arrastra para centrar tu foto en el círculo
                  </p>
                  <div className="relative h-72 w-full rounded-lg overflow-hidden bg-black/90">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{
                        containerStyle: {
                          backgroundColor: "rgba(0, 0, 0, 0.9)",
                        },
                        cropAreaStyle: {
                          border: "3px solid hsl(var(--primary))",
                          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
                        },
                      }}
                    />
                  </div>
                  
                  {/* Zoom slider */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Zoom</label>
                    <Slider
                      value={[zoom]}
                      min={1}
                      max={3}
                      step={0.1}
                      onValueChange={(value) => setZoom(value[0])}
                    />
                  </div>
                  
                  {/* Cropper actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCropCancel}
                      disabled={isUploading}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCropConfirm}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Confirmar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={watchedAvatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Subir foto
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG. Máx 5MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Optional URL input */}
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">O ingresa una URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://ejemplo.com/avatar.jpg"
                            {...field}
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
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
                      placeholder={role === "specialist" ? "Ej: Tengo 5 años reparando aires acondicionados en Caracas. Trabajo con diagnóstico, mantenimiento, instalación y garantía básica..." : "Cuéntanos brevemente sobre ti..."}
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{role === "specialist" ? "Incluye experiencia, zonas, servicios y tiempos de respuesta." : "Opcional, pero ayuda a generar confianza."}</span>
                    <span>{watchedBio.length}/500</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialist Categories */}
            {role === "specialist" && categories.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Especialidades</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Elige hasta las áreas donde realmente puedes responder rápido y entregar bien.
                </p>
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
                  Agrega especialidades específicas que no estén en la lista. Evita duplicados y nombres demasiado genéricos.
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
                <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                  <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Tip de ventas
                  </div>
                  “Reparación de aires split” convierte mejor que “Técnico”, porque el cliente entiende exactamente qué puedes resolver.
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
              <Button type="submit" disabled={isSubmitting || isUploading}>
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
