-- Tabla de órdenes de servicio (el corazón operativo del lavadero)
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Cliente y vehículo
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_description TEXT, -- "Toyota Hilux Blanco" para referencia rápida
  
  -- Servicio
  service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Asignación
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Estado: queued → in_progress → ready → delivered → cancelled
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'ready', 'delivered', 'cancelled')),
  
  -- Timestamps del flujo
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notas
  notes TEXT,
  
  -- Descuento de inventario aplicado
  inventory_deducted BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_client ON service_orders(client_id);
CREATE INDEX idx_service_orders_date ON service_orders(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service_orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service_orders"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_orders"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
