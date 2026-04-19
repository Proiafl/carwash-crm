import {
  LayoutDashboard,
  Users,
  Car,
  Droplets,
  Sparkles,
  Package,
  DollarSign,
  UserCog,
  LogOut,
  Menu,
  Settings,
  ClipboardList,
  QrCode
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/useSettings";

const menuItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Órdenes", url: "/app/ordenes", icon: ClipboardList },
  { title: "Clientes", url: "/app/clientes", icon: Users },
  { title: "Servicios", url: "/app/servicios", icon: Sparkles },
  { title: "Inventario", url: "/app/inventario", icon: Package },
  { title: "Finanzas", url: "/app/finanzas", icon: DollarSign },
  { title: "QR Check-in", url: "/app/qr-checkin", icon: QrCode },
  { title: "Configuración", url: "/app/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user, role } = useAuth();
  const { businessName } = useSettings();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary glow-blue-sm">
            <Droplets className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">{businessName}</span>
              <span className="text-xs text-sidebar-foreground/60">Sistema de Gestión</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider px-3">
            {!collapsed && "Menú Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => {
                if (role === 'operador' && !['Órdenes', 'Dashboard', 'QR Check-in'].includes(item.title)) return false;
                if (role === 'caja' && item.title === 'Configuración') return false;
                return true;
              }).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-4" />
        {!collapsed && user && (
          <div className="mb-3 px-1">
            <p className="text-xs text-sidebar-foreground/60">Sesión activa</p>
            <p className="text-sm text-sidebar-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
