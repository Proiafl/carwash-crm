import { QrCode, Printer, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QrCheckin() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">QR Check-in</h1>
                <p className="text-muted-foreground">Sistema de Auto-Checkin para clientes</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        Sistema de Auto-Checkin
                    </CardTitle>
                    <CardDescription>
                        Genera un código QR para que tus clientes se registren automáticamente al llegar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="bg-white p-4 rounded-xl shadow-lg border">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/checkin")}`}
                                alt="QR Code Check-in"
                                className="w-48 h-48 md:w-64 md:h-64 object-contain"
                            />
                            <p className="text-xs text-muted-foreground mt-2 font-mono">{window.location.origin}/checkin</p>
                        </div>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <h3 className="font-semibold text-lg">¿Cómo funciona?</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Imprimí este código QR y colocalo en la entrada o recepción.
                                    Tus clientes podrán escanearlo con su celular para:
                                </p>
                                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside text-left">
                                    <li>Registrarse rápidamente</li>
                                    <li>Seleccionar su servicio sin espera</li>
                                    <li>Ver el estado de su auto en tiempo real</li>
                                </ul>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </Button>
                                <Button asChild className="gap-2">
                                    <a href="/checkin" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                        Abrir Pantalla de Check-in
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
