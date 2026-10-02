CREATE TABLE "patients_patients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"document_type" varchar(4) NOT NULL,
	"document_number" varchar(20) NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"first_last_name" text NOT NULL,
	"second_last_name" text,
	"birth_date" date NOT NULL,
	"sex" char(1) NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(16),
	"address" text,
	"eps" text,
	"regime" varchar(16) NOT NULL,
	"search_text" text NOT NULL,
	"version" integer NOT NULL,
	"registered_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_trace_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"position" bigserial NOT NULL,
	"team_id" uuid NOT NULL,
	"patient_id" uuid,
	"type" varchar(64) NOT NULL,
	"requested_by" text NOT NULL,
	"executed_by" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "shared_trace_events_position_unique" UNIQUE("position")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "patients_patients_team_document_uq" ON "patients_patients" USING btree ("team_id","document_type","document_number");--> statement-breakpoint
CREATE INDEX "patients_patients_team_name_idx" ON "patients_patients" USING btree ("team_id","first_last_name","first_name");--> statement-breakpoint
CREATE INDEX "shared_trace_events_team_patient_idx" ON "shared_trace_events" USING btree ("team_id","patient_id","occurred_at");--> statement-breakpoint
CREATE INDEX "shared_trace_events_unpublished_idx" ON "shared_trace_events" USING btree ("position") WHERE "shared_trace_events"."published_at" is null;