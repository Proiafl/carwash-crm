import { useState, useEffect } from "react";
import { UserCog, Shield, ShieldCheck, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Employee = {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    email?: string;
    role?: string;
    created_at: string;
};

export default function Configuracion() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { role } = useAuth();

    const fetchUsers = async () => {
        setIsLoading(true);

        // Fetch profiles and roles
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
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="usuarios" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Usuarios y Roles
                    </TabsTrigger>
                    <TabsTrigger value="sistema" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Sistema
                    </TabsTrigger>
                </TabsList>

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

                <TabsContent value="sistema" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferencias del Sistema</CardTitle>
                            <CardDescription>Configuración general del autolavado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic">
                                Próximamente: Configuración de moneda, horarios y notificaciones.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
