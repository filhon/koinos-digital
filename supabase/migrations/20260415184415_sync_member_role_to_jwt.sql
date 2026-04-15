-- Trigger: sincroniza members.role → auth.users.raw_app_meta_data
-- Garante que o JWT reflete o role atualizado sem depender apenas da Server Action

CREATE OR REPLACE FUNCTION sync_member_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role)
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_sync_role_to_auth
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION sync_member_role_to_auth();
