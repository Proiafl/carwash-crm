import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, TrendingUp, TrendingDown, CalendarDays, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const expenseSchema = z.object({
  category: z.string().min(1, "La categoría es requerida"),
  description: z.string().trim().min(2, "La descripción es requerida"),
  amount: z.string().min(1, "El monto es requerido"),
  expense_date: z.string().min(1, "La fecha es requerida"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
};
type ServiceRecord = {
  id: string;
  price: number;
  status: string;
  created_at: string;
  service_types?: { name: string };
};

const EXPENSE_CATEGORIES = [
  "Insumos",
  "Salarios",
  "Servicios (Agua/Luz)",
  "Mantenimiento",
  "Otros",
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function Finanzas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      category: "", 
      description: "", 
      amount: "", 
      expense_date: new Date().toISOString().split('T')[0] 
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    
    const [expensesRes, servicesRes] = await Promise.all([
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("service_records").select("*, service_types(name)").eq("status", "completed").order("created_at", { ascending: false }),
    ]);

    setExpenses(expensesRes.data || []);
    setServices(servicesRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    form.reset({ 
      category: "", 
      description: "", 
      amount: "", 
      expense_date: new Date().toISOString().split('T')[0] 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ExpenseFormData) => {
    const { error } = await supabase.from("expenses").insert({
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      expense_date: data.expense_date,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Error al registrar gasto", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gasto registrado exitosamente" });
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gasto eliminado" });
      fetchData();
    }
  };

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyIncome = services
    .filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + Number(s.price), 0);

  const monthlyExpenses = expenses
    .filter(e => {
      const d = new Date(e.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const profit = monthlyIncome - monthlyExpenses;

  // Expenses by category for pie chart
  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    value: expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter(item => item.value > 0);

  const expenseColumns = [
    {
      key: "expense_date",
      header: "Fecha",
      render: (e: Expense) => new Date(e.expense_date).toLocaleDateString('es-MX'),
    },
    { key: "category", header: "Categoría" },
    { key: "description", header: "Descripción" },
    {
      key: "amount",
      header: "Monto",
      render: (e: Expense) => `$${Number(e.amount).toLocaleString()}`,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (e: Expense) => (
        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  const incomeColumns = [
    {
      key: "created_at",
      header: "Fecha",
      render: (s: ServiceRecord) => new Date(s.created_at).toLocaleDateString('es-MX'),
    },
    {
      key: "service",
      header: "Servicio",
      render: (s: ServiceRecord) => s.service_types?.name || "-",
    },
    {
      key: "price",
      header: "Ingreso",
      render: (s: ServiceRecord) => `$${Number(s.price).toLocaleString()}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">Control de ingresos y gastos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Ingresos del Mes"
          value={`$${monthlyIncome.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5 text-success" />}
          description="servicios completados"
        />
        <StatsCard
          title="Gastos del Mes"
          value={`$${monthlyExpenses.toLocaleString()}`}
          icon={<TrendingDown className="h-5 w-5 text-destructive" />}
          description="gastos registrados"
        />
        <StatsCard
          title="Utilidad del Mes"
          value={`$${profit.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          className={profit >= 0 ? "border-success/50" : "border-destructive/50"}
          description={profit >= 0 ? "ganancia neta" : "pérdida neta"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen Financiero</CardTitle>
            <CardDescription>Ingresos vs Gastos del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Ingresos", valor: monthlyIncome },
                  { name: "Gastos", valor: monthlyExpenses },
                  { name: "Utilidad", valor: profit },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoría</CardTitle>
            <CardDescription>Distribución de gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Monto"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay gastos registrados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for expenses and income */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <DataTable
            data={expenses}
            columns={expenseColumns}
            onAdd={handleAdd}
            addLabel="Registrar Gasto"
            emptyMessage="No hay gastos registrados"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <DataTable
            data={services}
            columns={incomeColumns}
            emptyMessage="No hay ingresos registrados"
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* New Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Gasto</DialogTitle>
            <DialogDescription>Ingresa los detalles del gasto</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del gasto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="100.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
