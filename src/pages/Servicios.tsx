import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Sparkles, Clock, DollarSign, Package, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const serviceTypeSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  estimated_minutes: z.string().min(1, "El tiempo estimado es requerido"),
});

type ServiceTypeFormData = z.infer<typeof serviceTypeSchema>;
type ServiceType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_minutes: number | null;
  is_active: boolean;
  created_at: string;
};

export default function Servicios() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [deleteService, setDeleteService] = useState<ServiceType | null>(null);
  const [configService, setConfigService] = useState<ServiceType | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [serviceRecipes, setServiceRecipes] = useState<any[]>([]);

  // Estados para el selector del modal de recetas
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("");

  const { toast } = useToast();
  const { role } = useAuth();

  const form = useForm<ServiceTypeFormData>({
    resolver: zodResolver(serviceTypeSchema),
    defaultValues: { name: "", description: "", price: "", estimated_minutes: "30" },
  });

  const fetchServiceTypes = async () => {
    setIsLoading(true);

    // Consultamos los tipos de servicio
    const servicesRes = await supabase
      .from("service_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (servicesRes.error) {
      toast({ title: "Error al cargar servicios", description: servicesRes.error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Consultamos todos los insumos vinculados por separado para evitar el error de relación (Join Error)
    const inventoryRes = await supabase
      .from("service_inventory")
      .select("*, inventory(name, unit)");

    // Unimos los datos manualmente en el frontend
    const servicesWithInventory = servicesRes.data.map(service => ({
      ...service,
      service_inventory: (inventoryRes.data || []).filter(item => item.service_type_id === service.id)
    }));

    setServiceTypes(servicesWithInventory as any);
    setFilteredServices(servicesWithInventory as any);
    setIsLoading(false);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("inventory").select("*").order("name");
    setInventoryItems(data || []);
  };

  const fetchRecipes = async (serviceId: string) => {
    // 1. Obtener las relaciones service_inventory
    const { data: recipes, error: recipesError } = await supabase
      .from("service_inventory")
      .select("*")
      .eq("service_type_id", serviceId);

    if (recipesError || !recipes) {
      setServiceRecipes([]);
      return;
    }

    // 2. Obtener los detalles del inventario para los items encontrados
    const inventoryIds = recipes.map(r => r.inventory_id);
    if (inventoryIds.length === 0) {
      setServiceRecipes([]);
      return;
    }

    const { data: inventoryData } = await supabase
      .from("inventory")
      .select("id, name, unit")
      .in("id", inventoryIds);

    // 3. Unir los datos
    const fullRecipes = recipes.map(recipe => ({
      ...recipe,
      inventory: inventoryData?.find(i => i.id === recipe.inventory_id)
    }));

    setServiceRecipes(fullRecipes);
  };

  useEffect(() => {
    fetchServiceTypes();
    fetchInventory();
  }, []);

  useEffect(() => {
    const filtered = serviceTypes.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [search, serviceTypes]);

  const handleAdd = () => {
    if (role !== "admin") {
      toast({ title: "Acceso denegado", description: "Solo administradores pueden modificar el catálogo", variant: "destructive" });
      return;
    }
    setEditingService(null);
    form.reset({ name: "", description: "", price: "", estimated_minutes: "30" });
    setIsDialogOpen(true);
  };

  const handleEdit = (service: ServiceType) => {
    if (role !== "admin") {
      toast({ title: "Acceso denegado", description: "Solo administradores pueden modificar el catálogo", variant: "destructive" });
      return;
    }
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      estimated_minutes: (service.estimated_minutes || 30).toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ServiceTypeFormData) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      price: parseFloat(data.price),
      estimated_minutes: parseInt(data.estimated_minutes),
    };

    if (editingService) {
      const { error } = await supabase
        .from("service_types")
        .update(payload)
        .eq("id", editingService.id);

      if (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Servicio actualizado" });
        setIsDialogOpen(false);
        fetchServiceTypes();
      }
    } else {
      const { error } = await supabase.from("service_types").insert([payload]);

      if (error) {
        toast({ title: "Error al crear servicio", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Servicio creado exitosamente" });
        setIsDialogOpen(false);
        fetchServiceTypes();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteService) return;

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("service_types")
      .update({ is_active: false })
      .eq("id", deleteService.id);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Servicio eliminado del catálogo" });
      fetchServiceTypes();
    }
    fetchServiceTypes();
    setDeleteService(null);
  };

  const handleOpenConfig = (service: ServiceType) => {
    setConfigService(service);
    fetchRecipes(service.id);
    setSelectedInventoryId("");
    setSelectedQuantity("");
    setIsConfigDialogOpen(true);
  };

  const handleAddIngredient = async () => {
    if (!configService || !selectedInventoryId || !selectedQuantity) return;

    const quantity = parseFloat(selectedQuantity);
    if (isNaN(quantity) || quantity <= 0) return;

    const { error } = await supabase.from("service_inventory").insert({
      service_type_id: configService.id,
      inventory_id: selectedInventoryId,
      quantity,
    });

    if (error) {
      console.error("Error adding ingredient:", error);
      toast({
        title: "Error al agregar insumo",
        description: error.message || "El insumo ya está en la lista o hubo un error de permisos.",
        variant: "destructive"
      });
    } else {
      fetchRecipes(configService.id);
      fetchServiceTypes(); // Actualiza la lista principal
      setSelectedInventoryId("");
      setSelectedQuantity("");
    }
  };

  const handleRemoveIngredient = async (recipeId: string) => {
    const { error } = await supabase.from("service_inventory").delete().eq("id", recipeId);
    if (!error && configService) {
      fetchRecipes(configService.id);
      fetchServiceTypes(); // Actualiza la lista principal
    }
  };

  const columns = [
    {
      key: "name",
      header: "Servicio",
      render: (s: ServiceType) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">{s.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 italic">{s.description || "Sin descripción"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "recipe",
      header: "Insumos / Receta",
      render: (s: ServiceType) => (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
          {(s as any).service_inventory && (s as any).service_inventory.length > 0 ? (
            (s as any).service_inventory.map((item: any) => (
              <Badge key={item.id} variant="outline" className="text-[10px] py-0 px-1 border-primary/20 bg-primary/5 text-foreground font-normal">
                {item.inventory?.name}: {item.quantity}{item.inventory?.unit === 'unidad' ? 'u' : item.inventory?.unit}
              </Badge>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground italic">No configurado</span>
          )}
        </div>
      )
    },
    {
      key: "price",
      header: "Precio",
      render: (s: ServiceType) => (
        <div className="flex items-center gap-1 font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-primary/60" />
          {Number(s.price).toLocaleString()}
        </div>
      ),
    },
    {
      key: "time",
      header: "Duración Est.",
      render: (s: ServiceType) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {s.estimated_minutes} min
        </div>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (service: ServiceType) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenConfig(service)} title="Configurar Insumos">
            <Package className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteService(service)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h1>
          <p className="text-muted-foreground">Define los tipos de lavado y precios disponibles</p>
        </div>
      </div>

      <DataTable
        data={filteredServices}
        columns={columns}
        searchPlaceholder="Buscar servicio..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Nuevo Servicio"
        emptyMessage="No hay servicios definidos en el catálogo"
        isLoading={isLoading}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
            <DialogDescription>
              Define los detalles del servicio para el catálogo
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Servicio *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lavado Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Incluye encerado, aspirado profundo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio ($) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimated_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo Est. (min) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingService ? "Guardar Cambios" : "Crear Servicio"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar del catálogo?</AlertDialogTitle>
            <AlertDialogDescription>
              El servicio "{deleteService?.name}" ya no estará disponible para nuevas ventas. Los registros históricos no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recipe Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl text-foreground">
          <DialogHeader>
            <DialogTitle>Insumos para {configService?.name}</DialogTitle>
            <DialogDescription>
              Configura los productos que se descuentan automáticamente al realizar este servicio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-12 gap-2 items-end bg-muted/30 p-4 rounded-xl border border-border">
              <div className="col-span-6 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 text-foreground">Producto</label>
                <Select onValueChange={setSelectedInventoryId} value={selectedInventoryId}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Seleccionar insumo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 text-foreground">Cantidad</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  className="bg-background border-border text-foreground font-mono"
                />
              </div>
              <div className="col-span-2">
                <Button
                  className="w-full"
                  onClick={handleAddIngredient}
                  disabled={!selectedInventoryId || !selectedQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 px-1 text-foreground">
                <Package className="h-4 w-4 text-primary" />
                Insumos vinculados
              </h3>
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {serviceRecipes.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground italic">
                    Aún no se han configurado insumos para este servicio.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Producto</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Gasto por servicio</th>
                        <th className="w-12 p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {serviceRecipes.map((recipe) => (
                        <tr key={recipe.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{recipe.inventory?.name}</td>
                          <td className="p-3 text-right font-mono font-bold text-primary">
                            {recipe.quantity} <span className="text-[10px] font-normal text-muted-foreground uppercase ml-1 font-sans">{recipe.inventory?.unit}</span>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveIngredient(recipe.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)} className="px-6">
              Finalizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
