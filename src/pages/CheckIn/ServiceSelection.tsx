import { useEffect, useState } from "react";
import { Check, Clock, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceType {
    id: string;
    name: string;
    price: number;
    estimated_minutes: number | null;
    description: string | null;
}

interface ServiceSelectionProps {
    onSelect: (service: ServiceType) => void;
    onBack: () => void;
}

export default function ServiceSelection({ onSelect, onBack }: ServiceSelectionProps) {
    const [services, setServices] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await supabase
                .from("service_types")
                .select("*")
                .eq("is_active", true)
                .order("price", { ascending: true });

            if (data) setServices(data);
            setLoading(false);
        };
        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">Elegí tu Servicio</h2>
                <p className="text-muted-foreground text-sm">¿Qué tratamiento le damos hoy?</p>
            </div>

            <ScrollArea className="h-[60vh] pr-4">
                <div className="grid gap-4">
                    {services.map((service) => (
                        <Card
                            key={service.id}
                            className="cursor-pointer hover:border-primary transition-all active:scale-[0.98] group relative overflow-hidden"
                            onClick={() => onSelect(service)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">{service.name}</span>
                                        {/* Simple "Popular" badge logic for example */}
                                        {service.name.toLowerCase().includes("premium") && (
                                            <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Popular
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {service.description || "Lavado profesional detallado."}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{service.estimated_minutes || 45} min aprox.</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-primary block">
                                        ${Number(service.price).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className="mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        Seleccionar
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {services.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No hay servicios activos disponibles.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="pt-2">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={onBack}>
                    Volver atrás
                </Button>
            </div>
        </div>
    );
}
