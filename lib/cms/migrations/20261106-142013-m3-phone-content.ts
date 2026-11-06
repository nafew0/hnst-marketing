import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_phone_notes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__phone_notes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_phone_notifications_trigger" AS ENUM('lock-first-visit', 'home-idle', 'left-packages', 'photo-taken', 'booking-queued', 'booking-confirmed', 'wall-sent', 'ebook-ready');
  CREATE TYPE "public"."enum_site_settings_phone_notifications_app" AS ENUM('honest', 'calendar', 'camera', 'packages', 'how-it-works', 'about', 'marketer', 'instagram', 'x', 'youtube', 'tiktok', 'linkedin', 'photos', 'browser', 'notes', 'mail');
  CREATE TYPE "public"."enum__site_settings_v_version_phone_notifications_trigger" AS ENUM('lock-first-visit', 'home-idle', 'left-packages', 'photo-taken', 'booking-queued', 'booking-confirmed', 'wall-sent', 'ebook-ready');
  CREATE TYPE "public"."enum__site_settings_v_version_phone_notifications_app" AS ENUM('honest', 'calendar', 'camera', 'packages', 'how-it-works', 'about', 'marketer', 'instagram', 'x', 'youtube', 'tiktok', 'linkedin', 'photos', 'browser', 'notes', 'mail');
  CREATE TABLE "phone_notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_phone_notes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_phone_notes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_body" jsonb,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__phone_notes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "site_settings_phone_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"trigger" "enum_site_settings_phone_notifications_trigger",
  	"app" "enum_site_settings_phone_notifications_app",
  	"title" varchar,
  	"body" varchar,
  	"enabled" boolean DEFAULT false
  );
  
  CREATE TABLE "_site_settings_v_version_phone_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"trigger" "enum__site_settings_v_version_phone_notifications_trigger",
  	"app" "enum__site_settings_v_version_phone_notifications_app",
  	"title" varchar,
  	"body" varchar,
  	"enabled" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "phone_notes_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "phone_approved" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "phone_lock_screen" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "phone_widgets_next_call_title" varchar DEFAULT 'Next free call';
  ALTER TABLE "site_settings" ADD COLUMN "phone_widgets_next_call_empty" varchar DEFAULT 'See the calendar for times.';
  ALTER TABLE "site_settings" ADD COLUMN "phone_widgets_install_title" varchar DEFAULT 'Add to Home Screen';
  ALTER TABLE "site_settings" ADD COLUMN "phone_widgets_install_body" varchar DEFAULT 'Keep HONEST on your phone, one tap away.';
  ALTER TABLE "site_settings" ADD COLUMN "phone_camera_frame_text" varchar DEFAULT 'HONEST';
  ALTER TABLE "site_settings" ADD COLUMN "phone_wall_consent_text" varchar DEFAULT 'Show my photo on the HONEST wall. I can ask for it to be removed at any time.';
  ALTER TABLE "site_settings" ADD COLUMN "phone_wall_rules_href" varchar DEFAULT '/legal/wall-rules';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_approved" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_lock_screen" boolean DEFAULT true;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_widgets_next_call_title" varchar DEFAULT 'Next free call';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_widgets_next_call_empty" varchar DEFAULT 'See the calendar for times.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_widgets_install_title" varchar DEFAULT 'Add to Home Screen';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_widgets_install_body" varchar DEFAULT 'Keep HONEST on your phone, one tap away.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_camera_frame_text" varchar DEFAULT 'HONEST';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_wall_consent_text" varchar DEFAULT 'Show my photo on the HONEST wall. I can ask for it to be removed at any time.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_phone_wall_rules_href" varchar DEFAULT '/legal/wall-rules';
  ALTER TABLE "_phone_notes_v" ADD CONSTRAINT "_phone_notes_v_parent_id_phone_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."phone_notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_phone_notifications" ADD CONSTRAINT "site_settings_phone_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_phone_notifications" ADD CONSTRAINT "_site_settings_v_version_phone_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "phone_notes_updated_at_idx" ON "phone_notes" USING btree ("updated_at");
  CREATE INDEX "phone_notes_created_at_idx" ON "phone_notes" USING btree ("created_at");
  CREATE INDEX "phone_notes__status_idx" ON "phone_notes" USING btree ("_status");
  CREATE INDEX "_phone_notes_v_parent_idx" ON "_phone_notes_v" USING btree ("parent_id");
  CREATE INDEX "_phone_notes_v_version_version_updated_at_idx" ON "_phone_notes_v" USING btree ("version_updated_at");
  CREATE INDEX "_phone_notes_v_version_version_created_at_idx" ON "_phone_notes_v" USING btree ("version_created_at");
  CREATE INDEX "_phone_notes_v_version_version__status_idx" ON "_phone_notes_v" USING btree ("version__status");
  CREATE INDEX "_phone_notes_v_created_at_idx" ON "_phone_notes_v" USING btree ("created_at");
  CREATE INDEX "_phone_notes_v_updated_at_idx" ON "_phone_notes_v" USING btree ("updated_at");
  CREATE INDEX "_phone_notes_v_latest_idx" ON "_phone_notes_v" USING btree ("latest");
  CREATE INDEX "site_settings_phone_notifications_order_idx" ON "site_settings_phone_notifications" USING btree ("_order");
  CREATE INDEX "site_settings_phone_notifications_parent_id_idx" ON "site_settings_phone_notifications" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_phone_notifications_order_idx" ON "_site_settings_v_version_phone_notifications" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_phone_notifications_parent_id_idx" ON "_site_settings_v_version_phone_notifications" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_phone_notes_fk" FOREIGN KEY ("phone_notes_id") REFERENCES "public"."phone_notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_phone_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("phone_notes_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "phone_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_phone_notes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_phone_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_phone_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_phone_notes_fk";
  DROP TABLE "phone_notes" CASCADE;
  DROP TABLE "_phone_notes_v" CASCADE;
  DROP TABLE "site_settings_phone_notifications" CASCADE;
  DROP TABLE "_site_settings_v_version_phone_notifications" CASCADE;
  
  DROP INDEX "payload_locked_documents_rels_phone_notes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "phone_notes_id";
  ALTER TABLE "site_settings" DROP COLUMN "phone_approved";
  ALTER TABLE "site_settings" DROP COLUMN "phone_lock_screen";
  ALTER TABLE "site_settings" DROP COLUMN "phone_widgets_next_call_title";
  ALTER TABLE "site_settings" DROP COLUMN "phone_widgets_next_call_empty";
  ALTER TABLE "site_settings" DROP COLUMN "phone_widgets_install_title";
  ALTER TABLE "site_settings" DROP COLUMN "phone_widgets_install_body";
  ALTER TABLE "site_settings" DROP COLUMN "phone_camera_frame_text";
  ALTER TABLE "site_settings" DROP COLUMN "phone_wall_consent_text";
  ALTER TABLE "site_settings" DROP COLUMN "phone_wall_rules_href";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_approved";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_lock_screen";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_widgets_next_call_title";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_widgets_next_call_empty";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_widgets_install_title";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_widgets_install_body";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_camera_frame_text";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_wall_consent_text";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_phone_wall_rules_href";
  DROP TYPE "public"."enum_phone_notes_status";
  DROP TYPE "public"."enum__phone_notes_v_version_status";
  DROP TYPE "public"."enum_site_settings_phone_notifications_trigger";
  DROP TYPE "public"."enum_site_settings_phone_notifications_app";
  DROP TYPE "public"."enum__site_settings_v_version_phone_notifications_trigger";
  DROP TYPE "public"."enum__site_settings_v_version_phone_notifications_app";`)
}
