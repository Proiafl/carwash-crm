-- Desactivar la confirmación de email para nuevos usuarios
-- Esto permite que los usuarios puedan iniciar sesión inmediatamente después de registrarse

-- Nota: Esta configuración se aplica a nivel de proyecto en Supabase
-- Para desactivar la confirmación de email, debes ir al Dashboard de Supabase:
-- Authentication > Providers > Email > Desactivar "Confirm email"

-- Mientras tanto, podemos confirmar manualmente los usuarios existentes:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Este archivo es solo documentación de la configuración necesaria
