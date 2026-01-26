import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const vehicleSchema = z.object({
  client_id: z.string().min(1, "Selecciona un cliente"),
  brand: z.string().trim().min(1, "La marca es requerida"),
  model: z.string().trim().min(1, "El modelo es requerido"),
  year: z.string().optional(),
  color: z.string().optional(),
  plate: z.string().trim().min(1, "La placa es requerida"),
  notes: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;
type Vehicle = {
  id: string;
  client_id: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  plate: string;
  notes: string | null;
  created_at: string;
  clients?: { name: string };
};
type Client = { id: string; name: string };

export default function Vehiculos() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { client_id: "", brand: "", model: "", year: "", color: "", plate: "", notes: "" },
  });

  const fetchVehicles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar vehículos", description: error.message, variant: "destructive" });
    } else {
      setVehicles(data || []);
      setFilteredVehicles(data || []);
    }
    setIsLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name").order("name");
    setClients(data || []);
  };

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.clients?.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [search, vehicles]);

  const handleAdd = () => {
    setEditingVehicle(null);
    form.reset({ client_id: "", brand: "", model: "", year: "", color: "", plate: "", notes: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset({
      client_id: vehicle.client_id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() || "",
      color: vehicle.color || "",
      plate: vehicle.plate,
      notes: vehicle.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: VehicleFormData) => {
    const payload = {
      client_id: data.client_id,
      brand: data.brand,
      model: data.model,
      year: data.year ? parseInt(data.year) : null,
      color: data.color || null,
      plate: data.plate,
      notes: data.notes || null,
    };

    if (editingVehicle) {
      const { error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("id", editingVehicle.id);

      if (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Vehículo actualizado" });
        setIsDialogOpen(false);
        fetchVehicles();
      }
    } else {
      const { error } = await supabase.from("vehicles").insert([payload]);

      if (error) {
        toast({ title: "Error al crear vehículo", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Vehículo creado exitosamente" });
        setIsDialogOpen(false);
        fetchVehicles();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;

    const { error } = await supabase.from("vehicles").delete().eq("id", deleteVehicle.id);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehículo eliminado" });
      fetchVehicles();
    }
    setDeleteVehicle(null);
  };

  const columns = [
    {
      key: "vehicle",
      header: "Vehículo",
      render: (v: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{v.brand} {v.model}</p>
            <p className="text-sm text-muted-foreground">{v.year || "-"}</p>
          </div>
        </div>
      ),
    },
    { key: "plate", header: "Placa" },
    {
      key: "color",
      header: "Color",
      render: (v: Vehicle) => v.color || "-",
    },
    {
      key: "client",
      header: "Propietario",
      render: (v: Vehicle) => v.clients?.name || "-",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (vehicle: Vehicle) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteVehicle(vehicle)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
        <p className="text-muted-foreground">Gestiona los vehículos de tus clientes</p>
      </div>

      <DataTable
        data={filteredVehicles}
        columns={columns}
        searchPlaceholder="Buscar por marca, modelo, placa o cliente..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Nuevo Vehículo"
        emptyMessage="No hay vehículos registrados"
        isLoading={isLoading}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
            <DialogDescription>
              {editingVehicle ? "Modifica los datos del vehículo" : "Ingresa los datos del nuevo vehículo"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propietario *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Corolla" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Blanco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observaciones sobre el vehículo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingVehicle ? "Guardar" : "Crear"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={() => setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el {deleteVehicle?.brand} {deleteVehicle?.model} ({deleteVehicle?.plate}).
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
