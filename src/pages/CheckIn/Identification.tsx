import { useState } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IdentificationProps {
    onClientFound: (client: any) => void;
    onNewClient: (plate: string) => void;
}

export default function Identification({ onClientFound, onNewClient }: IdentificationProps) {
    const [plate, setPlate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plate.trim()) return;

        setIsLoading(true);
        // Normalize plate: remove spaces, uppercase
        const cleanPlate = plate.replace(/\s+/g, "").toUpperCase();

        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .ilike("vehicle_plate", cleanPlate) // Case insensitive match
                .maybeSingle();

            if (error) throw error;

            if (data) {
                toast({ title: "¡Te encontramos!", description: `Hola ${data.name}` });
                onClientFound(data);
            } else {
                onNewClient(cleanPlate);
            }
        } catch (error: any) {
            toast({ title: "Error", description: "No pudimos buscar la patente. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Bienvenido</h2>
                <p className="text-muted-foreground">Ingresá tu patente para comenzar</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <Input
                                autoFocus
                                type="text"
                                placeholder="AAA 123"
                                className="pl-10 h-14 text-lg font-mono uppercase tracking-widest text-center"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium transition-all hover:scale-[1.02]"
                            disabled={isLoading || plate.length < 3}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                "Comenzar"
                            )}
                            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
                Si es tu primera vez, te pediremos algunos datos básicos.
            </p>
        </div>
    );
}
