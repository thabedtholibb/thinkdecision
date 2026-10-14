


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






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






-- supabase_vault dropped from this dump: not enabled by default on a new
-- Supabase project (opt-in via Dashboard), and nothing in this app's code
-- references the vault schema. Keeping it here would break a fresh setup
-- for no functional benefit.






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean DEFAULT false) RETURNS TABLE("action" "text", "resource_type" "text", "count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT a.action, a.resource_type, count(*)::bigint
  FROM public.audit_logs a
  WHERE a.created_at >= p_since
    AND (p_admin OR a.user_id = p_user_id)
  GROUP BY a.action, a.resource_type;
$$;


ALTER FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_criteria_parent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.parent_criteria_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.criteria p
    WHERE p.id = NEW.parent_criteria_id AND p.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'parent_criteria_id % tidak ada di case %',
      NEW.parent_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."check_criteria_parent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_dependency_criteria"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.criteria k
    WHERE k.id = NEW.from_criteria_id AND k.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'from_criteria_id % tidak ada di case %',
      NEW.from_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.criteria k
    WHERE k.id = NEW.to_criteria_id AND k.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'to_criteria_id % tidak ada di case %',
      NEW.to_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."check_dependency_criteria"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."aggregated_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "aggregation_method" character varying(20) DEFAULT 'AIJ'::character varying NOT NULL,
    "expert_count" integer NOT NULL,
    "completed_expert_count" integer NOT NULL,
    "criteria_weights" "jsonb" NOT NULL,
    "alternative_scores" "jsonb" NOT NULL,
    "recommendation" "jsonb",
    "calculated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "aggregated_results_aggregation_method_check" CHECK ((("aggregation_method")::"text" = ANY ((ARRAY['AIJ'::character varying, 'AIP'::character varying])::"text"[])))
);


ALTER TABLE "public"."aggregated_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alternatives" (
    "id" character varying(50) NOT NULL,
    "case_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."alternatives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(50) NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "resource_id" "uuid",
    "description" "text",
    "changes" "jsonb",
    "ip_address" character varying(45),
    "user_agent" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_experts" (
    "case_id" "uuid" NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "weight" numeric(10,6) DEFAULT 1.0 NOT NULL,
    "status" character varying(20) DEFAULT 'invited'::character varying NOT NULL,
    "cr" numeric(10,6),
    "invited_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp without time zone,
    "completed_at" timestamp without time zone,
    "declined_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "case_experts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['invited'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'declined'::character varying])::"text"[])))
);


ALTER TABLE "public"."case_experts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "objective" "text",
    "method" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "deadline" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp without time zone,
    "deleted_at" timestamp without time zone,
    "goal_name" "text",
    "method_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "cases_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consistency_ratios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "level_id" character varying(50) NOT NULL,
    "level_label" character varying(255) NOT NULL,
    "cr" numeric(10,6) NOT NULL,
    "weights" "jsonb",
    "calculated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."consistency_ratios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."criteria" (
    "id" character varying(50) NOT NULL,
    "case_id" "uuid" NOT NULL,
    "parent_criteria_id" character varying(50),
    "name" character varying(255) NOT NULL,
    "description" "text",
    "weight" numeric(10,6),
    "level" integer DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp without time zone,
    CONSTRAINT "criteria_level_check" CHECK (("level" >= 1)),
    CONSTRAINT "criteria_no_self_parent" CHECK ((("parent_criteria_id" IS NULL) OR (("parent_criteria_id")::"text" <> ("id")::"text")))
);


ALTER TABLE "public"."criteria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dependencies" (
    "case_id" "uuid" NOT NULL,
    "from_criteria_id" character varying(50) NOT NULL,
    "to_criteria_id" character varying(50) NOT NULL,
    "dependency_type" character varying(50) DEFAULT 'inner'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "different_criteria" CHECK ((("from_criteria_id")::"text" <> ("to_criteria_id")::"text"))
);


ALTER TABLE "public"."dependencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."judgments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "level_id" character varying(50) NOT NULL,
    "level_label" character varying(255) NOT NULL,
    "matrix" "jsonb" NOT NULL,
    "notes" "text",
    "submitted" boolean DEFAULT false,
    "saved_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "submitted_at" timestamp without time zone,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp without time zone,
    "matrix_order" "jsonb"
);


ALTER TABLE "public"."judgments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."methods" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "family" "text" NOT NULL,
    "structure_tier" "text" NOT NULL,
    "judgment_shape" "text",
    "consistency_kind" "text" NOT NULL,
    "result_shape" "text" NOT NULL,
    "max_elements" integer DEFAULT 20 NOT NULL,
    "is_selectable" boolean DEFAULT true NOT NULL,
    "derived_from" "text",
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "methods_code_format" CHECK (("code" ~ '^[A-Z][A-Z0-9_]*$'::"text")),
    CONSTRAINT "methods_consistency_check" CHECK (("consistency_kind" = ANY (ARRAY['cr'::"text", 'consensus'::"text", 'none'::"text"]))),
    CONSTRAINT "methods_derived_not_selectable" CHECK ((("derived_from" IS NULL) OR ("is_selectable" = false))),
    CONSTRAINT "methods_family_check" CHECK (("family" = ANY (ARRAY['pairwise_ratio'::"text", 'structural'::"text"]))),
    CONSTRAINT "methods_judgment_check" CHECK ((("judgment_shape" IS NULL) OR ("judgment_shape" = ANY (ARRAY['ratio_matrix'::"text", 'fuzzy_ratio_matrix'::"text", 'binary_relation_matrix'::"text", 'cross_impact_matrix'::"text"])))),
    CONSTRAINT "methods_max_elements_check" CHECK (("max_elements" > 1)),
    CONSTRAINT "methods_result_check" CHECK (("result_shape" = ANY (ARRAY['ranking'::"text", 'network_ranking'::"text", 'level_partition'::"text", 'quadrant_scatter'::"text"]))),
    CONSTRAINT "methods_tier_check" CHECK (("structure_tier" = ANY (ARRAY['two_tier'::"text", 'single_tier'::"text"])))
);


ALTER TABLE "public"."methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "read_at" timestamp without time zone,
    "related_data" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_canonical" CHECK ((("type")::"text" = ANY ((ARRAY['expert_invited'::character varying, 'expert_completed'::character varying, 'expert_submission'::character varying, 'case_published'::character varying, 'case_completed'::character varying, 'aggregation_ready'::character varying, 'judgment_reminder'::character varying, 'invitation'::character varying, 'clarity_request'::character varying])::"text"[])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "role" character varying(20) NOT NULL,
    "institution" character varying(255),
    "default_method" character varying(20),
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['creator'::character varying, 'expert'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."aggregated_results"
    ADD CONSTRAINT "aggregated_results_case_id_key" UNIQUE ("case_id");



ALTER TABLE ONLY "public"."aggregated_results"
    ADD CONSTRAINT "aggregated_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_case_id_id_key" UNIQUE ("case_id", "id");



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_pkey" PRIMARY KEY ("id", "case_id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_pkey" PRIMARY KEY ("case_id", "expert_id");



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_unique" UNIQUE ("case_id", "expert_id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_ratios_case_id_expert_id_level_id_key" UNIQUE ("case_id", "expert_id", "level_id");



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_ratios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_unique_level" UNIQUE ("case_id", "expert_id", "level_id");



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_pkey" PRIMARY KEY ("id", "case_id");



ALTER TABLE ONLY "public"."dependencies"
    ADD CONSTRAINT "dependencies_pkey" PRIMARY KEY ("case_id", "from_criteria_id", "to_criteria_id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_case_id_key" UNIQUE ("case_id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_case_id_expert_id_level_id_key" UNIQUE ("case_id", "expert_id", "level_id");



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_unique_level" UNIQUE ("case_id", "expert_id", "level_id");



ALTER TABLE ONLY "public"."methods"
    ADD CONSTRAINT "methods_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "alternatives_case_idx" ON "public"."alternatives" USING "btree" ("case_id");



CREATE INDEX "audit_logs_user_created_idx" ON "public"."audit_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "case_experts_case_idx" ON "public"."case_experts" USING "btree" ("case_id", "expert_id");



CREATE INDEX "case_experts_expert_status_idx" ON "public"."case_experts" USING "btree" ("expert_id", "status");



CREATE INDEX "cases_creator_idx" ON "public"."cases" USING "btree" ("creator_id", "deleted_at", "created_at" DESC);



CREATE INDEX "cases_name_trgm_idx" ON "public"."cases" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "consistency_case_level_idx" ON "public"."consistency_ratios" USING "btree" ("case_id", "level_id");



CREATE INDEX "criteria_case_parent_idx" ON "public"."criteria" USING "btree" ("case_id", "parent_criteria_id");



CREATE INDEX "dependencies_case_idx" ON "public"."dependencies" USING "btree" ("case_id");



CREATE INDEX "goals_case_idx" ON "public"."goals" USING "btree" ("case_id");



CREATE INDEX "idx_aggregated_results_case_id" ON "public"."aggregated_results" USING "btree" ("case_id");



CREATE INDEX "idx_aggregated_results_method" ON "public"."aggregated_results" USING "btree" ("aggregation_method");



CREATE INDEX "idx_alternatives_case_id" ON "public"."alternatives" USING "btree" ("case_id");



CREATE INDEX "idx_alternatives_deleted_at" ON "public"."alternatives" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id", "created_at" DESC);



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_case_experts_case_id" ON "public"."case_experts" USING "btree" ("case_id");



CREATE INDEX "idx_case_experts_created_at" ON "public"."case_experts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_case_experts_expert_id" ON "public"."case_experts" USING "btree" ("expert_id");



CREATE INDEX "idx_case_experts_status" ON "public"."case_experts" USING "btree" ("status");



CREATE INDEX "idx_case_experts_status_case" ON "public"."case_experts" USING "btree" ("case_id", "status");



CREATE INDEX "idx_cases_created_at" ON "public"."cases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cases_creator_id" ON "public"."cases" USING "btree" ("creator_id");



CREATE INDEX "idx_cases_creator_status" ON "public"."cases" USING "btree" ("creator_id", "status");



CREATE INDEX "idx_cases_deadline" ON "public"."cases" USING "btree" ("deadline");



CREATE INDEX "idx_cases_deleted_at" ON "public"."cases" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_cases_method" ON "public"."cases" USING "btree" ("method");



CREATE INDEX "idx_cases_status" ON "public"."cases" USING "btree" ("status");



CREATE INDEX "idx_consistency_ratios_case_expert" ON "public"."consistency_ratios" USING "btree" ("case_id", "expert_id");



CREATE INDEX "idx_consistency_ratios_case_id" ON "public"."consistency_ratios" USING "btree" ("case_id");



CREATE INDEX "idx_consistency_ratios_cr" ON "public"."consistency_ratios" USING "btree" ("cr");



CREATE INDEX "idx_consistency_ratios_expert_id" ON "public"."consistency_ratios" USING "btree" ("expert_id");



CREATE INDEX "idx_criteria_case_id" ON "public"."criteria" USING "btree" ("case_id");



CREATE INDEX "idx_criteria_deleted_at" ON "public"."criteria" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_criteria_level" ON "public"."criteria" USING "btree" ("level");



CREATE INDEX "idx_dependencies_case_id" ON "public"."dependencies" USING "btree" ("case_id");



CREATE INDEX "idx_dependencies_from" ON "public"."dependencies" USING "btree" ("from_criteria_id");



CREATE INDEX "idx_dependencies_to" ON "public"."dependencies" USING "btree" ("to_criteria_id");



CREATE INDEX "idx_goals_case_id" ON "public"."goals" USING "btree" ("case_id");



CREATE INDEX "idx_judgments_case_expert" ON "public"."judgments" USING "btree" ("case_id", "expert_id");



CREATE INDEX "idx_judgments_case_expert_submitted" ON "public"."judgments" USING "btree" ("case_id", "expert_id", "submitted");



CREATE INDEX "idx_judgments_case_id" ON "public"."judgments" USING "btree" ("case_id");



CREATE INDEX "idx_judgments_deleted_at" ON "public"."judgments" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_judgments_expert_id" ON "public"."judgments" USING "btree" ("expert_id");



CREATE INDEX "idx_judgments_level_id" ON "public"."judgments" USING "btree" ("level_id");



CREATE INDEX "idx_judgments_submitted" ON "public"."judgments" USING "btree" ("submitted");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_recipient_created" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_read" ON "public"."notifications" USING "btree" ("recipient_id", "read");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "judgments_case_expert_level_idx" ON "public"."judgments" USING "btree" ("case_id", "expert_id", "level_id");



CREATE INDEX "judgments_case_submitted_idx" ON "public"."judgments" USING "btree" ("case_id", "submitted");



CREATE INDEX "notifications_recipient_created_idx" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE UNIQUE INDEX "users_email_lower_unique" ON "public"."users" USING "btree" ("lower"(("email")::"text"));



CREATE OR REPLACE TRIGGER "criteria_parent_check" BEFORE INSERT OR UPDATE OF "parent_criteria_id", "case_id" ON "public"."criteria" FOR EACH ROW EXECUTE FUNCTION "public"."check_criteria_parent"();



CREATE OR REPLACE TRIGGER "dependency_criteria_check" BEFORE INSERT OR UPDATE OF "from_criteria_id", "to_criteria_id", "case_id" ON "public"."dependencies" FOR EACH ROW EXECUTE FUNCTION "public"."check_dependency_criteria"();



ALTER TABLE ONLY "public"."aggregated_results"
    ADD CONSTRAINT "aggregated_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."aggregated_results"
    ADD CONSTRAINT "aggregated_results_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alternatives"
    ADD CONSTRAINT "alternatives_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_expert_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."case_experts"
    ADD CONSTRAINT "case_experts_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_method_fk" FOREIGN KEY ("method") REFERENCES "public"."methods"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_ratios_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consistency_ratios"
    ADD CONSTRAINT "consistency_ratios_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dependencies"
    ADD CONSTRAINT "dependencies_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dependencies"
    ADD CONSTRAINT "dependencies_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_expert_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."judgments"
    ADD CONSTRAINT "judgments_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."methods"
    ADD CONSTRAINT "methods_derived_from_fk" FOREIGN KEY ("derived_from") REFERENCES "public"."methods"("code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_default_method_fk" FOREIGN KEY ("default_method") REFERENCES "public"."methods"("code") ON UPDATE CASCADE ON DELETE SET NULL;



-- 35 Supabase-Auth-based policies (auth.uid()) dropped from this dump by
-- decision: this app never uses Supabase Auth (custom JWT + service_role
-- bypass only, per 2025100101_rls.sql), so auth.uid() is always NULL for
-- every request this app makes and these policies were permanently inert.
-- RLS stays enabled with zero permissive policies below, matching the
-- documented deny-by-default design.



ALTER TABLE "public"."aggregated_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alternatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_experts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consistency_ratios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."criteria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dependencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."judgments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_summary"("p_user_id" "uuid", "p_since" timestamp with time zone, "p_admin" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_criteria_parent"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_criteria_parent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_criteria_parent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_dependency_criteria"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_dependency_criteria"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_dependency_criteria"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."aggregated_results" TO "anon";
GRANT ALL ON TABLE "public"."aggregated_results" TO "authenticated";
GRANT ALL ON TABLE "public"."aggregated_results" TO "service_role";



GRANT ALL ON TABLE "public"."alternatives" TO "anon";
GRANT ALL ON TABLE "public"."alternatives" TO "authenticated";
GRANT ALL ON TABLE "public"."alternatives" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."case_experts" TO "anon";
GRANT ALL ON TABLE "public"."case_experts" TO "authenticated";
GRANT ALL ON TABLE "public"."case_experts" TO "service_role";



GRANT ALL ON TABLE "public"."cases" TO "anon";
GRANT ALL ON TABLE "public"."cases" TO "authenticated";
GRANT ALL ON TABLE "public"."cases" TO "service_role";



GRANT ALL ON TABLE "public"."consistency_ratios" TO "anon";
GRANT ALL ON TABLE "public"."consistency_ratios" TO "authenticated";
GRANT ALL ON TABLE "public"."consistency_ratios" TO "service_role";



GRANT ALL ON TABLE "public"."criteria" TO "anon";
GRANT ALL ON TABLE "public"."criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."criteria" TO "service_role";



GRANT ALL ON TABLE "public"."dependencies" TO "anon";
GRANT ALL ON TABLE "public"."dependencies" TO "authenticated";
GRANT ALL ON TABLE "public"."dependencies" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."judgments" TO "anon";
GRANT ALL ON TABLE "public"."judgments" TO "authenticated";
GRANT ALL ON TABLE "public"."judgments" TO "service_role";



GRANT ALL ON TABLE "public"."methods" TO "anon";
GRANT ALL ON TABLE "public"."methods" TO "authenticated";
GRANT ALL ON TABLE "public"."methods" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



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































