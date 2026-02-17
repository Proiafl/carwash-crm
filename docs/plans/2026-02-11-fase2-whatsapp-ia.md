# Fase 2: WhatsApp Notifications + Agente IA — Investigación y Diseño

> **Documento de investigación** — Resultado del análisis de tecnologías disponibles para integrar WhatsApp y automatización con IA al CRM de lavadero.

---

## 1. Resumen Ejecutivo

La Fase 2 consiste en dos funcionalidades complementarias:

| Feature | Descripción | Trigger |
|---|---|---|
| **Notificación "Auto Listo"** | Enviar WhatsApp al cliente cuando su auto pasa a estado "Listo para Retiro" | Automático (cambio de estado en `service_orders`) |
| **Agente IA de Seguimiento** | Enviar WhatsApp proactivo a clientes que no lavan hace X días, invitándolos a volver | Programado (cron diario) |

---

## 2. Tecnología: WhatsApp Cloud API (Meta)

### ¿Por qué WhatsApp Cloud API directo y no Twilio?

| Criterio | WhatsApp Cloud API (Meta) | Twilio |
|---|---|---|
| **Costo** | Solo pagas por mensaje (~$0.03 USD/msg en Argentina) | Twilio cobra adicional sobre Meta + fee por mensaje |
| **Latencia** | Directo a Meta, sin intermediarios | Proxy a través de Twilio |
| **Complejidad** | HTTP POST simples, sin SDK requerido | SDK más pulido pero innecesario para nuestro caso |
| **Control** | Total sobre templates y webhooks | Dependencia de Twilio |

**Decisión: Usar WhatsApp Cloud API directamente** — es más barato y suficiente para nuestro caso de uso.

### Requisitos para configurar

1. **Cuenta de Meta Business** (Meta Business Suite) — el usuario debe tener una.
2. **App de Meta for Developers** — crear en [developers.facebook.com](https://developers.facebook.com), agregar producto "WhatsApp".
3. **Número de teléfono dedicado** — un número que NO esté vinculado a WhatsApp personal. Puede ser un número virtual o fijo.
4. **Verificación del negocio** — Meta pide verificar que el negocio es real (puede tomar 1-3 días hábiles).
5. **Crear templates de mensajes** — los mensajes deben estar pre-aprobados por Meta (revisión en ~24h).

### Pricing para Argentina (desde julio 2025)

| Tipo de Mensaje | Precio por mensaje | ¿Cuándo se usa? |
|---|---|---|
| **Utility** (transaccional) | ~$0.030 USD | "Tu auto ya está listo para retirar" |
| **Marketing** | ~$0.065 USD | "¡Hace 15 días que no lavás tu auto!" |
| **Authentication** | ~$0.020 USD | No aplica a nuestro caso |
| **Service (respuesta cliente)** | GRATIS | Si el cliente responde al mensaje |

**Costo estimado mensual:**
- Si el lavadero atiende ~500 autos/mes → 500 notificaciones "auto listo" = **~$15 USD/mes**
- Si el agente IA contacta ~200 clientes inactivos/mes = **~$13 USD/mes** (marketing)
- **Total: ~$28 USD/mes** para un lavadero de tamaño mediano

### Templates de mensaje necesarios

**Template 1: Auto Listo (Utility)**
```
¡Hola {{1}}! 🚗✨

Tu {{2}} (patente {{3}}) ya está limpio y listo para retirar en {{4}}.

⏰ Te esperamos hoy hasta las {{5}}hs.

¡Gracias por confiar en nosotros!
```
Variables: `{{1}}` = nombre, `{{2}}` = vehículo, `{{3}}` = patente, `{{4}}` = nombre del lavadero, `{{5}}` = hora de cierre.

**Template 2: Seguimiento IA (Marketing)**
```
¡Hola {{1}}! 👋

Hace {{2}} días que no te vemos por {{3}}. Tu {{4}} te lo va a agradecer 🧽💦

📅 ¿Querés agendar un lavado? Respondé este mensaje y te reservamos turno.

{{5}}
```
Variables: `{{1}}` = nombre, `{{2}}` = días desde último servicio, `{{3}}` = nombre del lavadero, `{{4}}` = vehículo, `{{5}}` = promoción personalizada optional.

---

## 3. Arquitectura Técnica

### 3.1 Notificación "Auto Listo" — Flujo

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Operador cambia  │───▶│ Database Webhook  │───▶│ Edge Function   │
│ estado a "ready" │    │ (trigger UPDATE)  │    │ send-whatsapp   │
│ en Órdenes UI    │    │ on service_orders │    │                 │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ WhatsApp Cloud  │
                                                │ API (Meta)      │
                                                │ POST /messages  │
                                                └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Cliente recibe  │
                                                │ WhatsApp 📱     │
                                                └─────────────────┘
```

**Implementación:**

1. **Database Webhook** en Supabase:
   - Tabla: `service_orders`
   - Event: `UPDATE`
   - Condición: `new.status = 'ready' AND old.status != 'ready'`
   - Target: Edge Function `send-whatsapp`

2. **Supabase Edge Function** `send-whatsapp`:
   ```typescript
   // supabase/functions/send-whatsapp/index.ts
   import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

   serve(async (req) => {
     const payload = await req.json();
     const record = payload.record;
     
     // Solo enviar si el status cambió a "ready"
     if (record.status !== "ready") {
       return new Response("Skipped", { status: 200 });
     }

     // Fetch client data
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );

     const { data: order } = await supabase
       .from("service_orders")
       .select(`*, clients(name, phone)`)
       .eq("id", record.id)
       .single();

     if (!order?.clients?.phone) {
       return new Response("No phone", { status: 200 });
     }

     // Fetch settings
     const { data: settings } = await supabase
       .from("app_settings")
       .select("*")
       .single();

     const whatsappToken = settings?.whatsapp_api_token;
     const phoneNumberId = settings?.whatsapp_phone_id;
     const businessName = settings?.business_name || "el lavadero";

     if (!whatsappToken || !phoneNumberId) {
       return new Response("WhatsApp not configured", { status: 200 });
     }

     // Format phone for WhatsApp API (must include country code, no +)
     const phone = order.clients.phone.replace(/\D/g, "");
     const formattedPhone = phone.startsWith("54") ? phone : `54${phone}`;

     // Send WhatsApp via Cloud API
     const response = await fetch(
       `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
       {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${whatsappToken}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           messaging_product: "whatsapp",
           to: formattedPhone,
           type: "template",
           template: {
             name: "auto_listo",
             language: { code: "es_AR" },
             components: [{
               type: "body",
               parameters: [
                 { type: "text", text: order.clients.name },
                 { type: "text", text: order.vehicle_description || "" },
                 { type: "text", text: order.vehicle_plate },
                 { type: "text", text: businessName },
                 { type: "text", text: settings?.closing_time || "19:00" },
               ]
             }]
           }
         })
       }
     );

     // Log the notification
     await supabase.from("notification_log").insert({
       order_id: record.id,
       client_id: order.client_id,
       type: "auto_listo",
       channel: "whatsapp",
       phone: formattedPhone,
       status: response.ok ? "sent" : "failed",
       response_data: await response.json(),
     });

     return new Response("OK", { status: 200 });
   });
   ```

### 3.2 Agente IA de Seguimiento — Flujo

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Supabase Cron   │───▶│ Edge Function    │───▶│ Gemini API      │
│ (diario 10:00)  │    │ ai-follow-up     │    │ Personalizar    │
│                 │    │                  │    │ mensaje         │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ WhatsApp Cloud  │
                                                │ API → Cliente   │
                                                └─────────────────┘
```

**Implementación:**

1. **Supabase pg_cron** — Job diario:
   ```sql
   -- Ejecutar todos los días a las 10:00 (hora Argentina)
   SELECT cron.schedule(
     'ai-follow-up-daily',
     '0 13 * * 1-6',  -- 13:00 UTC = 10:00 AR (L-S)
     $$
     SELECT net.http_post(
       url := 'https://<project>.supabase.co/functions/v1/ai-follow-up',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

2. **Edge Function** `ai-follow-up`:
   ```typescript
   // Pseudocódigo del flujo:
   // 1. Consultar app_settings para obtener:
   //    - ai_follow_up_enabled (boolean)
   //    - follow_up_days (integer, default 15)
   //    - follow_up_max_per_day (integer, default 20)
   //    - follow_up_template (string)
   //
   // 2. Si ai_follow_up_enabled = false → return
   //
   // 3. Query: clientes cuyo último servicio fue hace > follow_up_days días
   //    AND que no tengan una notificación de follow-up en los últimos 7 días
   //    AND que tengan teléfono registrado
   //    LIMIT follow_up_max_per_day
   //
   // 4. Para cada cliente:
   //    a. (Opcional) Llamar a Gemini API para personalizar el mensaje
   //       basándose en historial del cliente
   //    b. Enviar WhatsApp con template "seguimiento"
   //    c. Registrar en notification_log
   ```

---

## 4. Tablas nuevas necesarias en Supabase

### 4.1 `app_settings` (Configuración del sistema)

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos del negocio
  business_name TEXT DEFAULT 'Mi Lavadero',
  business_address TEXT,
  business_phone TEXT,
  currency TEXT DEFAULT 'ARS',
  opening_time TEXT DEFAULT '08:00',
  closing_time TEXT DEFAULT '19:00',
  
  -- WhatsApp
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_api_token TEXT, -- Token de acceso permanente de Meta
  whatsapp_phone_id TEXT,  -- Phone Number ID de la API
  whatsapp_notify_on_ready BOOLEAN DEFAULT TRUE,
  whatsapp_ready_template TEXT DEFAULT 'auto_listo',
  
  -- Agente IA
  ai_follow_up_enabled BOOLEAN DEFAULT FALSE,
  ai_follow_up_days INTEGER DEFAULT 15,
  ai_follow_up_max_per_day INTEGER DEFAULT 20,
  ai_follow_up_template TEXT DEFAULT 'seguimiento_lavado',
  ai_gemini_api_key TEXT, -- Para personalización con Gemini
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Solo un registro
INSERT INTO app_settings (id) VALUES (gen_random_uuid());
```

### 4.2 `notification_log` (Historial de notificaciones)

```sql
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'auto_listo', 'follow_up', etc.
  channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'
  phone TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  response_data JSONB, -- Respuesta de la API de WhatsApp
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_client ON notification_log(client_id);
CREATE INDEX idx_notification_log_created ON notification_log(created_at DESC);
```

---

## 5. Cambios en la UI (Configuración)

La sección de Configuración (ya preparada en Fase 1) necesita estas tabs expandidas:

### Tab "WhatsApp"
- Toggle: **Habilitar notificaciones WhatsApp**
- Campo: **WhatsApp API Token** (campo password con botón show/hide)
- Campo: **Phone Number ID** (de Meta)
- Toggle: **Notificar cuando el auto está listo**
- Preview: Muestra cómo se verá el mensaje (con datos de ejemplo)
- Botón: **Enviar mensaje de prueba** (envía al teléfono del admin)
- Link: Instrucciones paso a paso para configurar Meta Business

### Tab "Agente IA"
- Toggle: **Activar agente de seguimiento**
- Slider: **Contactar clientes inactivos hace más de X días** (5-90, default 15)
- Input: **Máximo de mensajes por día** (1-50, default 20)
- Campo: **Gemini API Key** (para personalización)
- Preview: Muestra mensaje de ejemplo
- Tabla: **Últimos mensajes enviados** (de `notification_log`)

### Tab "Historial de Notificaciones" 
- Tabla con filtros por tipo, estado, fecha
- Muestra todas las notificaciones enviadas
- Permite ver el detalle de cada notificación (respuesta de API, si fue entregado/leído)

---

## 6. Regla de IA: Compliance con Meta (Enero 2026)

> ⚠️ **IMPORTANTE**: Desde enero 2026, Meta prohíbe chatbots de IA de propósito general en WhatsApp Business API. Solo se permite IA enfocada en tareas específicas del negocio.

Nuestro agente **SÍ cumple** porque:
- ✅ Es específico del negocio (lavadero de autos)
- ✅ Tiene resultados predecibles (mensaje de seguimiento basado en historial)
- ✅ No es un chatbot conversacional general
- ✅ Usa templates pre-aprobados (no genera texto libre por WhatsApp)

La personalización con Gemini se usa **solo para seleccionar la promoción** (ej: "10% de descuento en lavado premium" vs "2x1 en lavados básicos"), no para generar el texto del mensaje completo.

---

## 7. Roadmap de Implementación Fase 2

| Paso | Tarea | Dependencia | Tiempo Est. |
|---|---|---|---|
| 1 | Crear tablas `app_settings` y `notification_log` | Fase 1 completa | 15 min |
| 2 | Actualizar Configuración UI con tabs WhatsApp + IA | Paso 1 | 1 hora |
| 3 | Crear Edge Function `send-whatsapp` | Paso 1 | 45 min |
| 4 | Configurar Database Webhook (trigger en service_orders) | Paso 3 | 15 min |
| 5 | Probar flujo completo auto_listo | Pasos 2-4 | 30 min |
| 6 | Crear Edge Function `ai-follow-up` | Paso 1 | 1 hora |
| 7 | Configurar pg_cron job | Paso 6 | 15 min |
| 8 | (Opcional) Integrar Gemini para personalización | Paso 6 | 1 hora |
| 9 | Tab historial de notificaciones | Pasos 3-6 | 30 min |
| 10 | Testing completo E2E | Todo | 1 hora |

**Tiempo total estimado: ~6 horas**

---

## 8. Prerequisitos del Usuario

Antes de iniciar la Fase 2, el usuario (Fernando) necesita:

1. ☐ Tener una cuenta en [Meta Business Suite](https://business.facebook.com/)
2. ☐ Crear una app en [Meta for Developers](https://developers.facebook.com/)
3. ☐ Agregar el producto "WhatsApp" a la app
4. ☐ Obtener un número de teléfono para WhatsApp Business (no puede ser uno ya vinculado a WhatsApp personal)
5. ☐ Completar la verificación de negocio en Meta (~1-3 días)
6. ☐ Crear los templates de mensaje en Meta Business y esperar aprobación (~24h)
7. ☐ Obtener el **Access Token permanente** y el **Phone Number ID**
8. ☐ (Opcional) Obtener una API Key de Gemini si quiere personalización con IA
