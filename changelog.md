# Changelog

## [2026-04-18 v2] — Bug Fixes, Seguridad y Análisis WhatsApp

### Corregido
- **Error 404 en F5 (Producción):** Creados `public/.htaccess` (Apache/Hostinger) y `public/_redirects` (Netlify/Cloudflare) para redirigir todas las rutas a `index.html` y soportar BrowserRouter en producción.
- **Trial 14 días eliminado:** Removido bloque de validación de `ProtectedRoute` en `App.tsx`. El sistema es ahora de acceso libre.

### Seguridad
- **Política RLS anon para check-in:** Los clientes públicos en `/checkin` ahora pueden insertar y buscar clientes sin autenticación (necesario para el flujo de auto-checkin).
- **Política `upsert` de roles para admin:** Agregada política de UPDATE en `user_roles` para que los admins puedan modificar roles.
- **Admin ve todos los perfiles:** Nueva política en `profiles` para que el admin pueda listar todos los usuarios.
- **Headers de seguridad:** `.htaccess` incluye CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy y Permissions-Policy.
- **⚠️ Acción Requerida:** Ejecutar en el SQL Editor de Supabase: `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caja'; ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operador';`

### Reversión
- Trial 14 días: Restaurar las líneas 41-60 de `App.tsx` del commit anterior con `git diff`.
- Headers .htaccess: Borrar `public/.htaccess` si causan conflictos en el servidor.
- Políticas RLS anon: Eliminar desde el panel de Supabase → Authentication → Policies → tabla `clients`.


### Añadido
- **Validación Trial 14 Días**: Implementada validación en `ProtectedRoute` (`App.tsx`) para bloquear a los usuarios cuyo `created_at` supere los 14 días (Free Trial).
- **CRUD de Usuarios**: Modal y funciones de Alta, Baja, y Edición de usuarios desde la vista de Configuración.
- **Asignación de Roles**: Tres roles funcionales ('admin', 'caja', 'operador').
- **Cliente Unificado (Check-in)**: Formulario único para Check-in (`Identification.tsx`) solicitando patente, nombre, modelo, teléfono y email, con detección inmediata si la patente ya existe.

### Cambiado
- **Menú Lateral (Sidebar)**: Eliminada la sección `Personal`. Se añadió lógica para ocultar configuración a cajeros y operadores, dejando el dashboard y "Órdenes" acorde a sus permisos.
- **Contexto de Autenticación**: Se agregaron nuevos perfiles de rol a `AuthContextType`.

### Reversión (En caso de fallo)
- **Check-in Unificado**: Si la lógica de un solo paso rompe la captura de clientes, restaurar `Identification.tsx` usando `git checkout` o revertir la eliminación de la validación dividida en pasos en el commit anterior.
- **Acceso Usuarios**: El bloqueo de 14 días se puede levantar comentando las líneas 40-59 en `src/App.tsx`.
