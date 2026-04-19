import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Package, AlertTriangle, Plus, Minus } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const inventorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  unit: z.string().min(1, "La unidad es requerida"),
  min_stock: z.string().min(1, "El stock mínimo es requerido"),
  cost_per_unit: z.string().min(1, "El costo por unidad es requerido"),
});

const movementSchema = z.object({
  movement_type: z.enum(["purchase", "consumption", "adjustment"]),
  quantity: z.string().min(1, "La cantidad es requerida"),
  notes: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;
type MovementFormData = z.infer<typeof movementSchema>;
type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  created_at: string;
};

export default function Inventario() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: { name: "", description: "", unit: "unidad", min_stock: "0", cost_per_unit: "0" },
  });

  const movementForm = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { movement_type: "purchase", quantity: "", notes: "" },
  });

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error al cargar inventario", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
      setFilteredItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [search, items]);

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({ name: "", description: "", unit: "unidad", min_stock: "0", cost_per_unit: "0" });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      min_stock: item.min_stock.toString(),
      cost_per_unit: item.cost_per_unit.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleMovement = (item: InventoryItem) => {
    setSelectedItem(item);
    movementForm.reset({ movement_type: "purchase", quantity: "", notes: "" });
    setIsMovementDialogOpen(true);
  };

  const handleSubmit = async (data: InventoryFormData) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      unit: data.unit,
      min_stock: parseFloat(data.min_stock),
      cost_per_unit: parseFloat(data.cost_per_unit),
    };

    if (editingItem) {
      const { error } = await supabase.from("inventory").update(payload).eq("id", editingItem.id);

      if (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Producto actualizado" });
        setIsDialogOpen(false);
        fetchItems();
      }
    } else {
      const { error } = await supabase.from("inventory").insert({ ...payload, current_stock: 0 });

      if (error) {
        toast({ title: "Error al crear producto", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Producto creado exitosamente" });
        setIsDialogOpen(false);
        fetchItems();
      }
    }
  };

  const handleMovementSubmit = async (data: MovementFormData) => {
    if (!selectedItem) return;

    const quantity = parseFloat(data.quantity);
    let newStock = Number(selectedItem.current_stock);

    if (data.movement_type === "purchase") {
      newStock += quantity;
    } else if (data.movement_type === "consumption") {
      newStock -= quantity;
    } else {
      newStock = quantity;
    }

    if (newStock < 0) {
      toast({ title: "Error", description: "El stock no puede ser negativo", variant: "destructive" });
      return;
    }

    const { error: movementError } = await supabase.from("inventory_movements").insert({
      inventory_id: selectedItem.id,
      movement_type: data.movement_type,
      quantity: data.movement_type === "consumption" ? -quantity : quantity,
      notes: data.notes || null,
      created_by: user?.id,
    });

    if (movementError) {
      toast({ title: "Error", description: movementError.message, variant: "destructive" });
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ current_stock: newStock })
      .eq("id", selectedItem.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Stock actualizado" });
      setIsMovementDialogOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    const { error } = await supabase.from("inventory").delete().eq("id", deleteItem.id);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Producto eliminado" });
      fetchItems();
    }
    setDeleteItem(null);
  };

  const columns = [
    {
      key: "name",
      header: "Producto",
      render: (i: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{i.name}</p>
            <p className="text-sm text-muted-foreground">{i.description || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (i: InventoryItem) => {
        const isLow = Number(i.current_stock) < Number(i.min_stock);
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? "text-destructive font-medium" : ""}>
              {Number(i.current_stock).toFixed(1)} {i.unit}
            </span>
            {isLow && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="h-3 w-3 mr-1" /> Bajo
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "min_stock",
      header: "Mínimo",
      render: (i: InventoryItem) => `${Number(i.min_stock).toFixed(1)} ${i.unit}`,
    },
    {
      key: "cost",
      header: "Costo/Unidad",
      render: (i: InventoryItem) => `$${Number(i.cost_per_unit).toLocaleString()}`,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (item: InventoryItem) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMovement(item)}>
            <Plus className="h-4 w-4 mr-1" /> / <Minus className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">Control de insumos y materiales</p>
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        searchPlaceholder="Buscar producto..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Nuevo Producto"
        emptyMessage="No hay productos en inventario"
        isLoading={isLoading}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifica los datos del producto" : "Ingresa los datos del nuevo producto"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Shampoo para autos" {...field} />
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
                      <Textarea placeholder="Descripción del producto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="galón">Galón</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo/Unidad *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingItem ? "Guardar" : "Crear"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimiento de Inventario</DialogTitle>
            <DialogDescription>
              Registrar entrada o salida de {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...movementForm}>
            <form onSubmit={movementForm.handleSubmit(handleMovementSubmit)} className="space-y-4">
              <FormField
                control={movementForm.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Compra (Entrada)</SelectItem>
                        <SelectItem value="consumption">Consumo (Salida)</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={movementForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={movementForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Motivo del movimiento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {deleteItem?.name} del inventario.
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
    </div>
  );
}
