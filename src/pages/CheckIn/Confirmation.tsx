import { useState } from "react";
import { Loader2, ArrowLeft, Check, Car, User, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ConfirmationProps {
    client: any;
    service: any;
    onBack: () => void;
    onConfirm: (deliveryPreference: string) => void;
    isSubmitting: boolean;
}

export default function Confirmation({ client, service, onBack, onConfirm, isSubmitting }: ConfirmationProps) {
    const [preference, setPreference] = useState("wait_onsite");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">Confirma tu Pedido</h2>
                <p className="text-muted-foreground text-sm">Un último paso y estamos listos</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/5 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/20 pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Resumen del Vehículo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Vehículo:</span>
                        <span className="font-semibold">{client.vehicle_brand} {client.vehicle_model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Patente:</span>
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{client.vehicle_plate}</span>
                    </div>
                </CardContent>
                <Separator />
                <CardHeader className="bg-muted/20 pb-4 pt-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Servicio Seleccionado
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Servicio:</span>
                        <span className="font-semibold">{service.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Duración Estimada:</span>
                        <span className="text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.estimated_minutes} min
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">Total a Pagar:</span>
                        <span className="text-xl font-bold text-primary">${Number(service.price).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        ¿Qué harás mientras esperas?
                    </h3>
                    <RadioGroup defaultValue="wait_onsite" value={preference} onValueChange={setPreference} className="grid grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="wait_onsite" id="wait" className="peer sr-only" />
                            <Label
                                htmlFor="wait"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                            >
                                <span className="mb-2 text-xl">🛋️</span>
                                <span className="font-semibold text-xs">Espero Aquí</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="pickup_later" id="pickup" className="peer sr-only" />
                            <Label
                                htmlFor="pickup"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                            >
                                <span className="mb-2 text-xl">👋</span>
                                <span className="font-semibold text-xs">Lo Retiro Luego</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
                <Button onClick={() => onConfirm(preference)} className="flex-1 h-12 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                    Confirmar Check-in
                </Button>
            </div>
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 3v4" />
            <path d="M3 5h4" />
            <path d="M3 9h4" />
        </svg>
    )
}
