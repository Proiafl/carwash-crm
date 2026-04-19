import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Phone, Mail, Eye, Clock, DollarSign } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [clientStats, setClientStats] = useState<{ totalSpent: number; lastWash: string | null; totalServices: number }>({ totalSpent: 0, lastWash: null, totalServices: 0 });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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

  const handleViewClient = async (client: Client) => {
    setViewClient(client);
    setIsLoadingHistory(true);

    // Fetch service history from service_orders
    const { data: orders } = await supabase
      .from("service_orders")
      .select(`
        id, price, status, created_at, completed_at, delivered_at,
        service_types (name)
      `)
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch service history from service_records too
    const { data: records } = await supabase
      .from("service_records")
      .select(`
        id, price, status, created_at, completed_at,
        service_types (name)
      `)
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const allHistory = [
      ...(orders || []).map(o => ({ ...o, source: "order" })),
      ...(records || []).map(r => ({ ...r, source: "record" })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const completedItems = allHistory.filter(h => h.status === "delivered" || h.status === "completed");
    const totalSpent = completedItems.reduce((sum, h) => sum + Number(h.price), 0);
    const lastWash = completedItems.length > 0 ? completedItems[0].created_at : null;

    setClientHistory(allHistory);
    setClientStats({ totalSpent, lastWash, totalServices: completedItems.length });
    setIsLoadingHistory(false);
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
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)} title="Ver historial">
            <Eye className="h-4 w-4" />
          </Button>
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

      {/* Client Detail / History Dialog */}
      <Dialog open={!!viewClient} onOpenChange={() => setViewClient(null)}>
        <DialogContent className="max-w-lg">
          {viewClient && (
            <>
              <DialogHeader>
                <DialogTitle>{viewClient.name}</DialogTitle>
                <DialogDescription>
                  {viewClient.vehicle_brand} {viewClient.vehicle_model} — {viewClient.vehicle_plate}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Card>
                  <CardContent className="p-3 text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">${clientStats.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Gastado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{clientStats.totalServices}</p>
                    <p className="text-xs text-muted-foreground">Servicios</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-bold">
                      {clientStats.lastWash ? new Date(clientStats.lastWash).toLocaleDateString('es-AR') : "Nunca"}
                    </p>
                    <p className="text-xs text-muted-foreground">Último Lavado</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-3">Historial de Servicios</h4>
                {isLoadingHistory ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : clientHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin servicios registrados</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {clientHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                        <div>
                          <p className="font-medium">{item.service_types?.name || "Servicio"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('es-AR')} {new Date(item.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === "delivered" || item.status === "completed" ? "default" : "secondary"} className="text-xs">
                            {item.status === "delivered" ? "Entregado" : item.status === "completed" ? "Completado" : item.status === "in_progress" ? "En proceso" : item.status === "queued" ? "En cola" : item.status === "cancelled" ? "Cancelado" : item.status}
                          </Badge>
                          <span className="font-semibold">${Number(item.price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
