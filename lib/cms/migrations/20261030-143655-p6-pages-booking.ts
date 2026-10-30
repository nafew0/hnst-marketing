import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Existing singleton values were already public before versions were enabled.
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages_blocks_process_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_bio_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"body" varchar,
  	"photo_id" integer,
  	"placeholder" varchar
  );
  
  CREATE TABLE "pages_blocks_bio_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"experience_approved" boolean DEFAULT false,
  	"experience_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_proof_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"caption" varchar,
  	"image_id" integer,
  	"placeholder" varchar
  );
  
  CREATE TABLE "pages_blocks_proof_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"close_label" varchar,
  	"open_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_research" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"attribution" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_magnet_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_magnet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"placeholder" varchar,
  	"notice" varchar,
  	"copy_first_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_retry" varchar,
  	"copy_message" varchar,
  	"copy_unavailable" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_booking" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"copy_timezone" varchar,
  	"copy_previous_month" varchar,
  	"copy_next_month" varchar,
  	"copy_choose_day" varchar,
  	"copy_choose_time" varchar,
  	"copy_loading" varchar,
  	"copy_empty_slots" varchar,
  	"copy_unavailable" varchar,
  	"copy_fallback_title" varchar,
  	"copy_fallback_unavailable" varchar,
  	"copy_retry" varchar,
  	"copy_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_questions" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_error" varchar,
  	"copy_invalid" varchar,
  	"copy_choose_slot" varchar,
  	"copy_slot_taken" varchar,
  	"copy_queued" varchar,
  	"copy_confirmed" varchar,
  	"copy_no_receipt" varchar,
  	"copy_calendar_title" varchar,
  	"copy_download" varchar,
  	"copy_google" varchar,
  	"copy_reference" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_booking_receipt" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"copy_timezone" varchar,
  	"copy_previous_month" varchar,
  	"copy_next_month" varchar,
  	"copy_choose_day" varchar,
  	"copy_choose_time" varchar,
  	"copy_loading" varchar,
  	"copy_empty_slots" varchar,
  	"copy_unavailable" varchar,
  	"copy_fallback_title" varchar,
  	"copy_fallback_unavailable" varchar,
  	"copy_retry" varchar,
  	"copy_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_questions" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_error" varchar,
  	"copy_invalid" varchar,
  	"copy_choose_slot" varchar,
  	"copy_slot_taken" varchar,
  	"copy_queued" varchar,
  	"copy_confirmed" varchar,
  	"copy_no_receipt" varchar,
  	"copy_calendar_title" varchar,
  	"copy_download" varchar,
  	"copy_google" varchar,
  	"copy_reference" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bio_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"body" varchar,
  	"photo_id" integer,
  	"placeholder" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bio_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"experience_approved" boolean DEFAULT false,
  	"experience_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_proof_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"caption" varchar,
  	"image_id" integer,
  	"placeholder" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_proof_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"close_label" varchar,
  	"open_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_research" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"attribution" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_magnet_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_magnet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"placeholder" varchar,
  	"notice" varchar,
  	"copy_first_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_retry" varchar,
  	"copy_message" varchar,
  	"copy_unavailable" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_booking" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"copy_timezone" varchar,
  	"copy_previous_month" varchar,
  	"copy_next_month" varchar,
  	"copy_choose_day" varchar,
  	"copy_choose_time" varchar,
  	"copy_loading" varchar,
  	"copy_empty_slots" varchar,
  	"copy_unavailable" varchar,
  	"copy_fallback_title" varchar,
  	"copy_fallback_unavailable" varchar,
  	"copy_retry" varchar,
  	"copy_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_questions" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_error" varchar,
  	"copy_invalid" varchar,
  	"copy_choose_slot" varchar,
  	"copy_slot_taken" varchar,
  	"copy_queued" varchar,
  	"copy_confirmed" varchar,
  	"copy_no_receipt" varchar,
  	"copy_calendar_title" varchar,
  	"copy_download" varchar,
  	"copy_google" varchar,
  	"copy_reference" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_booking_receipt" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"copy_timezone" varchar,
  	"copy_previous_month" varchar,
  	"copy_next_month" varchar,
  	"copy_choose_day" varchar,
  	"copy_choose_time" varchar,
  	"copy_loading" varchar,
  	"copy_empty_slots" varchar,
  	"copy_unavailable" varchar,
  	"copy_fallback_title" varchar,
  	"copy_fallback_unavailable" varchar,
  	"copy_retry" varchar,
  	"copy_name" varchar,
  	"copy_email" varchar,
  	"copy_phone" varchar,
  	"copy_questions" varchar,
  	"copy_consent_legend" varchar,
  	"copy_submit" varchar,
  	"copy_pending" varchar,
  	"copy_success" varchar,
  	"copy_error" varchar,
  	"copy_invalid" varchar,
  	"copy_choose_slot" varchar,
  	"copy_slot_taken" varchar,
  	"copy_queued" varchar,
  	"copy_confirmed" varchar,
  	"copy_no_receipt" varchar,
  	"copy_calendar_title" varchar,
  	"copy_download" varchar,
  	"copy_google" varchar,
  	"copy_reference" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_qualifying_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_company_legal_name" varchar,
  	"version_address" varchar,
  	"version_public_email" varchar,
  	"version_public_phone" varchar,
  	"version_consent_texts_sms" varchar,
  	"version_consent_texts_email" varchar,
  	"version_consent_texts_approved" boolean DEFAULT false,
  	"version_announcement_bar" varchar,
  	"version_tool_cost_disclosure" varchar,
  	"version_booking_embed_url" varchar,
  	"version_ghl_tracking_id" varchar,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "site_settings_footer_links" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "site_settings_footer_links" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "site_settings_social_links" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "site_settings_social_links" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "site_settings_qualifying_questions" ALTER COLUMN "question" DROP NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "consent_texts_sms" DROP NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "consent_texts_email" DROP NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "_status" "enum_site_settings_status" DEFAULT 'draft';
  ALTER TABLE "pages_blocks_process_steps_items" ADD CONSTRAINT "pages_blocks_process_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_steps" ADD CONSTRAINT "pages_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline_items" ADD CONSTRAINT "pages_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_timeline" ADD CONSTRAINT "pages_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bio_cards_items" ADD CONSTRAINT "pages_blocks_bio_cards_items_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_bio_cards_items" ADD CONSTRAINT "pages_blocks_bio_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bio_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bio_cards" ADD CONSTRAINT "pages_blocks_bio_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_proof_gallery_items" ADD CONSTRAINT "pages_blocks_proof_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_proof_gallery_items" ADD CONSTRAINT "pages_blocks_proof_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_proof_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_proof_gallery" ADD CONSTRAINT "pages_blocks_proof_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_research" ADD CONSTRAINT "pages_blocks_research_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_magnet_bullets" ADD CONSTRAINT "pages_blocks_magnet_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_magnet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_magnet" ADD CONSTRAINT "pages_blocks_magnet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_booking" ADD CONSTRAINT "pages_blocks_booking_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_booking_receipt" ADD CONSTRAINT "pages_blocks_booking_receipt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_steps_items" ADD CONSTRAINT "_pages_v_blocks_process_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_steps" ADD CONSTRAINT "_pages_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_items" ADD CONSTRAINT "_pages_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline" ADD CONSTRAINT "_pages_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bio_cards_items" ADD CONSTRAINT "_pages_v_blocks_bio_cards_items_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bio_cards_items" ADD CONSTRAINT "_pages_v_blocks_bio_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_bio_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bio_cards" ADD CONSTRAINT "_pages_v_blocks_bio_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_proof_gallery_items" ADD CONSTRAINT "_pages_v_blocks_proof_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_proof_gallery_items" ADD CONSTRAINT "_pages_v_blocks_proof_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_proof_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_proof_gallery" ADD CONSTRAINT "_pages_v_blocks_proof_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_research" ADD CONSTRAINT "_pages_v_blocks_research_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_magnet_bullets" ADD CONSTRAINT "_pages_v_blocks_magnet_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_magnet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_magnet" ADD CONSTRAINT "_pages_v_blocks_magnet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_booking" ADD CONSTRAINT "_pages_v_blocks_booking_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_booking_receipt" ADD CONSTRAINT "_pages_v_blocks_booking_receipt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_links" ADD CONSTRAINT "_site_settings_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_social_links" ADD CONSTRAINT "_site_settings_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_qualifying_questions" ADD CONSTRAINT "_site_settings_v_version_qualifying_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_process_steps_items_order_idx" ON "pages_blocks_process_steps_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_steps_items_parent_id_idx" ON "pages_blocks_process_steps_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_steps_order_idx" ON "pages_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_steps_parent_id_idx" ON "pages_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_steps_path_idx" ON "pages_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_timeline_items_order_idx" ON "pages_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_items_parent_id_idx" ON "pages_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_order_idx" ON "pages_blocks_timeline" USING btree ("_order");
  CREATE INDEX "pages_blocks_timeline_parent_id_idx" ON "pages_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_timeline_path_idx" ON "pages_blocks_timeline" USING btree ("_path");
  CREATE INDEX "pages_blocks_bio_cards_items_order_idx" ON "pages_blocks_bio_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_bio_cards_items_parent_id_idx" ON "pages_blocks_bio_cards_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bio_cards_items_photo_idx" ON "pages_blocks_bio_cards_items" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_bio_cards_order_idx" ON "pages_blocks_bio_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_bio_cards_parent_id_idx" ON "pages_blocks_bio_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bio_cards_path_idx" ON "pages_blocks_bio_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_proof_gallery_items_order_idx" ON "pages_blocks_proof_gallery_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_proof_gallery_items_parent_id_idx" ON "pages_blocks_proof_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_proof_gallery_items_image_idx" ON "pages_blocks_proof_gallery_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_proof_gallery_order_idx" ON "pages_blocks_proof_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_proof_gallery_parent_id_idx" ON "pages_blocks_proof_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_proof_gallery_path_idx" ON "pages_blocks_proof_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_research_order_idx" ON "pages_blocks_research" USING btree ("_order");
  CREATE INDEX "pages_blocks_research_parent_id_idx" ON "pages_blocks_research" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_research_path_idx" ON "pages_blocks_research" USING btree ("_path");
  CREATE INDEX "pages_blocks_magnet_bullets_order_idx" ON "pages_blocks_magnet_bullets" USING btree ("_order");
  CREATE INDEX "pages_blocks_magnet_bullets_parent_id_idx" ON "pages_blocks_magnet_bullets" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_magnet_order_idx" ON "pages_blocks_magnet" USING btree ("_order");
  CREATE INDEX "pages_blocks_magnet_parent_id_idx" ON "pages_blocks_magnet" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_magnet_path_idx" ON "pages_blocks_magnet" USING btree ("_path");
  CREATE INDEX "pages_blocks_booking_order_idx" ON "pages_blocks_booking" USING btree ("_order");
  CREATE INDEX "pages_blocks_booking_parent_id_idx" ON "pages_blocks_booking" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_booking_path_idx" ON "pages_blocks_booking" USING btree ("_path");
  CREATE INDEX "pages_blocks_booking_receipt_order_idx" ON "pages_blocks_booking_receipt" USING btree ("_order");
  CREATE INDEX "pages_blocks_booking_receipt_parent_id_idx" ON "pages_blocks_booking_receipt" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_booking_receipt_path_idx" ON "pages_blocks_booking_receipt" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_process_steps_items_order_idx" ON "_pages_v_blocks_process_steps_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_steps_items_parent_id_idx" ON "_pages_v_blocks_process_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_steps_order_idx" ON "_pages_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_steps_parent_id_idx" ON "_pages_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_steps_path_idx" ON "_pages_v_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_timeline_items_order_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_items_parent_id_idx" ON "_pages_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_order_idx" ON "_pages_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_parent_id_idx" ON "_pages_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_path_idx" ON "_pages_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_bio_cards_items_order_idx" ON "_pages_v_blocks_bio_cards_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bio_cards_items_parent_id_idx" ON "_pages_v_blocks_bio_cards_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bio_cards_items_photo_idx" ON "_pages_v_blocks_bio_cards_items" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_bio_cards_order_idx" ON "_pages_v_blocks_bio_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bio_cards_parent_id_idx" ON "_pages_v_blocks_bio_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bio_cards_path_idx" ON "_pages_v_blocks_bio_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_proof_gallery_items_order_idx" ON "_pages_v_blocks_proof_gallery_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_proof_gallery_items_parent_id_idx" ON "_pages_v_blocks_proof_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_proof_gallery_items_image_idx" ON "_pages_v_blocks_proof_gallery_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_proof_gallery_order_idx" ON "_pages_v_blocks_proof_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_proof_gallery_parent_id_idx" ON "_pages_v_blocks_proof_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_proof_gallery_path_idx" ON "_pages_v_blocks_proof_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_research_order_idx" ON "_pages_v_blocks_research" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_research_parent_id_idx" ON "_pages_v_blocks_research" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_research_path_idx" ON "_pages_v_blocks_research" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_magnet_bullets_order_idx" ON "_pages_v_blocks_magnet_bullets" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_magnet_bullets_parent_id_idx" ON "_pages_v_blocks_magnet_bullets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_magnet_order_idx" ON "_pages_v_blocks_magnet" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_magnet_parent_id_idx" ON "_pages_v_blocks_magnet" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_magnet_path_idx" ON "_pages_v_blocks_magnet" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_booking_order_idx" ON "_pages_v_blocks_booking" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_booking_parent_id_idx" ON "_pages_v_blocks_booking" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_booking_path_idx" ON "_pages_v_blocks_booking" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_booking_receipt_order_idx" ON "_pages_v_blocks_booking_receipt" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_booking_receipt_parent_id_idx" ON "_pages_v_blocks_booking_receipt" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_booking_receipt_path_idx" ON "_pages_v_blocks_booking_receipt" USING btree ("_path");
  CREATE INDEX "_site_settings_v_version_footer_links_order_idx" ON "_site_settings_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_links_parent_id_idx" ON "_site_settings_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_social_links_order_idx" ON "_site_settings_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_social_links_parent_id_idx" ON "_site_settings_v_version_social_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_qualifying_questions_order_idx" ON "_site_settings_v_version_qualifying_questions" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_qualifying_questions_parent_id_idx" ON "_site_settings_v_version_qualifying_questions" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  UPDATE "site_settings" SET "_status" = 'published';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_process_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_bio_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_bio_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_proof_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_proof_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_research" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_magnet_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_magnet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_booking" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_booking_receipt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_process_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_bio_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_bio_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_proof_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_proof_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_research" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_magnet_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_magnet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_booking" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_booking_receipt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_qualifying_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_process_steps_items" CASCADE;
  DROP TABLE "pages_blocks_process_steps" CASCADE;
  DROP TABLE "pages_blocks_timeline_items" CASCADE;
  DROP TABLE "pages_blocks_timeline" CASCADE;
  DROP TABLE "pages_blocks_bio_cards_items" CASCADE;
  DROP TABLE "pages_blocks_bio_cards" CASCADE;
  DROP TABLE "pages_blocks_proof_gallery_items" CASCADE;
  DROP TABLE "pages_blocks_proof_gallery" CASCADE;
  DROP TABLE "pages_blocks_research" CASCADE;
  DROP TABLE "pages_blocks_magnet_bullets" CASCADE;
  DROP TABLE "pages_blocks_magnet" CASCADE;
  DROP TABLE "pages_blocks_booking" CASCADE;
  DROP TABLE "pages_blocks_booking_receipt" CASCADE;
  DROP TABLE "_pages_v_blocks_process_steps_items" CASCADE;
  DROP TABLE "_pages_v_blocks_process_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline" CASCADE;
  DROP TABLE "_pages_v_blocks_bio_cards_items" CASCADE;
  DROP TABLE "_pages_v_blocks_bio_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_proof_gallery_items" CASCADE;
  DROP TABLE "_pages_v_blocks_proof_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_research" CASCADE;
  DROP TABLE "_pages_v_blocks_magnet_bullets" CASCADE;
  DROP TABLE "_pages_v_blocks_magnet" CASCADE;
  DROP TABLE "_pages_v_blocks_booking" CASCADE;
  DROP TABLE "_pages_v_blocks_booking_receipt" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_links" CASCADE;
  DROP TABLE "_site_settings_v_version_social_links" CASCADE;
  DROP TABLE "_site_settings_v_version_qualifying_questions" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP INDEX "site_settings__status_idx";
  ALTER TABLE "site_settings_footer_links" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "site_settings_footer_links" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "site_settings_social_links" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "site_settings_social_links" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "site_settings_qualifying_questions" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "consent_texts_sms" SET NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "consent_texts_email" SET NOT NULL;
  ALTER TABLE "site_settings" DROP COLUMN "_status";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_status";`)
}
