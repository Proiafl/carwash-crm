-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  plate TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_types table (catalog of services)
CREATE TABLE public.service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_records table (actual services performed)
CREATE TABLE public.service_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  service_type_id UUID REFERENCES public.service_types(id) NOT NULL,
  employee_id UUID REFERENCES auth.users(id),
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unidad',
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_movements table
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'consumption', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated (admin or employee)
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clients (all authenticated can CRUD)
CREATE POLICY "Authenticated can view clients" ON public.clients FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated can insert clients" ON public.clients FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated can update clients" ON public.clients FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated can delete clients" ON public.clients FOR DELETE USING (public.is_authenticated());

-- RLS Policies for vehicles
CREATE POLICY "Authenticated can view vehicles" ON public.vehicles FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated can update vehicles" ON public.vehicles FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated can delete vehicles" ON public.vehicles FOR DELETE USING (public.is_authenticated());

-- RLS Policies for service_types
CREATE POLICY "Authenticated can view service_types" ON public.service_types FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Admins can insert service_types" ON public.service_types FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update service_types" ON public.service_types FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete service_types" ON public.service_types FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for service_records
CREATE POLICY "Authenticated can view service_records" ON public.service_records FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated can insert service_records" ON public.service_records FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated can update service_records" ON public.service_records FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Admins can delete service_records" ON public.service_records FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory
CREATE POLICY "Authenticated can view inventory" ON public.inventory FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Admins can insert inventory" ON public.inventory FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update inventory" ON public.inventory FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete inventory" ON public.inventory FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory_movements
CREATE POLICY "Authenticated can view inventory_movements" ON public.inventory_movements FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated can insert inventory_movements" ON public.inventory_movements FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Admins can delete inventory_movements" ON public.inventory_movements FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for expenses
CREATE POLICY "Authenticated can view expenses" ON public.expenses FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Admins can insert expenses" ON public.expenses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update expenses" ON public.expenses FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default service types
INSERT INTO public.service_types (name, description, price, estimated_minutes) VALUES
  ('Lavado Básico', 'Lavado exterior con jabón y secado', 50.00, 20),
  ('Lavado Completo', 'Lavado exterior e interior, aspirado', 100.00, 40),
  ('Lavado Premium', 'Lavado completo con encerado y aromatizante', 150.00, 60),
  ('Detailing Exterior', 'Pulido, encerado y protección completa', 300.00, 120),
  ('Detailing Interior', 'Limpieza profunda de tapicería y tratamiento', 250.00, 90),
  ('Lavado de Motor', 'Limpieza y desengrase del motor', 80.00, 30);