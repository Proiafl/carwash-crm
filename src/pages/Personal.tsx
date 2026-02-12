import { useState, useEffect, useCallback } from "react";
import { UserCog, Mail, Shield, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type UserRole = {
  user_id: string;
  role: string;
};

type Employee = Profile & {
  role?: string;
  email?: string;
  todayServices?: number;
  weekServices?: number;
};

export default function Personal() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { role } = useAuth();

  const fetchEmployees = async () => {
    setIsLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ title: "Error al cargar personal", description: profilesError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Fetch roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Fetch performance stats from service_orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: todayOrders } = await supabase
      .from("service_orders")
      .select("assigned_to")
      .gte("created_at", today.toISOString())
      .in("status", ["ready", "delivered"]);

    const { data: weekOrders } = await supabase
      .from("service_orders")
      .select("assigned_to")
      .gte("created_at", startOfWeek.toISOString())
      .in("status", ["ready", "delivered"]);

    // Count per employee
    const todayCounts: Record<string, number> = {};
    const weekCounts: Record<string, number> = {};
    (todayOrders || []).forEach(o => { if (o.assigned_to) todayCounts[o.assigned_to] = (todayCounts[o.assigned_to] || 0) + 1; });
    (weekOrders || []).forEach(o => { if (o.assigned_to) weekCounts[o.assigned_to] = (weekCounts[o.assigned_to] || 0) + 1; });

    // Combine data
    const employeesData: Employee[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        ...profile,
        role: userRole?.role || "employee",
        todayServices: todayCounts[profile.user_id] || 0,
        weekServices: weekCounts[profile.user_id] || 0,
      };
    });

    setEmployees(employeesData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
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
        <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
        <p className="text-muted-foreground">Gestión operativa del equipo de trabajo</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay empleados registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los empleados aparecerán aquí cuando se vinculen al sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 font-mono text-[10px] uppercase tracking-wider">
                        Rol: {roleLabels[employee.role || "employee"]}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {employee.email || "Sin correo"}
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4">📞</span>
                      {employee.phone}
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Rendimiento
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{employee.todayServices || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Hoy</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{employee.weekServices || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Esta Semana</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-muted-foreground text-right italic">
                    Vinculado el {new Date(employee.created_at).toLocaleDateString('es-MX')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
