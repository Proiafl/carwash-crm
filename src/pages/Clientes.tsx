import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Phone, Mail } from "lucide-react";
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

const clientSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  vehicle_brand: z.string().min(1, "La marca es requerida"),
  vehicle_model: z.string().min(1, "El modelo es requerido"),
  vehicle_plate: z.string().min(1, "La patente es requerida"),
  vehicle_color: z.string().min(1, "El color es requerido"),
  vehicle_notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;
type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_notes: string | null;
  created_at: string;
};

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
      vehicle_brand: "",
      vehicle_model: "",
      vehicle_plate: "",
      vehicle_color: "",
      vehicle_notes: "",
    },
  });

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar clientes", description: error.message, variant: "destructive" });
    } else {
      setClients(data || []);
      setFilteredClients(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [search, clients]);

  const handleAdd = () => {
    setEditingClient(null);
    form.reset({
      name: "",
      phone: "",
      email: "",
      notes: "",
      vehicle_brand: "",
      vehicle_model: "",
      vehicle_plate: "",
      vehicle_color: "",
      vehicle_notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      notes: client.notes || "",
      vehicle_brand: client.vehicle_brand || "",
      vehicle_model: client.vehicle_model || "",
      vehicle_plate: client.vehicle_plate || "",
      vehicle_color: client.vehicle_color || "",
      vehicle_notes: client.vehicle_notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ClientFormData) => {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
      vehicle_brand: data.vehicle_brand,
      vehicle_model: data.vehicle_model,
      vehicle_plate: data.vehicle_plate,
      vehicle_color: data.vehicle_color,
      vehicle_notes: data.vehicle_notes || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);

      if (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cliente actualizado" });
        setIsDialogOpen(false);
        fetchClients();
      }
    } else {
      const { error } = await supabase.from("clients").insert([payload]);

      if (error) {
        toast({ title: "Error al crear cliente", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cliente creado exitosamente" });
        setIsDialogOpen(false);
        fetchClients();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteClient) return;

    const { error } = await supabase.from("clients").delete().eq("id", deleteClient.id);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cliente eliminado" });
      fetchClients();
    }
    setDeleteClient(null);
  };

  const columns = [
    { key: "name", header: "Nombre" },
    {
      key: "vehicle",
      header: "Vehículo",
      render: (client: Client) => (
        <div>
          <p className="font-medium">{client.vehicle_brand} {client.vehicle_model}</p>
          <p className="text-xs text-muted-foreground font-mono">{client.vehicle_plate}</p>
        </div>
      )
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          {client.phone && <Phone className="h-4 w-4" />}
          {client.phone || "-"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (client: Client) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          {client.email && <Mail className="h-4 w-4" />}
          {client.email || "-"}
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notas",
      render: (client: Client) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {client.notes || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (client: Client) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteClient(client)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
      </div>

      <DataTable
        data={filteredClients}
        columns={columns}
        searchPlaceholder="Buscar por nombre, teléfono o email..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Nuevo Cliente"
        emptyMessage="No hay clientes registrados"
        isLoading={isLoading}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
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
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+52 555 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="cliente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca Vehículo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Hilux" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-123" className="font-mono uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color *</FormLabel>
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
                name="vehicle_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones Vehículo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Color, detalles, etc." {...field} />
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
                    <FormLabel>Notas del Cliente</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Preferencias del cliente..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingClient ? "Guardar" : "Crear"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {deleteClient?.name} y todos sus vehículos asociados.
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
