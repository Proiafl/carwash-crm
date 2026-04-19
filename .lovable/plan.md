

# Lavadero-App
## Sistema Integral de Gestión para Autolavado

### Visión General
Una aplicación web moderna estilo CRM (inspirada en Pipedrive) para la gestión completa de un servicio de autolavado. Incluye gestión de clientes, vehículos, servicios, inventario, finanzas y personal.

---

## Módulos de la Aplicación

### 1. 🔐 Autenticación y Roles
- **Login/Registro** para dueño y empleados
- **Roles de usuario**: Administrador (acceso total) y Empleado (acceso limitado)
- Gestión de permisos por rol

### 2. 📊 Dashboard Principal
- **Resumen visual** con métricas clave del día/semana/mes
- Ingresos y gastos en tiempo real
- Servicios realizados hoy
- Alertas de inventario bajo
- Gráficos de tendencias de ventas

### 3. 👥 Gestión de Clientes (CRM)
- **Registro completo de clientes**: nombre, teléfono, email
- Historial de visitas y servicios
- Notas y preferencias del cliente
- Búsqueda y filtros avanzados
- Vista tipo kanban para seguimiento

### 4. 🚗 Registro de Vehículos
- Asociación de vehículos a clientes
- Datos del vehículo: marca, modelo, año, color, placa
- Historial de servicios por vehículo
- Fotos del vehículo (antes/después)

### 5. 🧽 Catálogo y Gestión de Servicios
- **Tipos de lavado**: básico, completo, premium, detailing, etc.
- Precios configurables por servicio
- Tiempo estimado de cada servicio
- Registro de servicios prestados
- Asignación de empleado por servicio

### 6. 📦 Control de Inventario
- **Registro de insumos**: shampoo, cera, desengrasante, etc.
- Control de stock con alertas de mínimos
- Registro de compras/reposiciones
- Consumo por servicio
- Historial de movimientos

### 7. 💰 Finanzas
- **Registro de ventas** (servicios prestados)
- **Registro de gastos** (insumos, salarios, otros)
- Reportes de ingresos vs gastos
- Gráficos de rentabilidad
- Exportación de datos

### 8. 👷 Gestión de Personal
- Registro de empleados
- Horarios y turnos
- Servicios asignados por empleado
- Rendimiento/productividad

---

## Diseño y Experiencia
- **Estilo moderno y minimalista** tipo Pipedrive
- Barra lateral de navegación
- Colores neutros con acentos profesionales
- Tablas con filtros y búsqueda
- Tarjetas de resumen visual
- Diseño responsive (funciona en móvil y desktop)

---

## Tecnología
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (base de datos PostgreSQL + autenticación)
- **Gráficos**: Recharts para visualizaciones
- Sistema de roles seguro con RLS (Row Level Security)

