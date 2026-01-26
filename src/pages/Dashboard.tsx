import { useEffect, useState } from "react";
import { DollarSign, Car, Users, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface DashboardStats {
  todayServices: number;
  todayRevenue: number;
  totalClients: number;
  lowStockItems: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayServices: 0,
    todayRevenue: 0,
    totalClients: 0,
    lowStockItems: 0,
  });
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's services
      const { data: todayServicesData } = await supabase
        .from("service_records")
        .select("price")
        .gte("created_at", today)
        .eq("status", "completed");

      // Fetch total clients
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      // Fetch low stock items
      const { data: lowStockData } = await supabase
        .from("inventory")
        .select("*")
        .lt("current_stock", supabase.rpc ? 0 : 10); // Check if stock < min_stock

      // Fetch recent services with details
      const { data: recentData } = await supabase
        .from("service_records")
        .select(`
          id,
          price,
          status,
          created_at,
          service_types (name),
          vehicles (brand, model, plate, clients (name))
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      const todayRevenue = todayServicesData?.reduce((sum, s) => sum + Number(s.price), 0) || 0;

      setStats({
        todayServices: todayServicesData?.length || 0,
        todayRevenue,
        totalClients: clientsCount || 0,
        lowStockItems: lowStockData?.filter(i => Number(i.current_stock) < Number(i.min_stock)).length || 0,
      });

      setRecentServices(recentData || []);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  // Sample chart data (would be fetched from DB in production)
  const weeklyData = [
    { day: "Lun", servicios: 12, ingresos: 1200 },
    { day: "Mar", servicios: 15, ingresos: 1500 },
    { day: "Mié", servicios: 8, ingresos: 800 },
    { day: "Jue", servicios: 18, ingresos: 1800 },
    { day: "Vie", servicios: 22, ingresos: 2200 },
    { day: "Sáb", servicios: 28, ingresos: 2800 },
    { day: "Dom", servicios: 10, ingresos: 1000 },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Proceso",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de tu autolavado</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Servicios Hoy"
          value={stats.todayServices}
          icon={<Car className="h-5 w-5" />}
          description="servicios completados"
        />
        <StatsCard
          title="Ingresos Hoy"
          value={`$${stats.todayRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          description="vs. ayer"
        />
        <StatsCard
          title="Total Clientes"
          value={stats.totalClients}
          icon={<Users className="h-5 w-5" />}
          description="clientes registrados"
        />
        <StatsCard
          title="Stock Bajo"
          value={stats.lowStockItems}
          icon={<AlertTriangle className="h-5 w-5" />}
          className={stats.lowStockItems > 0 ? "border-warning/50" : ""}
          description="productos por reabastecer"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Servicios de la Semana</CardTitle>
            <CardDescription>Cantidad de servicios por día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Bar dataKey="servicios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos de la Semana</CardTitle>
            <CardDescription>Tendencia de ingresos diarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value) => [`$${value}`, "Ingresos"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servicios Recientes</CardTitle>
          <CardDescription>Últimos servicios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : recentServices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay servicios registrados aún</p>
          ) : (
            <div className="space-y-3">
              {recentServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{service.service_types?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.vehicles?.clients?.name} - {service.vehicles?.brand} {service.vehicles?.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[service.status]}`}>
                      {statusLabels[service.status]}
                    </span>
                    <span className="font-semibold">${Number(service.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
