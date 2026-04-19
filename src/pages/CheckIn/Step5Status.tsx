import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock, Loader2, MapPin, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrderStatus = "queued" | "in_progress" | "ready" | "delivered" | "cancelled";

type OrderDetails = {
    id: string;
    vehicle_plate: string;
    vehicle_description: string | null;
    status: OrderStatus;
    payment_status: string | null;
    clients: { name: string } | null;
    service_types: { name: string; price: number } | null;
};

export default function StatusMonitor() {
    const { orderId } = useParams();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = async () => {
        if (!orderId) return;

        const { data, error } = await supabase
            .from("service_orders")
            .select(`
                id, vehicle_plate, vehicle_description, status, payment_status,
                clients (name),
                service_types (name, price)
            `)
            .eq("id", orderId)
            .single();

        if (data) {
            setOrder(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [orderId]);

    const steps = [
        { id: "queued", label: "En Cola", icon: Clock },
        { id: "in_progress", label: "Lavando", icon: Loader2 },
        { id: "ready", label: "Listo", icon: CheckCircle2 },
        { id: "delivered", label: "Entregado", icon: Truck },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order?.status);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!order) return <div className="p-8 text-center">Orden no encontrada</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 flex flex-col items-center">
            <div className="w-full max-w-md space-y-8 mt-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Estado de tu Vehículo</h1>
                    <p className="text-muted-foreground">{order.vehicle_description} • {order.vehicle_plate}</p>
                </div>

                {/* Progress */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="space-y-8 relative">
                            {/* Connecting Line */}
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-800" />

                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} className="relative flex items-center gap-4">
                                        <div className={`
                                            relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                                            ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-slate-900 border-slate-700 text-slate-500'}
                                            ${isCurrent && step.id === 'in_progress' ? 'animate-pulse' : ''}
                                        `}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isCompleted ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                                            {isCurrent && (
                                                <p className="text-xs text-primary animate-pulse">En curso...</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status / Action */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Detalle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Servicio</span>
                            <span>{order.service_types?.name}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${order.service_types?.price}</span>
                        </div>

                        {order.status !== 'delivered' && (
                            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 items-start">
                                <MapPin className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-500 text-sm">Pagar en Caja</p>
                                    <p className="text-xs text-yellow-200/70">
                                        Por favor acercate a la caja para abonar tu servicio mientras esperas.
                                    </p>
                                </div>
                            </div>
                        )}

                        {order.status === 'ready' && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center animate-bounce">
                                <p className="font-bold text-green-500">¡Tu auto está listo!</p>
                                <p className="text-sm text-green-200/70">Podés retirarlo cuando quieras.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button variant="ghost" className="w-full text-slate-500" onClick={() => window.location.href = '/checkin'}>
                    Volver al Inicio
                </Button>
            </div>
        </div>
    );
}
