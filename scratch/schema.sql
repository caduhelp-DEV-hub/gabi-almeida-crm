


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agendamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hora" "text" NOT NULL,
    "cliente_nome" "text" NOT NULL,
    "cliente_avatar" "text",
    "procedimento" "text" NOT NULL,
    "status" "text" DEFAULT 'Confirmado'::"text" NOT NULL,
    "profissional" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "data" "text" DEFAULT (CURRENT_DATE)::"text" NOT NULL,
    "cliente_id" "uuid",
    "valor" numeric,
    CONSTRAINT "appointments_category_check" CHECK (("categoria" = ANY (ARRAY['Estética'::"text", 'Injetáveis'::"text", 'Consulta'::"text"]))),
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['Confirmado'::"text", 'Em Atendimento'::"text", 'Finalizado'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."agendamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "date" "text" DEFAULT (CURRENT_DATE)::"text" NOT NULL,
    "time" "text" NOT NULL,
    "patient_name" "text" NOT NULL,
    "patient_avatar" "text",
    "procedure" "text" NOT NULL,
    "status" "text" DEFAULT 'Confirmado'::"text" NOT NULL,
    "professional" "text" NOT NULL,
    "category" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "appointments_category_check1" CHECK (("category" = ANY (ARRAY['Estética'::"text", 'Injetáveis'::"text", 'Consulta'::"text"]))),
    CONSTRAINT "appointments_status_check1" CHECK (("status" = ANY (ARRAY['Confirmado'::"text", 'Em Atendimento'::"text", 'Finalizado'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "avatar" "text",
    "foto_detalhes" "text",
    "ultima_visita" "text",
    "tier" "text" DEFAULT 'Standard'::"text",
    "since" "text",
    "total_gasto" numeric DEFAULT 0,
    "qtde_procedimentos" integer DEFAULT 0,
    "data_ultima_foto" "text" DEFAULT '--'::"text",
    "status" "text" DEFAULT 'Standard'::"text",
    "alergias" "text" DEFAULT 'Nenhuma'::"text",
    "medicacoes" "text" DEFAULT 'Nenhum'::"text",
    "procedimentos_anteriores" "text" DEFAULT 'Nenhum'::"text",
    "notas_evolucao" "text" DEFAULT ''::"text",
    "foto_antes" "text",
    "foto_depois" "text",
    "historico" "jsonb" DEFAULT '[]'::"jsonb",
    "financials" "jsonb" DEFAULT '[]'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "telefone" "text",
    "cpf" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "fotos_evolucao" "jsonb" DEFAULT '[]'::"jsonb",
    "pronome" "text"
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cobrancas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "status" "text" DEFAULT 'Pago'::"text" NOT NULL,
    "valor" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['Confirmado'::"text", 'Pago'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."cobrancas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes_empresa" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" DEFAULT 'Gabi Almeida Estética Avançada'::"text" NOT NULL,
    "cnpj" "text" DEFAULT '00.000.000/0001-00'::"text" NOT NULL,
    "endereco" "text" DEFAULT 'São Paulo - SP'::"text" NOT NULL,
    "telefone" "text" DEFAULT '(11) 99999-9999'::"text" NOT NULL
);


ALTER TABLE "public"."configuracoes_empresa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."despesas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data" "text",
    "descricao" "text",
    "categoria" "text",
    "status" "text",
    "valor" numeric,
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."despesas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "min_quantity" integer DEFAULT 0 NOT NULL,
    "unit" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mensagens_pre_definidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" "text",
    "conteudo" "text",
    "gatilho" "text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mensagens_pre_definidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mensagens_predefinidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."mensagens_predefinidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "avatar" "text",
    "details_avatar" "text",
    "last_visit" "text",
    "tier" "text" DEFAULT 'Standard'::"text",
    "since" "text",
    "total_spent" numeric DEFAULT 0,
    "procedures_count" integer DEFAULT 0,
    "last_photo_date" "text" DEFAULT '--'::"text",
    "status" "text" DEFAULT 'Standard'::"text",
    "allergies" "text" DEFAULT 'Nenhuma'::"text",
    "medications" "text" DEFAULT 'Nenhum'::"text",
    "previous_procedures" "text" DEFAULT 'Nenhum'::"text",
    "evolution_notes" "text" DEFAULT ''::"text",
    "before_photo" "text",
    "after_photo" "text",
    "evolution_photos" "jsonb" DEFAULT '[]'::"jsonb",
    "timeline" "jsonb" DEFAULT '[]'::"jsonb",
    "financials" "jsonb" DEFAULT '[]'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "phone" "text",
    "cpf" "text",
    "pronoun" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "duration" "text" NOT NULL,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."servicos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "preco" numeric NOT NULL,
    "duracao" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."servicos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" DEFAULT 'Pago'::"text" NOT NULL,
    "value" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "transactions_status_check1" CHECK (("status" = ANY (ARRAY['Confirmado'::"text", 'Pago'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "username" "text" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "specialty" "text",
    "phone" "text",
    "avatar" "text",
    "commission_rate" numeric DEFAULT 0,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "password_hash" "text",
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'prestador'::"text"]))),
    CONSTRAINT "users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes_empresa"
    ADD CONSTRAINT "configuracoes_empresa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."despesas"
    ADD CONSTRAINT "despesas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mensagens_pre_definidas"
    ADD CONSTRAINT "mensagens_pre_definidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mensagens_predefinidas"
    ADD CONSTRAINT "mensagens_predefinidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servicos"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cobrancas"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey1" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated access" ON "public"."configuracoes_empresa" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated full access to appointments" ON "public"."agendamentos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to inventory" ON "public"."inventory" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to patients" ON "public"."clientes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to services" ON "public"."servicos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to transactions" ON "public"."cobrancas" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to users" ON "public"."users" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public delete access" ON "public"."mensagens_predefinidas" FOR DELETE USING (true);



CREATE POLICY "Allow public full access to appointments" ON "public"."agendamentos" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to appointments" ON "public"."appointments" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to inventory" ON "public"."inventory" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to patients" ON "public"."clientes" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to patients" ON "public"."patients" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to services" ON "public"."services" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to services" ON "public"."servicos" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to transactions" ON "public"."cobrancas" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to transactions" ON "public"."transactions" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public full access to users" ON "public"."users" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public insert access" ON "public"."mensagens_predefinidas" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read" ON "public"."configuracoes_empresa" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access" ON "public"."mensagens_predefinidas" FOR SELECT USING (true);



CREATE POLICY "Allow public update access" ON "public"."mensagens_predefinidas" FOR UPDATE USING (true);



CREATE POLICY "Public Access" ON "public"."configuracoes_empresa" USING (true) WITH CHECK (true);



CREATE POLICY "Public Access" ON "public"."despesas" USING (true) WITH CHECK (true);



ALTER TABLE "public"."agendamentos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cobrancas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuracoes_empresa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."despesas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mensagens_pre_definidas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mensagens_predefinidas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."servicos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."agendamentos" TO "anon";
GRANT ALL ON TABLE "public"."agendamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."agendamentos" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."cobrancas" TO "anon";
GRANT ALL ON TABLE "public"."cobrancas" TO "authenticated";
GRANT ALL ON TABLE "public"."cobrancas" TO "service_role";



GRANT ALL ON TABLE "public"."configuracoes_empresa" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes_empresa" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes_empresa" TO "service_role";



GRANT ALL ON TABLE "public"."despesas" TO "anon";
GRANT ALL ON TABLE "public"."despesas" TO "authenticated";
GRANT ALL ON TABLE "public"."despesas" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."mensagens_pre_definidas" TO "anon";
GRANT ALL ON TABLE "public"."mensagens_pre_definidas" TO "authenticated";
GRANT ALL ON TABLE "public"."mensagens_pre_definidas" TO "service_role";



GRANT ALL ON TABLE "public"."mensagens_predefinidas" TO "anon";
GRANT ALL ON TABLE "public"."mensagens_predefinidas" TO "authenticated";
GRANT ALL ON TABLE "public"."mensagens_predefinidas" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."servicos" TO "anon";
GRANT ALL ON TABLE "public"."servicos" TO "authenticated";
GRANT ALL ON TABLE "public"."servicos" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































