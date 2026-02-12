import { useState, useEffect } from "react";
import { UserCog, Shield, ShieldCheck, Settings, Users, Store, Bell, Bot, Save } from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Employee = {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    email?: string;
    role?: string;
    created_at: string;
};

type BusinessSettings = {
    businessName: string;
    address: string;
    phone: string;
    currency: string;
    openTime: string;
    closeTime: string;
};

type NotificationSettings = {
    notifyWhenReady: boolean;
    whatsappTemplate: string;
    whatsappApiKey: string;
};

type AISettings = {
    enabled: boolean;
    inactiveDays: number;
    reinviteTemplate: string;
};

const defaultBusinessSettings: BusinessSettings = {
    businessName: "",
    address: "",
    phone: "",
    currency: "ARS",
    openTime: "08:00",
    closeTime: "20:00",
};

const defaultNotificationSettings: NotificationSettings = {
    notifyWhenReady: false,
    whatsappTemplate: "¡Hola {nombre}! Tu vehículo {patente} ya está listo para retirar. ¡Te esperamos!",
    whatsappApiKey: "",
};

const defaultAISettings: AISettings = {
    enabled: false,
    inactiveDays: 15,
    reinviteTemplate: "¡Hola {nombre}! Hace {dias} días que no nos visitás. ¿Querés agendar un lavado para tu {vehiculo}? 🚗✨",
};

export default function Configuracion() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { role } = useAuth();

    // Settings state (localStorage)
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
        const saved = localStorage.getItem("carwash_business_settings");
        return saved ? JSON.parse(saved) : defaultBusinessSettings;
    });

    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
        const saved = localStorage.getItem("carwash_notification_settings");
        return saved ? JSON.parse(saved) : defaultNotificationSettings;
    });

    const [aiSettings, setAISettings] = useState<AISettings>(() => {
        const saved = localStorage.getItem("carwash_ai_settings");
        return saved ? JSON.parse(saved) : defaultAISettings;
    });

    const fetchUsers = async () => {
        setIsLoading(true);

        const [profilesRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("user_roles").select("user_id, role")
        ]);

        if (profilesRes.error) {
            toast({ title: "Error", description: profilesRes.error.message, variant: "destructive" });
            setIsLoading(false);
            return;
        }

        const combinedData: Employee[] = (profilesRes.data || []).map(profile => {
            const userRole = rolesRes.data?.find(r => r.user_id === profile.user_id);
            return {
                ...profile,
                role: userRole?.role || "employee",
            };
        });

        setEmployees(combinedData);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const saveBusinessSettings = () => {
        localStorage.setItem("carwash_business_settings", JSON.stringify(businessSettings));
        toast({ title: "Configuración guardada", description: "Los datos del negocio se han guardado correctamente." });
    };

    const saveNotificationSettings = () => {
        localStorage.setItem("carwash_notification_settings", JSON.stringify(notificationSettings));
        toast({ title: "Notificaciones guardadas", description: "La configuración de notificaciones se ha guardado." });
    };

    const saveAISettings = () => {
        localStorage.setItem("carwash_ai_settings", JSON.stringify(aiSettings));
        toast({ title: "Agente IA guardado", description: "La configuración del agente se ha guardado." });
    };

    const roleLabels: Record<string, string> = {
        admin: "Administrador",
        employee: "Empleado",
    };

    const roleColors: Record<string, string> = {
        admin: "bg-primary/10 text-primary border-primary/30",
        employee: "bg-muted text-muted-foreground border-muted",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">Gestión técnica y administrativa del sistema</p>
            </div>

            <Tabs defaultValue="usuarios" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="usuarios" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Usuarios</span>
                    </TabsTrigger>
                    <TabsTrigger value="negocio" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">Negocio</span>
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notificaciones</span>
                    </TabsTrigger>
                    <TabsTrigger value="agente-ia" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span className="hidden sm:inline">Agente IA</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Usuarios y Roles */}
                <TabsContent value="usuarios" className="space-y-6 mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {employees.map((user) => (
                                <Card key={user.id} className="transition-shadow hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    {user.role === "admin" ? (
                                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <UserCog className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{user.full_name}</CardTitle>
                                                    <CardDescription className="text-xs truncate max-w-[150px]">
                                                        {user.email || "Sin email"}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className={roleColors[user.role || "employee"]}>
                                                <Shield className="h-3 w-3 mr-1" />
                                                {roleLabels[user.role || "employee"]}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                ID: {user.user_id.split('-')[0]}...
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

                {/* Tab: Negocio */}
                <TabsContent value="negocio" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Negocio</CardTitle>
                            <CardDescription>Información general de tu lavadero</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Nombre del Lavadero</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="Mi Lavadero Express"
                                        value={businessSettings.businessName}
                                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, businessName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessPhone">Teléfono</Label>
                                    <Input
                                        id="businessPhone"
                                        placeholder="+54 11 1234-5678"
                                        value={businessSettings.phone}
                                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessAddress">Dirección</Label>
                                <Input
                                    id="businessAddress"
                                    placeholder="Av. Ejemplo 1234, Buenos Aires"
                                    value={businessSettings.address}
                                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select
                                        value={businessSettings.currency}
                                        onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, currency: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
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
                                    <Input
                                        id="openTime"
                                        type="time"
                                        value={businessSettings.openTime}
                                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, openTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="closeTime">Hora de Cierre</Label>
                                    <Input
                                        id="closeTime"
                                        type="time"
                                        value={businessSettings.closeTime}
                                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, closeTime: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveBusinessSettings} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Guardar Datos del Negocio
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Notificaciones */}
                <TabsContent value="notificaciones" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones</CardTitle>
                            <CardDescription>Configura las alertas y mensajes automáticos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Notificar cuando el auto está listo</p>
                                    <p className="text-sm text-muted-foreground">Envía un mensaje de WhatsApp cuando una orden pasa a estado &quot;Listo&quot;</p>
                                </div>
                                <Switch
                                    checked={notificationSettings.notifyWhenReady}
                                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, notifyWhenReady: checked }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappTemplate">Template del Mensaje</Label>
                                <Textarea
                                    id="whatsappTemplate"
                                    placeholder="¡Hola {nombre}! Tu vehículo {patente} ya está listo..."
                                    rows={3}
                                    value={notificationSettings.whatsappTemplate}
                                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, whatsappTemplate: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Variables disponibles: {"{nombre}"}, {"{patente}"}, {"{servicio}"}, {"{precio}"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappApiKey">API Key de WhatsApp Business</Label>
                                <Input
                                    id="whatsappApiKey"
                                    type="password"
                                    placeholder="Ingresá tu API Key..."
                                    value={notificationSettings.whatsappApiKey}
                                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, whatsappApiKey: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Necesitás una cuenta de WhatsApp Business API para usar esta funcionalidad
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveNotificationSettings} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Guardar Notificaciones
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Agente IA */}
                <TabsContent value="agente-ia" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                Agente de Seguimiento IA
                            </CardTitle>
                            <CardDescription>
                                Configura el agente inteligente que re-invita a clientes inactivos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Activar Agente de Seguimiento</p>
                                    <p className="text-sm text-muted-foreground">Contacta automáticamente a clientes que hace tiempo no lavan</p>
                                </div>
                                <Switch
                                    checked={aiSettings.enabled}
                                    onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, enabled: checked }))}
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-3 block">
                                        Invitar clientes inactivos hace más de: <span className="font-bold text-primary">{aiSettings.inactiveDays} días</span>
                                    </Label>
                                    <Slider
                                        value={[aiSettings.inactiveDays]}
                                        onValueChange={(value) => setAISettings(prev => ({ ...prev, inactiveDays: value[0] }))}
                                        min={5}
                                        max={60}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>5 días</span>
                                        <span>60 días</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reinviteTemplate">Template del Mensaje de Re-invitación</Label>
                                <Textarea
                                    id="reinviteTemplate"
                                    rows={3}
                                    value={aiSettings.reinviteTemplate}
                                    onChange={(e) => setAISettings(prev => ({ ...prev, reinviteTemplate: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Variables disponibles: {"{nombre}"}, {"{dias}"}, {"{vehiculo}"}, {"{ultimo_servicio}"}
                                </p>
                            </div>

                            <Card className="bg-muted/30 border-dashed">
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground italic">
                                        🚧 Esta funcionalidad está en desarrollo. Los ajustes se guardan localmente y se activarán cuando el módulo de mensajería esté integrado.
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveAISettings} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Guardar Configuración IA
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
