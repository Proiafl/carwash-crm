import { useState, useEffect } from "react";
import {
    UserCog, Shield, ShieldCheck, Users, Store, Bell, Bot, Save,
    MessageSquare, Send, Eye, EyeOff, History, CheckCircle2, XCircle,
    Clock, Loader2, Phone, RefreshCw, QrCode, Printer, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// === Types ===
type Employee = {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    email?: string;
    role?: string;
    created_at: string;
};

type AppSettings = {
    id: string;
    business_name: string;
    business_address: string | null;
    business_phone: string | null;
    currency: string;
    opening_time: string;
    closing_time: string;
    whatsapp_enabled: boolean;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    twilio_whatsapp_from: string;
    whatsapp_notify_on_ready: boolean;
    ai_follow_up_enabled: boolean;
    ai_follow_up_days: number;
    ai_follow_up_max_per_day: number;
};

type NotificationLogEntry = {
    id: string;
    type: string;
    channel: string;
    phone: string | null;
    message_sid: string | null;
    status: string;
    error_message: string | null;
    created_at: string;
    clients?: { name: string } | null;
    service_orders?: { vehicle_plate: string; vehicle_description: string | null } | null;
};

// === Component ===
export default function Configuracion() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [showSid, setShowSid] = useState(false);
    const [notifications, setNotifications] = useState<NotificationLogEntry[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const { toast } = useToast();
    const { role, user } = useAuth();

    // Settings state from Supabase
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // === Fetch Functions ===
    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from("app_settings")
            .select("*")
            .limit(1)
            .single();

        if (error) {
            toast({ title: "Error al cargar configuración", description: error.message, variant: "destructive" });
        } else if (data) {
            setSettings(data as AppSettings);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        const [profilesRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("user_roles").select("user_id, role")
        ]);

        if (!profilesRes.error) {
            const combinedData: Employee[] = (profilesRes.data || []).map(profile => {
                const userRole = rolesRes.data?.find(r => r.user_id === profile.user_id);
                return { ...profile, role: userRole?.role || "employee" };
            });
            setEmployees(combinedData);
        }
        setIsLoading(false);
    };

    const fetchNotifications = async () => {
        setNotifLoading(true);
        const { data, error } = await supabase
            .from("notification_log")
            .select(`
        *,
        clients (name)
      `)
            .order("created_at", { ascending: false })
            .limit(50);

        if (!error && data) {
            setNotifications(data as NotificationLogEntry[]);
        }
        setNotifLoading(false);
    };

    useEffect(() => {
        fetchSettings();
        fetchUsers();
        fetchNotifications();
    }, []);

    // === Save Handler ===
    const saveSettings = async () => {
        if (!settings) return;
        setIsSaving(true);

        const { error } = await supabase
            .from("app_settings")
            .update({
                business_name: settings.business_name,
                business_address: settings.business_address,
                business_phone: settings.business_phone,
                currency: settings.currency,
                opening_time: settings.opening_time,
                closing_time: settings.closing_time,
                whatsapp_enabled: settings.whatsapp_enabled,
                twilio_account_sid: settings.twilio_account_sid,
                twilio_auth_token: settings.twilio_auth_token,
                twilio_whatsapp_from: settings.twilio_whatsapp_from,
                whatsapp_notify_on_ready: settings.whatsapp_notify_on_ready,
                ai_follow_up_enabled: settings.ai_follow_up_enabled,
                ai_follow_up_days: settings.ai_follow_up_days,
                ai_follow_up_max_per_day: settings.ai_follow_up_max_per_day,
                updated_at: new Date().toISOString(),
                updated_by: user?.id,
            })
            .eq("id", settings.id);

        setIsSaving(false);

        if (error) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✅ Configuración guardada", description: "Todos los cambios se aplicaron correctamente." });
        }
    };

    // === Send Test WhatsApp ===
    const sendTestMessage = async () => {
        if (!settings?.twilio_account_sid || !settings?.twilio_auth_token) {
            toast({ title: "Error", description: "Configurá primero las credenciales de Twilio.", variant: "destructive" });
            return;
        }

        setIsSendingTest(true);

        try {
            const response = await fetch(
                "https://pluxznsdckqudpdvewnp.supabase.co/functions/v1/send-whatsapp",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        test: true,
                        test_phone: settings.business_phone || "5491150489879",
                        business_name: settings.business_name,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                toast({ title: "✅ Mensaje de prueba enviado", description: `SID: ${result.message_sid}` });
                fetchNotifications();
            } else {
                toast({ title: "Error al enviar", description: result.error || "Error desconocido", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }

        setIsSendingTest(false);
    };

    // === Role helpers ===
    const roleLabels: Record<string, string> = { admin: "Administrador", employee: "Empleado" };
    const roleColors: Record<string, string> = {
        admin: "bg-primary/10 text-primary border-primary/30",
        employee: "bg-muted text-muted-foreground border-muted",
    };

    const updateField = (field: keyof AppSettings, value: any) => {
        setSettings(prev => prev ? { ...prev, [field]: value } : prev);
    };

    const notifStatusIcon = (status: string) => {
        switch (status) {
            case "sent": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "delivered": return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">Gestión técnica y administrativa del sistema</p>
            </div>

            <Tabs defaultValue="negocio" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-full overflow-x-auto">
                    <TabsTrigger value="negocio" className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">Negocio</span>
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </TabsTrigger>
                    <TabsTrigger value="agente-ia" className="flex items-center gap-1">
                        <Bot className="h-4 w-4" />
                        <span className="hidden sm:inline">Agente IA</span>
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="flex items-center gap-1">
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">Historial</span>
                    </TabsTrigger>
                    <TabsTrigger value="usuarios" className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Usuarios</span>
                    </TabsTrigger>
                    <TabsTrigger value="qr-checkin" className="flex items-center gap-1">
                        <QrCode className="h-4 w-4" />
                        <span className="hidden sm:inline">QR Check-in</span>
                    </TabsTrigger>
                </TabsList>

                {/* ========== TAB: QR CHECK-IN ========== */}
                <TabsContent value="qr-checkin" className="mt-6">
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
                </TabsContent>

                {/* ========== TAB: NEGOCIO ========== */}
                <TabsContent value="negocio" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Negocio</CardTitle>
                            <CardDescription>Información general de tu negocio</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Nombre del Negocio</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="Mi Autolavado Express"
                                        value={settings.business_name}
                                        onChange={(e) => updateField("business_name", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessPhone">Teléfono</Label>
                                    <Input
                                        id="businessPhone"
                                        placeholder="+54 11 1234-5678"
                                        value={settings.business_phone || ""}
                                        onChange={(e) => updateField("business_phone", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessAddress">Dirección</Label>
                                <Input
                                    id="businessAddress"
                                    placeholder="Av. Ejemplo 1234, Buenos Aires"
                                    value={settings.business_address || ""}
                                    onChange={(e) => updateField("business_address", e.target.value)}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select value={settings.currency} onValueChange={(v) => updateField("currency", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                                            <SelectItem value="USD">USD - Dólar</SelectItem>
                                            <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                                            <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                                            <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="openTime">Hora de Apertura</Label>
                                    <Input id="openTime" type="time" value={settings.opening_time} onChange={(e) => updateField("opening_time", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="closeTime">Hora de Cierre</Label>
                                    <Input id="closeTime" type="time" value={settings.closing_time} onChange={(e) => updateField("closing_time", e.target.value)} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar Datos del Negocio
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ========== TAB: WHATSAPP ========== */}
                <TabsContent value="whatsapp" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-green-500" />
                                Configuración de WhatsApp
                            </CardTitle>
                            <CardDescription>
                                Envía notificaciones automáticas a tus clientes vía WhatsApp cuando su auto esté listo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Toggle principal */}
                            <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <div>
                                    <p className="font-medium">Habilitar WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">Activar el envío de mensajes automáticos</p>
                                </div>
                                <Switch
                                    checked={settings.whatsapp_enabled}
                                    onCheckedChange={(checked) => updateField("whatsapp_enabled", checked)}
                                />
                            </div>

                            {settings.whatsapp_enabled && (
                                <>
                                    {/* Credenciales Twilio */}
                                    <div className="space-y-4 p-4 border rounded-lg">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Credenciales Twilio
                                        </h4>

                                        <div className="space-y-2">
                                            <Label htmlFor="twilioSid">Account SID</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="twilioSid"
                                                    type={showSid ? "text" : "password"}
                                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    value={settings.twilio_account_sid || ""}
                                                    onChange={(e) => updateField("twilio_account_sid", e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                                <Button type="button" variant="outline" size="icon" onClick={() => setShowSid(!showSid)}>
                                                    {showSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="twilioToken">Auth Token</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="twilioToken"
                                                    type={showToken ? "text" : "password"}
                                                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    value={settings.twilio_auth_token || ""}
                                                    onChange={(e) => updateField("twilio_auth_token", e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                                <Button type="button" variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                                                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="twilioFrom">Número de WhatsApp (Twilio)</Label>
                                            <Input
                                                id="twilioFrom"
                                                placeholder="whatsapp:+14155238886"
                                                value={settings.twilio_whatsapp_from}
                                                onChange={(e) => updateField("twilio_whatsapp_from", e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Formato: whatsapp:+XXXXXXXXXXX — En sandbox es whatsapp:+14155238886
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notificación Auto Listo */}
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">Notificar cuando el auto está listo</p>
                                            <p className="text-sm text-muted-foreground">
                                                Envía automáticamente un WhatsApp al cliente cuando una orden pasa a "Listo para Retiro"
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.whatsapp_notify_on_ready}
                                            onCheckedChange={(checked) => updateField("whatsapp_notify_on_ready", checked)}
                                        />
                                    </div>

                                    {/* Preview del mensaje */}
                                    <Card className="bg-muted/30 border-dashed">
                                        <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground mb-2 font-semibold">PREVIEW DEL MENSAJE:</p>
                                            <div className="bg-green-800/90 text-white p-3 rounded-lg rounded-tl-none max-w-sm text-sm space-y-1">
                                                <p>¡Hola <strong>Juan Pérez</strong>! 🚗✨</p>
                                                <p>Tu <strong>Toyota Corolla Blanco</strong> (ABC123) ya está limpio y listo para retirar.</p>
                                                <p>Servicio realizado: <strong>Lavado Completo</strong></p>
                                                <p>Precio: <strong>$5,000</strong></p>
                                                <p>⏰ Te esperamos en <strong>{settings.business_name}</strong> hasta las {settings.closing_time}hs.</p>
                                                <p>¡Gracias por confiar en nosotros!</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={sendTestMessage} disabled={isSendingTest} className="gap-2">
                                            {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            Enviar Mensaje de Prueba
                                        </Button>
                                        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Guardar Configuración WhatsApp
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ========== TAB: AGENTE IA ========== */}
                <TabsContent value="agente-ia" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                Agente de Seguimiento IA
                            </CardTitle>
                            <CardDescription>
                                Contacta automáticamente a clientes que hace tiempo no lavan su vehículo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                                <div>
                                    <p className="font-medium">Activar Agente de Seguimiento</p>
                                    <p className="text-sm text-muted-foreground">
                                        Se ejecuta automáticamente todos los días a las 10:00 AM
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.ai_follow_up_enabled}
                                    onCheckedChange={(checked) => updateField("ai_follow_up_enabled", checked)}
                                />
                            </div>

                            {settings.ai_follow_up_enabled && (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="mb-3 block">
                                                Contactar clientes inactivos hace más de:{" "}
                                                <span className="font-bold text-primary">{settings.ai_follow_up_days} días</span>
                                            </Label>
                                            <Slider
                                                value={[settings.ai_follow_up_days]}
                                                onValueChange={(value) => updateField("ai_follow_up_days", value[0])}
                                                min={5}
                                                max={90}
                                                step={1}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>5 días</span>
                                                <span>90 días</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maxPerDay">Máximo de mensajes por día</Label>
                                            <Input
                                                id="maxPerDay"
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={settings.ai_follow_up_max_per_day}
                                                onChange={(e) => updateField("ai_follow_up_max_per_day", parseInt(e.target.value) || 1)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Limita la cantidad de mensajes para evitar costos excesivos
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <Card className="bg-muted/30 border-dashed">
                                        <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground mb-2 font-semibold">PREVIEW DEL MENSAJE DE SEGUIMIENTO:</p>
                                            <div className="bg-green-800/90 text-white p-3 rounded-lg rounded-tl-none max-w-sm text-sm space-y-1">
                                                <p>¡Hola <strong>María García</strong>! 👋</p>
                                                <p>Hace <strong>{settings.ai_follow_up_days} días</strong> que no te vemos por <strong>{settings.business_name}</strong>.</p>
                                                <p>Tu <strong>Ford Fiesta</strong> te lo va a agradecer 🧽💦</p>
                                                <p>📅 ¿Querés agendar un lavado? Respondé este mensaje y te reservamos turno.</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {!settings.whatsapp_enabled && (
                                        <Card className="bg-yellow-500/10 border-yellow-500/30">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <Bell className="h-5 w-5 text-yellow-600 shrink-0" />
                                                <p className="text-sm text-yellow-700">
                                                    <strong>Atención:</strong> Para que el agente pueda enviar mensajes, necesitás activar WhatsApp en la pestaña "WhatsApp".
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar Configuración IA
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ========== TAB: HISTORIAL ========== */}
                <TabsContent value="historial" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="h-5 w-5" />
                                        Historial de Notificaciones
                                    </CardTitle>
                                    <CardDescription>Registro de todos los mensajes enviados</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={notifLoading} className="gap-2">
                                    <RefreshCw className={`h-4 w-4 ${notifLoading ? "animate-spin" : ""}`} />
                                    Actualizar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No hay notificaciones enviadas aún</p>
                                    <p className="text-xs mt-1">Los mensajes aparecerán aquí cuando se envíen</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Teléfono</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>SID</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {notifications.map((n) => (
                                            <TableRow key={n.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {notifStatusIcon(n.status)}
                                                        <span className="text-xs capitalize">{n.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {n.type === "auto_listo" ? "🚗 Auto Listo" :
                                                            n.type === "follow_up" ? "🤖 Seguimiento" :
                                                                n.type === "test" ? "🧪 Prueba" : n.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{n.clients?.name || "-"}</TableCell>
                                                <TableCell className="font-mono text-xs">{n.phone || "-"}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(n.created_at).toLocaleString("es-AR", {
                                                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">
                                                    {n.message_sid || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ========== TAB: USUARIOS ========== */}
                <TabsContent value="usuarios" className="space-y-6 mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {employees.map((emp) => (
                                <Card key={emp.id} className="transition-shadow hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    {emp.role === "admin" ? (
                                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <UserCog className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{emp.full_name}</CardTitle>
                                                    <CardDescription className="text-xs truncate max-w-[150px]">
                                                        {emp.email || "Sin email"}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className={roleColors[emp.role || "employee"]}>
                                                <Shield className="h-3 w-3 mr-1" />
                                                {roleLabels[emp.role || "employee"]}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                ID: {emp.user_id.split('-')[0]}...
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {role === "admin" && (
                        <Card className="bg-muted/30 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Privilegios de Administrador
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Los cambios de roles críticos requieren acceso directo a nivel de base de datos o consola de Supabase por seguridad.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
