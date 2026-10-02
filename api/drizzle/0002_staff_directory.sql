CREATE TABLE "staff_memberships" (
	"team_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"provider_role" varchar(64) NOT NULL,
	"clinical_role" varchar(32),
	"source_updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "staff_memberships_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" text,
	"email_masked" text,
	"source_updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "staff_memberships_user_id_idx" ON "staff_memberships" USING btree ("user_id");