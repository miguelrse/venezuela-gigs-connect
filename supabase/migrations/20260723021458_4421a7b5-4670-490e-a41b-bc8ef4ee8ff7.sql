
-- 1) Endurecer trigger de creación de usuarios: nunca aceptar admin desde signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _requested TEXT;
    _role app_role;
    _full_name TEXT;
BEGIN
    _requested := NEW.raw_user_meta_data->>'role';
    _role := CASE
        WHEN _requested = 'specialist' THEN 'specialist'::app_role
        ELSE 'client'::app_role
    END;
    _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');

    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, _full_name)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 2) Un rol por usuario (no hay duplicados actualmente)
ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 3) user_roles: los usuarios normales NO pueden escribir su rol.
--    Solo el trigger (SECURITY DEFINER) o un admin pueden hacerlo.
--    Las políticas existentes ya no otorgan INSERT/UPDATE/DELETE a usuarios normales,
--    pero revocamos privilegios de tabla para bloquear cualquier escritura desde
--    postgrest bajo roles anon/authenticated.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 4) Payments: quitar la política que permitía a clientes escribir en payments.
--    Solo lectura para participantes; escritura reservada a service_role/admin.
DROP POLICY IF EXISTS "Clients can manage payments on own contracts" ON public.payments;

REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
