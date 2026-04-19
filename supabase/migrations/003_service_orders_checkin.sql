-- Migration: Add fields for QR Check-in System
-- Description: Adds delivery_preference and payment_status to service_orders table

ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS delivery_preference TEXT DEFAULT 'wait_onsite';
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_delivery_preference') THEN
        ALTER TABLE service_orders ADD CONSTRAINT check_delivery_preference CHECK (delivery_preference IN ('wait_onsite', 'pickup_later'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_status') THEN
        ALTER TABLE service_orders ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'paid'));
    END IF;
END $$;
