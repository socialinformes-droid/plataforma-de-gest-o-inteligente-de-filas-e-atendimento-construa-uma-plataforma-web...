-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'clinic_admin', 'operator', 'viewer', 'company_manager');
CREATE TYPE public.queue_status AS ENUM ('open', 'paused', 'closed');
CREATE TYPE public.entry_status AS ENUM ('waiting', 'in_progress', 'done', 'absent');
CREATE TYPE public.priority_level AS ENUM ('normal', 'elder', 'urgent');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, clinic_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_clinic_access(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = 'super_admin' OR clinic_id = _clinic_id));
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_admin(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = 'super_admin' OR (role = 'clinic_admin' AND clinic_id = _clinic_id)));
$$;

CREATE OR REPLACE FUNCTION public.can_operate_clinic(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'super_admin' OR (clinic_id = _clinic_id AND role IN ('clinic_admin', 'operator'))));
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_duration INT NOT NULL DEFAULT 15,
  average_duration INT,
  result_visible_to_company BOOLEAN NOT NULL DEFAULT true,
  result_retention_days INT NOT NULL DEFAULT 90,
  requires_read_confirm BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_exam_types_updated BEFORE UPDATE ON public.exam_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_exam_types_clinic ON public.exam_types(clinic_id);

CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status public.queue_status NOT NULL DEFAULT 'open',
  pause_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, date)
);
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_queues_updated BEFORE UPDATE ON public.queues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_queues_clinic_date ON public.queues(clinic_id, date);

CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  ticket_number INT NOT NULL,
  client_name TEXT,
  phone TEXT,
  status public.entry_status NOT NULL DEFAULT 'waiting',
  priority public.priority_level NOT NULL DEFAULT 'normal',
  estimated_wait INT NOT NULL DEFAULT 0,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  exam_type_id UUID NOT NULL REFERENCES public.exam_types(id),
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (queue_id, ticket_number)
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_queue_entries_updated BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_queue_entries_queue ON public.queue_entries(queue_id);
CREATE INDEX idx_queue_entries_clinic ON public.queue_entries(clinic_id);
CREATE INDEX idx_queue_entries_status ON public.queue_entries(queue_id, status);

ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;

CREATE TABLE public.operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impact_minutes INT NOT NULL DEFAULT 0,
  note TEXT,
  recorded_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_op_events_queue ON public.operational_events(queue_id);

CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  actual_duration INT NOT NULL,
  day_of_week INT NOT NULL,
  time_slot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attendance_exam ON public.attendance_logs(exam_type_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_attendance_on_done()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_duration INT; v_avg INT;
BEGIN
  IF NEW.status = 'done' AND OLD.status <> 'done' AND NEW.actual_start IS NOT NULL THEN
    NEW.actual_end := COALESCE(NEW.actual_end, now());
    v_duration := GREATEST(1, EXTRACT(EPOCH FROM (NEW.actual_end - NEW.actual_start))::INT / 60);
    INSERT INTO public.attendance_logs (clinic_id, exam_type_id, started_at, finished_at, actual_duration, day_of_week, time_slot)
    VALUES (NEW.clinic_id, NEW.exam_type_id, NEW.actual_start, NEW.actual_end, v_duration,
      EXTRACT(DOW FROM NEW.actual_start)::INT, to_char(NEW.actual_start, 'HH24') || 'h');
    SELECT ROUND(AVG(actual_duration))::INT INTO v_avg FROM (
      SELECT actual_duration FROM public.attendance_logs
      WHERE exam_type_id = NEW.exam_type_id ORDER BY created_at DESC LIMIT 30) t;
    UPDATE public.exam_types SET average_duration = v_avg WHERE id = NEW.exam_type_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_log_attendance
BEFORE UPDATE ON public.queue_entries
FOR EACH ROW EXECUTE FUNCTION public.log_attendance_on_done();

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_clinic ON public.audit_logs(clinic_id, created_at DESC);

-- RLS
CREATE POLICY "super_admin all clinics" ON public.clinics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "members can view own clinic" ON public.clinics FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), id));
CREATE POLICY "clinic_admin can update own clinic" ON public.clinics FOR UPDATE TO authenticated
  USING (public.is_clinic_admin(auth.uid(), id)) WITH CHECK (public.is_clinic_admin(auth.uid(), id));

CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "clinic admins view clinic profiles" ON public.profiles FOR SELECT TO authenticated
  USING (clinic_id IS NOT NULL AND public.is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "super_admin all profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "clinic_admin manage clinic roles" ON public.user_roles FOR ALL TO authenticated
  USING (clinic_id IS NOT NULL AND public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (clinic_id IS NOT NULL AND public.is_clinic_admin(auth.uid(), clinic_id));
CREATE POLICY "super_admin all roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "members view exam types" ON public.exam_types FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "clinic_admin manage exam types" ON public.exam_types FOR ALL TO authenticated
  USING (public.is_clinic_admin(auth.uid(), clinic_id)) WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "members view queues" ON public.queues FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "operators manage queues" ON public.queues FOR ALL TO authenticated
  USING (public.can_operate_clinic(auth.uid(), clinic_id)) WITH CHECK (public.can_operate_clinic(auth.uid(), clinic_id));

CREATE POLICY "members view entries" ON public.queue_entries FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "operators manage entries" ON public.queue_entries FOR ALL TO authenticated
  USING (public.can_operate_clinic(auth.uid(), clinic_id)) WITH CHECK (public.can_operate_clinic(auth.uid(), clinic_id));

CREATE POLICY "members view events" ON public.operational_events FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "operators insert events" ON public.operational_events FOR INSERT TO authenticated
  WITH CHECK (public.can_operate_clinic(auth.uid(), clinic_id));

CREATE POLICY "members view attendance" ON public.attendance_logs FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));

CREATE POLICY "clinic_admin view audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')
    OR (clinic_id IS NOT NULL AND public.is_clinic_admin(auth.uid(), clinic_id)));

-- Public RPC for client view by token
CREATE OR REPLACE FUNCTION public.get_entry_by_token(_token TEXT)
RETURNS TABLE (
  ticket_number INT,
  status public.entry_status,
  priority public.priority_level,
  estimated_wait INT,
  exam_type_name TEXT,
  queue_position INT,
  ahead_count INT,
  clinic_name TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_entry RECORD;
BEGIN
  SELECT qe.*, et.name AS exam_name, c.name AS c_name
  INTO v_entry
  FROM public.queue_entries qe
  JOIN public.exam_types et ON et.id = qe.exam_type_id
  JOIN public.clinics c ON c.id = qe.clinic_id
  WHERE qe.public_token = _token;

  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY SELECT
    v_entry.ticket_number,
    v_entry.status,
    v_entry.priority,
    v_entry.estimated_wait,
    v_entry.exam_name::TEXT,
    (SELECT COUNT(*)::INT + 1 FROM public.queue_entries
       WHERE queue_id = v_entry.queue_id AND status = 'waiting' AND ticket_number < v_entry.ticket_number),
    (SELECT COUNT(*)::INT FROM public.queue_entries
       WHERE queue_id = v_entry.queue_id AND status = 'waiting' AND ticket_number < v_entry.ticket_number),
    v_entry.c_name::TEXT;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_entry_by_token(TEXT) TO anon, authenticated;