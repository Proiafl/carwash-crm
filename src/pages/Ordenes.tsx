import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Plus, Clock, User, Car, Sparkles, ChevronRight,
    LayoutGrid, List, Play, CheckCircle2, Truck, X, Timer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// === Types ===
type ServiceOrder = {
    id: string;
    client_id: string | null;
    vehicle_plate: string;
    vehicle_description: string | null;
    service_type_id: string | null;
    price: number;
    assigned_to: string | null;
    status: "queued" | "in_progress" | "ready" | "delivered" | "cancelled";
    queued_at: string;
    started_at: string | null;
    completed_at: string | null;
    delivered_at: string | null;
    notes: string | null;
    inventory_deducted: boolean;
    created_at: string;
    // Joined data
    clients?: { name: string; phone: string | null } | null;
    service_types?: { name: string; price: number } | null;
    assigned_profile?: { full_name: string } | null;
};

type Client = { id: string; name: string; phone: string | null; vehicle_plate: string; vehicle_brand: string; vehicle_model: string; vehicle_color: string };
type ServiceType = { id: string; name: string; price: number; estimated_minutes: number | null };
type Employee = { user_id: string; full_name: string };

// === Schema ===
const orderSchema = z.object({
    client_id: z.string().min(1, "Seleccione un cliente"),
    service_type_id: z.string().min(1, "Seleccione un servicio"),
    assigned_to: z.string().optional(),
    notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// === Status Config ===
const STATUS_CONFIG = {
    queued: { label: "En Cola", icon: Clock, color: "bg-warning/10 text-warning border-warning/30", columnColor: "border-t-warning" },
    in_progress: { label: "En Proceso", icon: Play, color: "bg-primary/10 text-primary border-primary/30", columnColor: "border-t-primary" },
    ready: { label: "Listo", icon: CheckCircle2, color: "bg-success/10 text-success border-success/30", columnColor: "border-t-success" },
    delivered: { label: "Entregado", icon: Truck, color: "bg-muted text-muted-foreground border-muted", columnColor: "border-t-muted-foreground" },
};

// === Helper: Elapsed Time ===
function elapsedTime(from: string | null): string {
    if (!from) return "-";
    const diff = Date.now() - new Date(from).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
}

// === Component ===
export default function Ordenes() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [cancelOrder, setCancelOrder] = useState<ServiceOrder | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: { client_id: "", service_type_id: "", assigned_to: "", notes: "" },
    });

    // === Fetch Functions ===
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from("service_orders")
            .select(`
        *,
        clients (name, phone),
        service_types (name, price)
      `)
            .gte("created_at", today.toISOString())
            .neq("status", "cancelled")
            .order("created_at", { ascending: true });

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            // Fetch assigned profiles separately
            const userIds = [...new Set((data || []).map(o => o.assigned_to).filter(Boolean))] as string[];
            let profilesMap: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id, full_name")
                    .in("user_id", userIds);
                profiles?.forEach(p => { profilesMap[p.user_id] = p.full_name; });
            }

            const enriched = (data || []).map(o => ({
                ...o,
                assigned_profile: o.assigned_to ? { full_name: profilesMap[o.assigned_to] || "Sin asignar" } : null,
            }));
            setOrders(enriched as ServiceOrder[]);
        }
        setIsLoading(false);
    }, [toast]);

    const fetchFormData = useCallback(async () => {
        const [clientsRes, servicesRes, profilesRes] = await Promise.all([
            supabase.from("clients").select("id, name, phone, vehicle_plate, vehicle_brand, vehicle_model, vehicle_color").order("name"),
            supabase.from("service_types").select("id, name, price, estimated_minutes").eq("is_active", true).order("name"),
            supabase.from("profiles").select("user_id, full_name").order("full_name"),
        ]);
        setClients(clientsRes.data || []);
        setServiceTypes(servicesRes.data || []);
        setEmployees(profilesRes.data || []);
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchFormData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders, fetchFormData]);

    // === Handlers ===
    const handleNewOrder = () => {
        form.reset({ client_id: "", service_type_id: "", assigned_to: "", notes: "" });
        setIsDialogOpen(true);
    };

    const handleSubmitOrder = async (data: OrderFormData) => {
        const client = clients.find(c => c.id === data.client_id);
        const service = serviceTypes.find(s => s.id === data.service_type_id);
        if (!client || !service) return;

        const { error } = await supabase.from("service_orders").insert({
            client_id: data.client_id,
            vehicle_plate: client.vehicle_plate,
            vehicle_description: `${client.vehicle_brand} ${client.vehicle_model} ${client.vehicle_color}`,
            service_type_id: data.service_type_id,
            price: service.price,
            assigned_to: data.assigned_to || null,
            notes: data.notes || null,
            created_by: user?.id,
            status: "queued",
        });

        if (error) {
            toast({ title: "Error al crear orden", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Orden creada", description: `${client.name} - ${service.name}` });
            setIsDialogOpen(false);
            fetchOrders();
        }
    };

    const handleStatusChange = async (order: ServiceOrder, newStatus: string) => {
        const updates: Record<string, any> = { status: newStatus };

        if (newStatus === "in_progress") updates.started_at = new Date().toISOString();
        if (newStatus === "ready") updates.completed_at = new Date().toISOString();
        if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

        // Auto-deduct inventory when marking as ready
        if (newStatus === "ready" && !order.inventory_deducted && order.service_type_id) {
            const { data: recipes } = await supabase
                .from("service_inventory")
                .select("inventory_id, quantity")
                .eq("service_type_id", order.service_type_id);

            if (recipes && recipes.length > 0) {
                for (const recipe of recipes) {
                    const { data: inv } = await supabase
                        .from("inventory")
                        .select("current_stock")
                        .eq("id", recipe.inventory_id)
                        .single();

                    if (inv) {
                        const newStock = Math.max(0, Number(inv.current_stock) - Number(recipe.quantity));
                        await supabase.from("inventory").update({ current_stock: newStock }).eq("id", recipe.inventory_id);

                        await supabase.from("inventory_movements").insert({
                            inventory_id: recipe.inventory_id,
                            movement_type: "consumption",
                            quantity: -Number(recipe.quantity),
                            notes: `Auto-descuento por orden #${order.id.slice(0, 8)}`,
                            created_by: user?.id,
                        });
                    }
                }
                updates.inventory_deducted = true;
            }
        }

        // Create service_record when delivered (for finance tracking)
        if (newStatus === "delivered") {
            await supabase.from("service_records").insert({
                client_id: order.client_id,
                service_type_id: order.service_type_id,
                price: order.price,
                status: "completed",
            });
        }

        const { error } = await supabase
            .from("service_orders")
            .update(updates)
            .eq("id", order.id);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: `Estado actualizado: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}` });
            fetchOrders();
        }
    };

    const handleCancel = async () => {
        if (!cancelOrder) return;
        const { error } = await supabase
            .from("service_orders")
            .update({ status: "cancelled" })
            .eq("id", cancelOrder.id);

        if (!error) {
            toast({ title: "Orden cancelada" });
            fetchOrders();
        }
        setCancelOrder(null);
    };

    // === Render Helpers ===
    const getNextStatus = (status: string) => {
        const flow: Record<string, string> = {
            queued: "in_progress",
            in_progress: "ready",
            ready: "delivered",
        };
        return flow[status];
    };

    const getNextStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            queued: "Iniciar",
            in_progress: "Marcar Listo",
            ready: "Entregar",
        };
        return labels[status];
    };

    const ordersByStatus = (status: string) => orders.filter(o => o.status === status);

    // === Kanban Card ===
    const OrderCard = ({ order }: { order: ServiceOrder }) => (
        <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold tracking-wider">{order.vehicle_plate}</span>
                    <Badge variant="outline" className={STATUS_CONFIG[order.status]?.color}>
                        {STATUS_CONFIG[order.status]?.label}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{order.vehicle_description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {order.clients?.name || "Sin cliente"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {order.service_types?.name || "Sin servicio"}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {order.status === "in_progress" ? elapsedTime(order.started_at) :
                            order.status === "ready" ? elapsedTime(order.completed_at) :
                                elapsedTime(order.queued_at)}
                    </span>
                    {order.assigned_profile && (
                        <span className="text-xs text-primary">{order.assigned_profile.full_name}</span>
                    )}
                </div>
                {order.status !== "delivered" && (
                    <Button
                        size="sm"
                        className="w-full mt-2"
                        variant={order.status === "ready" ? "default" : "outline"}
                        onClick={(e) => {
                            e.stopPropagation();
                            const next = getNextStatus(order.status);
                            if (next) handleStatusChange(order, next);
                        }}
                    >
                        <ChevronRight className="h-4 w-4 mr-1" />
                        {getNextStatusLabel(order.status)}
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    // === RENDER ===
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Órdenes de Servicio</h1>
                    <p className="text-muted-foreground">Gestión operativa del día</p>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                        <TabsList>
                            <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                            <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={handleNewOrder}>
                        <Plus className="h-4 w-4 mr-2" /> Nueva Orden
                    </Button>
                </div>
            </div>

            {/* KANBAN VIEW */}
            {viewMode === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(["queued", "in_progress", "ready", "delivered"] as const).map((status) => (
                        <div key={status} className={`rounded-xl border-t-4 ${STATUS_CONFIG[status].columnColor} bg-muted/30 p-4`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    {(() => { const Icon = STATUS_CONFIG[status].icon; return <Icon className="h-4 w-4" />; })()}
                                    {STATUS_CONFIG[status].label}
                                </h3>
                                <Badge variant="secondary" className="text-xs">{ordersByStatus(status).length}</Badge>
                            </div>
                            <div className="space-y-0">
                                {ordersByStatus(status).map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {ordersByStatus(status).length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-8 italic">Sin órdenes</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-semibold">Patente</th>
                                    <th className="p-3 text-left font-semibold">Cliente</th>
                                    <th className="p-3 text-left font-semibold">Servicio</th>
                                    <th className="p-3 text-left font-semibold">Estado</th>
                                    <th className="p-3 text-left font-semibold">Empleado</th>
                                    <th className="p-3 text-left font-semibold">Tiempo</th>
                                    <th className="p-3 text-left font-semibold">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="p-3 font-mono font-bold">{order.vehicle_plate}</td>
                                        <td className="p-3">{order.clients?.name || "-"}</td>
                                        <td className="p-3">{order.service_types?.name || "-"}</td>
                                        <td className="p-3">
                                            <Badge variant="outline" className={STATUS_CONFIG[order.status]?.color}>
                                                {STATUS_CONFIG[order.status]?.label}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{order.assigned_profile?.full_name || "-"}</td>
                                        <td className="p-3 text-muted-foreground">{elapsedTime(order.started_at || order.queued_at)}</td>
                                        <td className="p-3 font-semibold">${Number(order.price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* NEW ORDER DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Orden de Servicio</DialogTitle>
                        <DialogDescription>Recibir vehículo para lavado</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitOrder)} className="space-y-4">
                            <FormField control={form.control} name="client_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} — {c.vehicle_plate} ({c.vehicle_brand} {c.vehicle_model})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="service_type_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Servicio *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar servicio..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {serviceTypes.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name} — ${Number(s.price).toLocaleString()} ({s.estimated_minutes}min)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="assigned_to" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignar a</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {employees.map(e => (
                                                <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl><Textarea placeholder="Observaciones especiales..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit">Crear Orden</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ORDER DETAIL DIALOG */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-lg">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <span className="font-mono text-xl">{selectedOrder.vehicle_plate}</span>
                                    <Badge variant="outline" className={STATUS_CONFIG[selectedOrder.status]?.color}>
                                        {STATUS_CONFIG[selectedOrder.status]?.label}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>{selectedOrder.vehicle_description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium ml-1">{selectedOrder.clients?.name}</span></div>
                                    <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium ml-1">{selectedOrder.clients?.phone || "-"}</span></div>
                                    <div><span className="text-muted-foreground">Servicio:</span> <span className="font-medium ml-1">{selectedOrder.service_types?.name}</span></div>
                                    <div><span className="text-muted-foreground">Precio:</span> <span className="font-bold ml-1">${Number(selectedOrder.price).toLocaleString()}</span></div>
                                    <div><span className="text-muted-foreground">Empleado:</span> <span className="font-medium ml-1">{selectedOrder.assigned_profile?.full_name || "Sin asignar"}</span></div>
                                    <div><span className="text-muted-foreground">Ingresó:</span> <span className="font-medium ml-1">{new Date(selectedOrder.queued_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <span className="text-muted-foreground">Notas:</span> {selectedOrder.notes}
                                    </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                    {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                                        <>
                                            <Button
                                                className="flex-1"
                                                onClick={() => {
                                                    const next = getNextStatus(selectedOrder.status);
                                                    if (next) { handleStatusChange(selectedOrder, next); setSelectedOrder(null); }
                                                }}
                                            >
                                                <ChevronRight className="h-4 w-4 mr-1" />
                                                {getNextStatusLabel(selectedOrder.status)}
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => { setCancelOrder(selectedOrder); setSelectedOrder(null); }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* CANCEL CONFIRMATION */}
            <AlertDialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar esta orden?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La orden de {cancelOrder?.clients?.name} ({cancelOrder?.vehicle_plate}) será cancelada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                            Cancelar Orden
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
