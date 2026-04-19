import { useState } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface IdentificationProps {
    onClientFound: (client: any) => void;
    onNewClient: (plate: string) => void; // Unused, we will handle creation here
}

export default function Identification({ onClientFound, onNewClient }: IdentificationProps) {
    const [formData, setFormData] = useState({
        plate: "",
        name: "",
        brand: "",
        model: "",
        phone: "",
        email: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSearchCheckin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.plate.trim()) {
            toast({ title: "Datos incompletos", description: "La patente es obligatoria", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        const cleanPlate = formData.plate.replace(/\s+/g, "").toUpperCase();

        try {
            // Check if exists
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .ilike("vehicle_plate", cleanPlate)
                .maybeSingle();

            if (data) {
                toast({ title: "¡Te encontramos!", description: `Hola ${data.name}, ya estás registrado.` });
                onClientFound(data);
                return;
            }

            // Not exists, validate other required fields
            if (!formData.name.trim() || !formData.model.trim() || !formData.brand.trim()) {
                toast({ title: "Datos incompletos", description: "Para registrarte como cliente nuevo, ingresá Nombre, Marca y Modelo de vehículo.", variant: "destructive" });
                setIsLoading(false);
                return;
            }

            // Create new client
            const { data: newClient, error: insertError } = await supabase
                .from("clients")
                .insert({
                    name: formData.name,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    vehicle_brand: formData.brand,
                    vehicle_model: formData.model,
                    vehicle_plate: cleanPlate,
                    vehicle_color: "Desconocido", // default fallback
                })
                .select()
                .single();
                
            if (insertError) throw insertError;
            
            toast({ title: "¡Registro exitoso!", description: "Bienvenido a CarWash Buddy." });
            onClientFound(newClient);

        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Ocurrió un error.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Check-in Automático</h2>
                <p className="text-muted-foreground text-sm">Ingresá tus datos para el servicio. Si ya sos cliente, solo con tu patente alcanza.</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6">
                    <form onSubmit={handleSearchCheckin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Patente *</Label>
                            <Input
                                autoFocus
                                type="text"
                                placeholder="AAA 123"
                                className="h-12 text-lg font-mono uppercase tracking-widest text-center"
                                value={formData.plate}
                                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Marca del Vehículo</Label>
                                <Input
                                    type="text"
                                    placeholder="Toyota"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo del Vehículo</Label>
                                <Input
                                    type="text"
                                    placeholder="Hilux"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Nombre y Apellido</Label>
                                <Input
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    type="tel"
                                    placeholder="+54 11 ..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium transition-all hover:scale-[1.02] mt-4"
                            disabled={isLoading || formData.plate.length < 3}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                "Continuar al Servicio"
                            )}
                            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
