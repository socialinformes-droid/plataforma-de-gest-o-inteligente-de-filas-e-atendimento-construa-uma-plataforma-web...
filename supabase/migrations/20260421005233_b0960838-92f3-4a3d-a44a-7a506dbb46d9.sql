
-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text NOT NULL,
  cnpj text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view companies" ON public.companies FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "clinic_admin manage companies" ON public.companies FOR ALL TO authenticated
  USING (public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COLLABORATORS ============
CREATE TABLE public.collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  cpf text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view collaborators" ON public.collaborators FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "clinic_admin manage collaborators" ON public.collaborators FOR ALL TO authenticated
  USING (public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

-- ============ COLLABORATOR_TOKENS ============
CREATE TABLE public.collaborator_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_revoked boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collaborator_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view tokens" ON public.collaborator_tokens FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "clinic_admin manage tokens" ON public.collaborator_tokens FOR ALL TO authenticated
  USING (public.is_clinic_admin(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_admin(auth.uid(), clinic_id));

-- ============ APPOINTMENTS ============
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  collaborator_id uuid REFERENCES public.collaborators(id) ON DELETE SET NULL,
  exam_type_id uuid NOT NULL REFERENCES public.exam_types(id),
  scheduled_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  check_in timestamptz,
  check_out timestamptz,
  queue_entry_id uuid REFERENCES public.queue_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_clinic_date ON public.appointments(clinic_id, scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_clinic_access(auth.uid(), clinic_id));
CREATE POLICY "operators manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (public.can_operate_clinic(auth.uid(), clinic_id))
  WITH CHECK (public.can_operate_clinic(auth.uid(), clinic_id));

CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FUNCTIONS ============

-- Token público do colaborador retorna seus dados + agendamentos
CREATE OR REPLACE FUNCTION public.get_collaborator_by_token(_token text)
RETURNS TABLE(
  collaborator_id uuid,
  collaborator_name text,
  company_name text,
  clinic_id uuid,
  clinic_name text,
  token_valid boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_t RECORD;
BEGIN
  SELECT ct.*, c.name AS col_name, comp.name AS comp_name, cl.name AS clin_name
  INTO v_t
  FROM public.collaborator_tokens ct
  JOIN public.collaborators c ON c.id = ct.collaborator_id
  JOIN public.companies comp ON comp.id = c.company_id
  JOIN public.clinics cl ON cl.id = ct.clinic_id
  WHERE ct.token = _token;

  IF NOT FOUND THEN RETURN; END IF;
  RETURN QUERY SELECT v_t.collaborator_id, v_t.col_name::text, v_t.comp_name::text, v_t.clinic_id, v_t.clin_name::text,
    (NOT v_t.is_revoked AND v_t.expires_at > now());
END $$;

-- Ocupação por faixa horária do dia (8h às 18h)
CREATE OR REPLACE FUNCTION public.get_day_occupancy(_clinic_id uuid, _date date)
RETURNS TABLE(slot text, hour_start int, count int, level text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (SELECT generate_series(8, 17) AS h),
  counts AS (
    SELECT EXTRACT(HOUR FROM scheduled_at)::int AS h, COUNT(*)::int AS c
    FROM public.appointments
    WHERE clinic_id = _clinic_id
      AND scheduled_at::date = _date
      AND status NOT IN ('cancelled', 'no_show')
    GROUP BY 1
  )
  SELECT
    LPAD(hours.h::text, 2, '0') || 'h' AS slot,
    hours.h,
    COALESCE(counts.c, 0) AS count,
    CASE
      WHEN COALESCE(counts.c, 0) = 0 THEN 'livre'
      WHEN COALESCE(counts.c, 0) <= 3 THEN 'livre'
      WHEN COALESCE(counts.c, 0) <= 6 THEN 'moderado'
      ELSE 'cheio'
    END AS level
  FROM hours LEFT JOIN counts ON counts.h = hours.h
  ORDER BY hours.h;
END $$;

-- Sugere 3 melhores horários (menor ocupação) para uma data
CREATE OR REPLACE FUNCTION public.suggest_best_slots(_clinic_id uuid, _date date)
RETURNS TABLE(slot_time timestamptz, hour_start int, count int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH occ AS (SELECT * FROM public.get_day_occupancy(_clinic_id, _date))
  SELECT (_date::timestamp + (occ.hour_start || ' hours')::interval)::timestamptz, occ.hour_start, occ.count
  FROM occ
  ORDER BY occ.count ASC, occ.hour_start ASC
  LIMIT 3;
END $$;
