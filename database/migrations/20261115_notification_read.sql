-- Atlas Endüstri Ağı user-owned notification read state.
-- No real notifications, user data, or credentials are included.
BEGIN;
CREATE OR REPLACE FUNCTION atlas_app.mark_my_notifications(p_notification_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE
 v_user text:=auth.user_id();
 v_count integer:=0;
BEGIN
 IF v_user IS NULL OR v_user='' THEN
  RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user"
 WHERE id::text=v_user AND "emailVerified" IS TRUE AND coalesce(banned,false)=FALSE) THEN
  RAISE EXCEPTION 'Doğrulanmış kullanıcı gerekli.' USING ERRCODE='42501';
 END IF;
 UPDATE atlas_app.entity_records
 SET payload=jsonb_set(payload,'{is_read}','true'::jsonb,true),updated_at=now()
 WHERE entity_type='Notification' AND owner_auth_user_id=v_user
 AND legacy_source_id IS NULL AND is_demo=FALSE
 AND status='active' AND coalesce(payload->>'is_read','false')<>'true'
 AND (p_notification_id IS NULL OR id=p_notification_id);
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN jsonb_build_object('ok',TRUE,'updated',v_count);
END
$function$;
REVOKE ALL ON FUNCTION atlas_app.mark_my_notifications(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION atlas_app.mark_my_notifications(uuid) TO authenticated;
COMMIT;
