-- Atlas Endustri Agi — verified-account support workflows.
-- Extracted from deployed Neon definitions on 2026-11-15; contains no customer records or credentials.
-- Run on the Atlas Endustri Agi project only. Do not run against Atlas Earth.
CREATE SCHEMA IF NOT EXISTS atlas_app;

CREATE TABLE IF NOT EXISTS atlas_app.support_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_code text UNIQUE NOT NULL,
 owner_auth_user_id text NOT NULL,
 name text NOT NULL,
 company_name text NOT NULL DEFAULT '',
 contact_email text NOT NULL,
 phone text NOT NULL DEFAULT '',
 category text NOT NULL,
 subject text NOT NULL,
 description text NOT NULL,
 callback_requested boolean NOT NULL DEFAULT false,
 consent_confirmed boolean NOT NULL,
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','triaging','awaiting_details','referred','resolved','closed')),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
 assigned_group text NOT NULL DEFAULT 'platform',
 internal_note text NOT NULL DEFAULT '',
 is_demo boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE atlas_app.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_app.support_tickets FORCE ROW LEVEL SECURITY;
REVOKE ALL ON atlas_app.support_tickets FROM PUBLIC, anonymous;
GRANT USAGE ON SCHEMA atlas_app TO authenticated;
GRANT SELECT(id,ticket_code,owner_auth_user_id,name,company_name,contact_email,phone,
 category,subject,description,callback_requested,consent_confirmed,status,
 created_at,updated_at) ON atlas_app.support_tickets TO authenticated;
DO $setup$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='atlas_app'
   AND tablename='support_tickets' AND policyname='atlas_support_owner_read') THEN
   CREATE POLICY atlas_support_owner_read ON atlas_app.support_tickets
     FOR SELECT TO authenticated USING (owner_auth_user_id=(SELECT auth.user_id()));
 END IF;
END;$setup$;
CREATE INDEX IF NOT EXISTS atlas_support_owner_created ON atlas_app.support_tickets(owner_auth_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_support_created ON atlas_app.support_tickets(created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_app.support_ticket_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES atlas_app.support_tickets(id),
 actor_auth_user_id text NOT NULL,
 old_status text,
 new_status text,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON atlas_app.support_ticket_events FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION atlas_app.submit_my_support_ticket(p_name text, p_company_name text, p_phone text, p_category text, p_subject text, p_description text, p_callback_requested boolean, p_consent_confirmed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE
 v_user text:=auth.user_id();
 v_email text;
 v_name text:=btrim(COALESCE(p_name,''));
 v_subject text:=btrim(COALESCE(p_subject,''));
 v_description text:=btrim(COALESCE(p_description,''));
 v_id uuid;
 v_code text;
BEGIN
 IF v_user IS NULL OR v_user='' THEN RAISE EXCEPTION 'Doğrulanmış hesap gerekli' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_email FROM neon_auth."user"
 WHERE id::text=v_user AND "emailVerified"=TRUE AND COALESCE(banned,FALSE)=FALSE;
 IF v_email IS NULL THEN RAISE EXCEPTION 'E-posta doğrulanmalı' USING ERRCODE='42501'; END IF;
 IF p_consent_confirmed IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Gizlilik onayı gerekli' USING ERRCODE='22023'; END IF;
 IF char_length(v_name)<2 OR char_length(v_name)>100 OR
    char_length(v_subject)<5 OR char_length(v_subject)>140 OR
    char_length(v_description)<25 OR char_length(v_description)>2500 OR
    char_length(COALESCE(p_company_name,''))>140 OR char_length(COALESCE(p_phone,''))>35
 THEN RAISE EXCEPTION 'Destek formu alanları geçersiz' USING ERRCODE='22023'; END IF;
 IF p_category NOT IN ('platform_help','project_process','supplier_matching','offer_contract','membership','international','billing','worker_rights','other')
 THEN RAISE EXCEPTION 'Destek kategorisi geçersiz' USING ERRCODE='22023'; END IF;
 IF p_callback_requested IS TRUE AND char_length(btrim(COALESCE(p_phone,'')))<7
 THEN RAISE EXCEPTION 'Geri arama için telefon gerekli' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM atlas_app.support_tickets WHERE owner_auth_user_id=v_user AND created_at>now()-interval '24 hours')>=3
 THEN RAISE EXCEPTION 'Günlük destek talebi sınırı doldu' USING ERRCODE='P0001'; END IF;
 IF EXISTS(SELECT 1 FROM atlas_app.support_tickets WHERE owner_auth_user_id=v_user AND
    subject=v_subject AND description=v_description AND created_at>now()-interval '30 minutes')
 THEN RAISE EXCEPTION 'Talep daha önce kaydedildi' USING ERRCODE='23505'; END IF;
 v_code:='ATD-'||to_char(now() AT TIME ZONE 'Europe/Istanbul','YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 INSERT INTO atlas_app.support_tickets(ticket_code,owner_auth_user_id,name,company_name,contact_email,phone,category,subject,description,callback_requested,consent_confirmed)
 VALUES(v_code,v_user,v_name,btrim(COALESCE(p_company_name,'')),v_email,btrim(COALESCE(p_phone,'')),p_category,v_subject,v_description,COALESCE(p_callback_requested,FALSE),TRUE)
 RETURNING id INTO v_id;
 RETURN jsonb_build_object('ok',TRUE,'ticket_code',v_code,'id',v_id);
END;$function$

CREATE OR REPLACE FUNCTION atlas_app.admin_list_support_tickets(p_limit integer DEFAULT 200)
 RETURNS SETOF atlas_app.support_tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
BEGIN
 IF (atlas_app.current_member_role()->>'role')<>'admin'
 THEN RAISE EXCEPTION 'Yönetici yetkisi gerekli' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT * FROM atlas_app.support_tickets ORDER BY created_at DESC LIMIT least(greatest(COALESCE(p_limit,200),1),200);
END;$function$

CREATE OR REPLACE FUNCTION atlas_app.admin_update_support_ticket(p_id uuid, p_status text, p_priority text, p_assigned_group text, p_internal_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'atlas_app', 'pg_temp'
AS $function$
DECLARE v_old text; v_user text:=auth.user_id();
BEGIN
 IF (atlas_app.current_member_role()->>'role')<>'admin'
 THEN RAISE EXCEPTION 'Yönetici yetkisi gerekli' USING ERRCODE='42501'; END IF;
 IF p_status NOT IN ('new','triaging','awaiting_details','referred','resolved','closed') OR
    p_priority NOT IN ('low','normal','high') OR
    p_assigned_group NOT IN ('platform','commercial','technical_partner','legal_partner','finance_partner') OR
    char_length(COALESCE(p_internal_note,''))>2500
 THEN RAISE EXCEPTION 'Destek güncellemesi geçersiz' USING ERRCODE='22023'; END IF;
 SELECT status INTO v_old FROM atlas_app.support_tickets WHERE id=p_id FOR UPDATE;
 IF v_old IS NULL THEN RAISE EXCEPTION 'Destek kaydı bulunamadı' USING ERRCODE='P0002'; END IF;
 UPDATE atlas_app.support_tickets SET status=p_status,priority=p_priority,
    assigned_group=p_assigned_group,internal_note=COALESCE(p_internal_note,''),updated_at=NOW()
 WHERE id=p_id;
 INSERT INTO atlas_app.support_ticket_events(ticket_id,actor_auth_user_id,old_status,new_status)
 VALUES(p_id,v_user,v_old,p_status);
 RETURN jsonb_build_object('ok',TRUE,'id',p_id,'status',p_status);
END;$function$

REVOKE ALL ON FUNCTION atlas_app.submit_my_support_ticket(text,text,text,text,text,text,boolean,boolean) FROM PUBLIC,anonymous;
REVOKE ALL ON FUNCTION atlas_app.admin_list_support_tickets(integer) FROM PUBLIC,anonymous;
REVOKE ALL ON FUNCTION atlas_app.admin_update_support_ticket(uuid,text,text,text,text) FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION atlas_app.submit_my_support_ticket(text,text,text,text,text,text,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION atlas_app.admin_list_support_tickets(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION atlas_app.admin_update_support_ticket(uuid,text,text,text,text) TO authenticated;
