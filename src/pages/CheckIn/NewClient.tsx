import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

// Schema matching the requirement
const clientSchema = z.object({
    name: z.string().min(2, "El nombre es obligatorio"),
    phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    vehicle_brand: z.string().min(2, "Marca obligatoria"),
    vehicle_model: z.string().min(2, "Modelo obligatorio"),
    vehicle_plate: z.string().min(3, "Patente obligatoria"),
    vehicle_color: z.string().min(3, "Color obligatorio"),
    vehicle_notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface NewClientProps {
    initialPlate: string;
    onClientCreated: (client: any) => void;
    onBack: () => void;
}

export default function NewClient({ initialPlate, onClientCreated, onBack }: NewClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            vehicle_brand: "",
            vehicle_model: "",
            vehicle_plate: initialPlate || "",
            vehicle_color: "",
            vehicle_notes: "",
        },
    });

    const onSubmit = async (data: ClientFormData) => {
        setIsLoading(true);
        try {
            // Check if plate exists again just in case
            const { data: existing } = await supabase
                .from("clients")
                .select("id")
                .eq("vehicle_plate", data.vehicle_plate)
                .maybeSingle();

            if (existing) {
                toast({ title: "Error", description: "Esta patente ya está registrada.", variant: "destructive" });
                setIsLoading(false);
                return;
            }

            const { data: newClient, error } = await supabase
                .from("clients")
                .insert({
                    name: data.name,
                    phone: data.phone || null,
                    email: data.email || null,
                    vehicle_brand: data.vehicle_brand,
                    vehicle_model: data.vehicle_model,
                    vehicle_plate: data.vehicle_plate.toUpperCase(),
                    vehicle_color: data.vehicle_color,
                    vehicle_notes: data.vehicle_notes || null,
                })
                .select()
                .single();

            if (error) throw error;

            toast({ title: "¡Registro exitoso!", description: "Bienvenido a CarWash Buddy." });
            onClientCreated(newClient);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "No se pudo crear el cliente.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
                <p className="text-muted-foreground text-sm">Completa tus datos por única vez</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl><Input placeholder="+54 9 11..." type="tel" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input placeholder="juan@email.com" type="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="vehicle_brand" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca *</FormLabel>
                                        <FormControl><Input placeholder="Toyota" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="vehicle_model" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo *</FormLabel>
                                        <FormControl><Input placeholder="Hilux" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Patente *</FormLabel>
                                        <FormControl><Input className="uppercase font-mono" placeholder="ABC-123" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="vehicle_color" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color *</FormLabel>
                                        <FormControl><Input placeholder="Blanco" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="vehicle_notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones (Opcional)</FormLabel>
                                    <FormControl><Textarea placeholder="Ej: Rayón en puerta derecha..." className="resize-none h-20" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Volver
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                    Registrarme
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
