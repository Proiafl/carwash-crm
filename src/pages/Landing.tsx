import { Link } from "react-router-dom";
import { Droplets, ClipboardList, Users, Package, DollarSign, MessageSquare, TrendingUp, Clock, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";

const features = [
    {
        icon: ClipboardList,
        title: "Gestión de Órdenes",
        description: "Administra órdenes de servicio en tiempo real con tablero Kanban visual.",
    },
    {
        icon: Users,
        title: "Clientes Organizados",
        description: "Base de datos completa con historial de servicios y vehículos.",
    },
    {
        icon: Package,
        title: "Control de Inventario",
        description: "Monitorea productos y recibe alertas de stock bajo automáticamente.",
    },
    {
        icon: DollarSign,
        title: "Finanzas Claras",
        description: "Visualiza ingresos, gastos y utilidades en un dashboard intuitivo.",
    },
    {
        icon: MessageSquare,
        title: "WhatsApp Integrado",
        description: "Envía notificaciones automáticas a tus clientes por WhatsApp.",
    },
    {
        icon: TrendingUp,
        title: "Reportes Inteligentes",
        description: "Analíticas avanzadas para tomar decisiones basadas en datos.",
    },
];

const benefits = [
    {
        icon: Clock,
        title: "Ahorra Tiempo",
        description: "Automatiza tareas repetitivas y enfócate en hacer crecer tu negocio.",
    },
    {
        icon: Shield,
        title: "Datos Seguros",
        description: "Toda tu información protegida con encriptación de nivel empresarial.",
    },
    {
        icon: CheckCircle2,
        title: "Fácil de Usar",
        description: "Interfaz intuitiva que tu equipo aprenderá en minutos, no días.",
    },
];

const stats = [
    { value: "2.5X", label: "Más eficiencia" },
    { value: "100%", label: "Control total" },
    { value: "24/7", label: "Acceso siempre" },
];

export default function Landing() {
    const { businessName } = useSettings();
    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary glow-blue-sm">
                            <Droplets className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold">{businessName}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Características
                        </a>
                        <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Beneficios
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/auth">
                            <Button variant="ghost" size="sm">
                                Iniciar Sesión
                            </Button>
                        </Link>
                        <Link to="/auth">
                            <Button size="sm" className="glow-blue-sm">
                                Comenzar Gratis
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Background radial glow behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, hsl(217 91% 60% / 0.25) 0%, hsl(217 91% 60% / 0.1) 30%, transparent 70%)'
                    }}
                />

                <div className="container mx-auto max-w-5xl text-center relative z-10">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary"
                        style={{
                            boxShadow: '0 0 20px hsl(217 91% 60% / 0.4)'
                        }}>
                        ⚡ Potenciado por Tecnología de Última Generación
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        ¿Listo para{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary">
                            modernizar tu lavadero
                        </span>
                        ?
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto px-4">
                        Únete a docenas de lavaderos que ya automatizan su gestión con {businessName}.
                        Prueba gratis por 14 días, sin tarjeta de crédito.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link to="/auth">
                            <Button size="lg" className="text-lg h-14 px-8 w-full sm:w-auto"
                                style={{
                                    boxShadow: '0 0 30px hsl(217 91% 60% / 0.6), 0 0 60px hsl(217 91% 60% / 0.3)'
                                }}>
                                Comenzar Prueba Gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link to="/auth">
                            <Button size="lg" variant="outline" className="text-lg h-14 px-8 border-primary/30 w-full sm:w-auto hover:bg-primary/10">
                                Ver Demostración
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto mt-16">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-primary mb-2"
                                    style={{
                                        textShadow: '0 0 20px hsl(217 91% 60% / 0.5)'
                                    }}>
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 md:py-20 px-4 bg-card/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            Todo lo que necesitas en un solo lugar
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                            Desde la gestión de órdenes hasta el control financiero, todas las herramientas que tu lavadero necesita.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {features.map((feature, index) => (
                            <Card key={index}
                                className="border-border/50 bg-card hover:border-primary/50 transition-all duration-300"
                                style={{
                                    boxShadow: 'inset 0 0 20px hsl(217 91% 60% / 0.03)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 30px hsl(217 91% 60% / 0.2), inset 0 0 20px hsl(217 91% 60% / 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'inset 0 0 20px hsl(217 91% 60% / 0.03)';
                                }}>
                                <CardContent className="p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4"
                                        style={{
                                            boxShadow: '0 0 15px hsl(217 91% 60% / 0.3)'
                                        }}>
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-16 md:py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            Beneficios que transforman tu negocio
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                            Más que un software, una solución completa para llevar tu lavadero al siguiente nivel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="text-center px-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4"
                                    style={{
                                        boxShadow: '0 0 30px hsl(217 91% 60% / 0.4), 0 0 60px hsl(217 91% 60% / 0.2)'
                                    }}>
                                    <benefit.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                                <p className="text-sm md:text-base text-muted-foreground">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Background radial glow behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, hsl(217 91% 60% / 0.25) 0%, hsl(217 91% 60% / 0.1) 30%, transparent 70%)'
                    }}
                />

                <div className="container mx-auto max-w-4xl relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Comienza gratis hoy mismo
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto px-4">
                        Sin compromisos. Sin tarjeta de crédito. Cancela cuando quieras.
                    </p>
                    <Link to="/auth">
                        <Button size="lg" className="text-lg h-14 px-8 w-full sm:w-auto"
                            style={{
                                boxShadow: '0 0 30px hsl(217 91% 60% / 0.6), 0 0 60px hsl(217 91% 60% / 0.3)'
                            }}>
                            Crear Cuenta Gratis
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-border/40">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{businessName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            © 2026 {businessName}. Todos los derechos reservados.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
