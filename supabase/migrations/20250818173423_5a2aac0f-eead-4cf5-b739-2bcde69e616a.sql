-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- Create employee status enum
CREATE TYPE employee_status AS ENUM ('active', 'inactive');

-- Create task type enum
CREATE TYPE task_type AS ENUM ('warehouse', 'logistics', 'maintenance', 'administrative');

-- Create work status enum
CREATE TYPE work_status AS ENUM ('in_progress', 'completed', 'pending_approval', 'approved');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  employee_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hourly_rate NUMERIC(10,2),
  status employee_status NOT NULL DEFAULT 'active',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  estimated_hours NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_hours table
CREATE TABLE public.work_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  task_id UUID NOT NULL REFERENCES public.tasks(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  break_time_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(10,2),
  notes TEXT,
  status work_status NOT NULL DEFAULT 'in_progress',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for departments
CREATE POLICY "Everyone can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for employees
CREATE POLICY "Users can view their own employee record" ON public.employees
  FOR SELECT USING (
    profile_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Everyone can view active tasks" ON public.tasks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for work_hours
CREATE POLICY "Users can view their own work hours" ON public.work_hours
  FOR SELECT USING (
    employee_id = (
      SELECT e.id FROM public.employees e
      JOIN public.profiles p ON e.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own work hours" ON public.work_hours
  FOR INSERT WITH CHECK (
    employee_id = (
      SELECT e.id FROM public.employees e
      JOIN public.profiles p ON e.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own work hours" ON public.work_hours
  FOR UPDATE USING (
    employee_id = (
      SELECT e.id FROM public.employees e
      JOIN public.profiles p ON e.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all work hours" ON public.work_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all work hours" ON public.work_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_hours_updated_at
  BEFORE UPDATE ON public.work_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    employee_num TEXT;
BEGIN
    -- Generate employee number
    employee_num := 'EMP' || LPAD(EXTRACT(EPOCH FROM now())::TEXT, 10, '0');
    
    -- Insert profile
    INSERT INTO public.profiles (
        user_id, 
        email, 
        first_name, 
        last_name, 
        role,
        employee_number
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'employee'),
        employee_num
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample departments
INSERT INTO public.departments (name, description) VALUES
  ('Warehouse', 'Magazijn operaties en voorraadbeheer'),
  ('Logistics', 'Transport en distributie'),
  ('Maintenance', 'Onderhoud en reparaties'),
  ('Administration', 'Administratieve taken');

-- Insert sample tasks
INSERT INTO public.tasks (name, description, type, estimated_hours) VALUES
  ('Voorraad Tellen', 'Inventarisatie van magazijnvoorraad', 'warehouse', 4.0),
  ('Goederen Ontvangen', 'Inkomende goederen controleren en opslaan', 'warehouse', 2.0),
  ('Orderpicking', 'Orders verzamelen en klaarmaken', 'warehouse', 1.5),
  ('Transport Planning', 'Routes plannen en optimaliseren', 'logistics', 3.0),
  ('Levering Uitvoeren', 'Goederen afleveren bij klanten', 'logistics', 6.0),
  ('Equipment Onderhoud', 'Preventief onderhoud machines', 'maintenance', 4.0),
  ('Administratie', 'Algemene administratieve werkzaamheden', 'administrative', 2.0);