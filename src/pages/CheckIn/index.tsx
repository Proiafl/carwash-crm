import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Identification from "./Identification";
import NewClient from "./NewClient";
import ServiceSelection from "./ServiceSelection";
import Confirmation from "./Confirmation";

type Step = "identification" | "new_client" | "service" | "confirmation";

export default function CheckInWizard() {
    const [step, setStep] = useState<Step>("identification");
    const [client, setClient] = useState<any>(null);
    const [plate, setPlate] = useState("");
    const [service, setService] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleClientFound = (foundClient: any) => {
        setClient(foundClient);
        setStep("service");
    };

    const handleNewClient = (newPlate: string) => {
        setPlate(newPlate);
        setStep("new_client");
    };

    const handleClientCreated = (newClient: any) => {
        setClient(newClient);
        setStep("service");
    };

    const handleServiceSelected = (selectedService: any) => {
        setService(selectedService);
        setStep("confirmation");
    };

    const handleConfirm = async (deliveryPreference: string) => {
        if (!client || !service) return;
        setIsSubmitting(true);

        try {
            const { data, error } = await supabase
                .from("service_orders")
                .insert({
                    client_id: client.id,
                    vehicle_plate: client.vehicle_plate,
                    vehicle_description: `${client.vehicle_brand} ${client.vehicle_model} ${client.vehicle_color}`,
                    service_type_id: service.id,
                    price: service.price,
                    status: "queued",
                    payment_status: "pending",
                    delivery_preference: deliveryPreference,
                    notes: "Auto-Checkin QR",
                })
                .select()
                .single();

            if (error) throw error;

            toast({ title: "¡Check-in Exitoso!", description: "Tu vehículo está en fila." });
            navigate(`/checkin/monitor/${data.id}`);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full max-w-md pt-8 pb-6 flex items-center justify-center">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="bg-primary/20 text-primary p-2 rounded-lg">🚗💨</span>
                    <span>CarWash Buddy</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-md flex-1 pb-10">
                {step === "identification" && (
                    <Identification
                        onClientFound={handleClientFound}
                        onNewClient={handleNewClient}
                    />
                )}

                {step === "new_client" && (
                    <NewClient
                        initialPlate={plate}
                        onClientCreated={handleClientCreated}
                        onBack={() => setStep("identification")}
                    />
                )}

                {step === "service" && (
                    <ServiceSelection
                        onSelect={handleServiceSelected}
                        onBack={() => setStep("identification")}
                    />
                )}

                {step === "confirmation" && (
                    <Confirmation
                        client={client}
                        service={service}
                        onBack={() => setStep("service")}
                        onConfirm={handleConfirm}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>

            {/* Footer / Progress Indicator */}
            <div className="w-full max-w-md py-4 text-center text-xs text-muted-foreground">
                <div className="flex justify-center gap-2 mb-2">
                    <div className={`h-1 w-8 rounded-full ${step === 'identification' || step === 'new_client' ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 w-8 rounded-full ${step === 'service' ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 w-8 rounded-full ${step === 'confirmation' ? 'bg-primary' : 'bg-slate-800'}`} />
                </div>
                <p>Paso {step === 'identification' || step === 'new_client' ? 1 : step === 'service' ? 2 : 3} de 3</p>
            </div>
        </div>
    );
}
