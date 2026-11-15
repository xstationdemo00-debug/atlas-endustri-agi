-- Atlas Endüstri Ağı: verified company memberships, 2026-11-15.
-- This migration contains no user data or credentials.
-- IMPORTANT: use only on the Atlas Endüstri Ağı Neon database, not Atlas Earth.
BEGIN;
CREATE SCHEMA IF NOT EXISTS atlas_app;
CREATE TABLE IF NOT EXISTS atlas_app.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES atlas_app.entity_records(id),
  invite_email text NOT NULL CHECK (invite_email=lower(btrim(invite_email)) AND char_length(invite_email) BETWEEN 5 AND 254),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','manager')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','declined','revoked')),
  invited_by_user_id text NOT NULL,
  member_auth_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  CHECK ((status='active' AND member_auth_user_id IS NOT NULL AND accepted_at IS NOT NULL) OR status<>'active')
);
CREATE UNIQUE INDEX IF NOT EXISTS atlas_company_members_unique_live
  ON atlas_app.company_members(company_id,invite_email) WHERE status IN ('invited','active');
CREATE INDEX IF NOT EXISTS atlas_company_members_user_idx ON atlas_app.company_members(member_auth_user_id);
CREATE INDEX IF NOT EXISTS atlas_company_members_email_idx ON atlas_app.company_members(invite_email);
ALTER TABLE atlas_app.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_app.company_members FORCE ROW LEVEL SECURITY;
REVOKE ALL ON atlas_app.company_members FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION atlas_app.accept_company_invitation(p_invitation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE v_user text:=auth.user_id();v_email text;v_member atlas_app.company_members%ROWTYPE;v_company atlas_app.entity_records%ROWTYPE;
BEGIN
 IF v_user IS NULL OR v_user='' THEN RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_email FROM neon_auth."user" WHERE id::text=v_user AND "emailVerified" IS TRUE AND coalesce(banned,false)=false;
 IF v_email IS NULL THEN RAISE EXCEPTION 'E-posta doğrulaması gerekli.' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_member FROM atlas_app.company_members WHERE id=p_invitation_id AND invite_email=v_email
 AND status IN ('invited','active') FOR UPDATE;
 IF NOT FOUND OR (v_member.member_auth_user_id IS NOT NULL AND v_member.member_auth_user_id<>v_user)
 THEN RAISE EXCEPTION 'Bu davete erişim yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_company FROM atlas_app.entity_records WHERE id=v_member.company_id
 AND entity_type='Company' AND status='approved' AND is_demo=FALSE
 AND legacy_source_id IS NULL AND payload->>'verification_status'='verified';
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma doğrulaması geçerli değil.' USING ERRCODE='42501'; END IF;
 IF v_member.status='invited' THEN
   UPDATE atlas_app.company_members SET status='active',member_auth_user_id=v_user,accepted_at=now() WHERE id=v_member.id;
 END IF;
 RETURN jsonb_build_object('ok',true,'status','active','company_id',v_member.company_id::text);
END
$function$;

CREATE OR REPLACE FUNCTION atlas_app.invite_company_member(p_company_id uuid, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE
 v_user text:=auth.user_id();
 v_owner_email text;
 v_email text:=lower(btrim(coalesce(p_email,'')));
 v_company atlas_app.entity_records%ROWTYPE;
 v_id uuid;
BEGIN
 IF v_user IS NULL OR v_user='' THEN RAISE EXCEPTION 'Giriş yapmalısınız.' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_owner_email FROM neon_auth."user"
 WHERE id::text=v_user AND "emailVerified" IS TRUE AND coalesce(banned,false)=false;
 IF v_owner_email IS NULL THEN RAISE EXCEPTION 'Doğrulanmış hesap gerekli.' USING ERRCODE='42501'; END IF;
 IF v_email !~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'
 OR length(v_email)>254 OR v_email=v_owner_email THEN
   RAISE EXCEPTION 'Geçerli ve farklı bir e-posta adresi gerekli.' USING ERRCODE='22023';
 END IF;
 SELECT * INTO v_company FROM atlas_app.entity_records
 WHERE id=p_company_id AND entity_type='Company' AND status='approved'
 AND payload->>'verification_status'='verified'
 AND owner_auth_user_id=v_user AND legacy_source_id IS NULL AND is_demo=FALSE
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Doğrulanmış firma sahibi olmanız gerekiyor.' USING ERRCODE='42501'; END IF;
 IF (SELECT count(*) FROM atlas_app.company_members WHERE company_id=p_company_id AND status IN ('invited','active'))>=60
 THEN RAISE EXCEPTION 'Firma üye limiti doldu.' USING ERRCODE='23514'; END IF;
 INSERT INTO atlas_app.company_members(company_id,invite_email,invited_by_user_id)
 VALUES(p_company_id,v_email,v_user) ON CONFLICT DO NOTHING RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Bu kişi için aktif veya bekleyen davet var.' USING ERRCODE='23505'; END IF;
 RETURN jsonb_build_object('ok',true,'id',v_id::text,'status','invited','email_sent',false,'message','Davet sisteme kaydedildi. Otomatik e-posta gönderilmedi.');
END
$function$;

CREATE OR REPLACE FUNCTION atlas_app.list_company_members(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE v_user text:=auth.user_id();v_email text;v_rows jsonb;
BEGIN
 IF v_user IS NULL OR v_user='' THEN RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_email FROM neon_auth."user" WHERE id::text=v_user AND "emailVerified" IS TRUE AND coalesce(banned,false)=false;
 IF v_email IS NULL THEN RAISE EXCEPTION 'E-posta doğrulaması gerekli.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM atlas_app.entity_records c WHERE c.id=p_company_id AND c.entity_type='Company'
 AND c.status='approved' AND c.legacy_source_id IS NULL AND c.is_demo=FALSE AND c.owner_auth_user_id=v_user)
 THEN
   RAISE EXCEPTION 'Bu firmanın üye listesine erişim yetkiniz yok.' USING ERRCODE='42501';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',m.id::text,'company_id',m.company_id::text,
 'email',m.invite_email,'role',m.role,'status',m.status) ORDER BY m.created_at DESC),'[]'::jsonb)
 INTO v_rows FROM atlas_app.company_members m WHERE m.company_id=p_company_id AND m.status IN ('invited','active');
 RETURN v_rows;
END
$function$;

CREATE OR REPLACE FUNCTION atlas_app.my_company_invitations()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE v_user text:=auth.user_id();v_email text;v_result jsonb;
BEGIN
 IF v_user IS NULL OR v_user='' THEN RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_email FROM neon_auth."user" WHERE id::text=v_user AND "emailVerified" IS TRUE AND coalesce(banned,false)=false;
 IF v_email IS NULL THEN RAISE EXCEPTION 'E-posta doğrulaması gerekli.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'id',m.id::text,'company_id',m.company_id::text,
 'company_name',left(c.payload->>'name',160),'role',m.role,'status',m.status,
 'company',jsonb_build_object(
  'id',c.id::text,'name',left(c.payload->>'name',160),
  'type',c.payload->>'type','city',left(c.payload->>'city',100),
  'about',left(c.payload->>'about',400),
  'trades',CASE WHEN jsonb_typeof(c.payload->'trades')='array' THEN c.payload->'trades' ELSE '[]'::jsonb END,
  'verification_status',c.payload->>'verification_status',
  'created_by_id',c.owner_auth_user_id
 )) ORDER BY m.created_at DESC),'[]'::jsonb) INTO v_result
 FROM atlas_app.company_members m
 JOIN atlas_app.entity_records c ON c.id=m.company_id
 WHERE m.invite_email=v_email AND m.status IN ('invited','active')
 AND (m.member_auth_user_id IS NULL OR m.member_auth_user_id=v_user)
 AND c.entity_type='Company' AND c.status='approved' AND c.is_demo=FALSE
 AND c.legacy_source_id IS NULL;
 RETURN v_result;
END
$function$;

REVOKE ALL ON FUNCTION atlas_app.invite_company_member(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION atlas_app.invite_company_member(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION atlas_app.my_company_invitations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION atlas_app.my_company_invitations() TO authenticated;
REVOKE ALL ON FUNCTION atlas_app.accept_company_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION atlas_app.accept_company_invitation(uuid) TO authenticated;
REVOKE ALL ON FUNCTION atlas_app.list_company_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION atlas_app.list_company_members(uuid) TO authenticated;
COMMIT;
