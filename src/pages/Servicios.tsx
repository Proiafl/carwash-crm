import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Play, CheckCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const serviceRecordSchema = z.object({
  vehicle_id: z.string().min(1, "Selecciona un vehículo"),
  service_type_id: z.string().min(1, "Selecciona un servicio"),
  notes: z.string().optional(),
});

type ServiceRecordFormData = z.infer<typeof serviceRecordSchema>;
type ServiceType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_minutes: number | null;
  is_active: boolean;
};
type Vehicle = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  clients?: { name: string };
};
type ServiceRecord = {
  id: string;
  vehicle_id: string;
  service_type_id: string;
  employee_id: string | null;
  price: number;
  status: string;
  notes: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  vehicles?: Vehicle;
  service_types?: ServiceType;
};

export default function Servicios() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ServiceRecordFormData>({
    resolver: zodResolver(serviceRecordSchema),
    defaultValues: { vehicle_id: "", service_type_id: "", notes: "" },
  });

  const fetchData = async () => {
    setIsLoading(true);
    
    const [typesRes, vehiclesRes, recordsRes] = await Promise.all([
      supabase.from("service_types").select("*").eq("is_active", true).order("name"),
      supabase.from("vehicles").select("*, clients(name)").order("brand"),
      supabase.from("service_records").select("*, vehicles(*, clients(name)), service_types(*)").order("created_at", { ascending: false }),
    ]);

    setServiceTypes(typesRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setServiceRecords(recordsRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    form.reset({ vehicle_id: "", service_type_id: "", notes: "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ServiceRecordFormData) => {
    const serviceType = serviceTypes.find(s => s.id === data.service_type_id);
    if (!serviceType) return;

    const { error } = await supabase.from("service_records").insert({
      vehicle_id: data.vehicle_id,
      service_type_id: data.service_type_id,
      price: serviceType.price,
      notes: data.notes || null,
      employee_id: user?.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error al crear servicio", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Servicio registrado exitosamente" });
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const updateStatus = async (record: ServiceRecord, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "in_progress") updates.started_at = new Date().toISOString();
    if (newStatus === "completed") updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from("service_records").update(updates).eq("id", record.id);

    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado" });
      fetchData();
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/30",
    in_progress: "bg-primary/10 text-primary border-primary/30",
    completed: "bg-success/10 text-success border-success/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Proceso",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  const columns = [
    {
      key: "service",
      header: "Servicio",
      render: (r: ServiceRecord) => (
        <div>
          <p className="font-medium">{r.service_types?.name}</p>
          <p className="text-sm text-muted-foreground">
            {r.vehicles?.clients?.name} - {r.vehicles?.brand} {r.vehicles?.model}
          </p>
        </div>
      ),
    },
    {
      key: "plate",
      header: "Placa",
      render: (r: ServiceRecord) => r.vehicles?.plate || "-",
    },
    {
      key: "price",
      header: "Precio",
      render: (r: ServiceRecord) => `$${Number(r.price).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Estado",
      render: (r: ServiceRecord) => (
        <Badge variant="outline" className={statusColors[r.status]}>
          {statusLabels[r.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (r: ServiceRecord) => (
        <div className="flex gap-2">
          {r.status === "pending" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus(r, "in_progress")}>
              <Play className="h-4 w-4 mr-1" /> Iniciar
            </Button>
          )}
          {r.status === "in_progress" && (
            <Button size="sm" onClick={() => updateStatus(r, "completed")}>
              <CheckCircle className="h-4 w-4 mr-1" /> Completar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
        <p className="text-muted-foreground">Gestiona los servicios de lavado</p>
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records">Servicios Realizados</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo de Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6">
          <DataTable
            data={serviceRecords}
            columns={columns}
            onAdd={handleAdd}
            addLabel="Nuevo Servicio"
            emptyMessage="No hay servicios registrados"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceTypes.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-2xl font-bold">${Number(service.price).toLocaleString()}</span>
                  </div>
                  <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ⏱️ Tiempo estimado: {service.estimated_minutes} min
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Servicio</DialogTitle>
            <DialogDescription>Registra un nuevo servicio de lavado</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.brand} {v.model} ({v.plate}) - {v.clients?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} - ${Number(s.price).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Observaciones del servicio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Servicio</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
