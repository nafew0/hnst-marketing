import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_scenes_hero" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum_pages_scenes_band" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum_pages_scenes_closing" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum__pages_v_version_scenes_hero" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum__pages_v_version_scenes_band" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum__pages_v_version_scenes_closing" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "homepage_film_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "homepage_platter_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "homepage_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "homepage_proof_shots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"caption" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar DEFAULT 'Enter HONEST Marketing',
  	"hero_line1" varchar DEFAULT 'Your marketing,',
  	"hero_line2" varchar DEFAULT 'on a golden platter.',
  	"hero_lede" varchar DEFAULT 'A complete marketing and AI system, built from your answers to a series of questions. Delivered ready to run. Yours to keep and own outright.',
  	"hero_primary_label" varchar DEFAULT 'Book a call',
  	"hero_secondary_label" varchar DEFAULT 'See packages',
  	"film_title" varchar DEFAULT 'Back in my day',
  	"film_pinned_line" varchar DEFAULT 'Back in my day, we used to struggle with marketing our business.',
  	"turn_heading" varchar DEFAULT 'Not a marketing agency like was possible yesterday.',
  	"turn_body" varchar DEFAULT 'Just a few short months ago, marketing was laborious and no one understood it. For those failing to adapt, it still is. We used to charge $25k+ for the same systems and, believe it or not, we did it all by hand.',
  	"turn_closing" varchar DEFAULT 'Today is the day that changed.',
  	"platter_eyebrow" varchar DEFAULT 'Done For You',
  	"platter_heading" varchar DEFAULT 'Everything on a golden platter.',
  	"platter_body" varchar DEFAULT 'When others say Done For You, they really mean “kinda”. You still have to execute the tasks and make the biggest decisions. Here, it all comes from a series of questions.',
  	"platter_note" varchar DEFAULT 'Shown: the Founder Package. What’s included varies by package.',
  	"steps_heading" varchar DEFAULT 'How it works',
  	"steps_note" varchar DEFAULT 'Basic DIY is a self-paced course: you run these steps yourself.',
  	"packages_eyebrow" varchar DEFAULT 'The packages',
  	"packages_heading" varchar DEFAULT 'Pick how much you want done for you.',
  	"packages_terms" varchar DEFAULT 'No refunds and no guarantees: see each package’s terms. Results depend on your commitment and creativity in answering the questions.',
  	"proof_eyebrow" varchar DEFAULT 'Client zero',
  	"proof_heading" varchar DEFAULT 'HONEST Marketing itself.',
  	"proof_body" varchar DEFAULT 'No testimonials here, because we won’t invent any. So here’s the real thing: the Notion and GoHighLevel system we run on.',
  	"proof_cta_heading" varchar DEFAULT 'I’m ready when you are.',
  	"proof_cta_label" varchar DEFAULT 'Book your call',
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_homepage_v_version_film_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_platter_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_proof_shots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar DEFAULT 'Enter HONEST Marketing',
  	"version_hero_line1" varchar DEFAULT 'Your marketing,',
  	"version_hero_line2" varchar DEFAULT 'on a golden platter.',
  	"version_hero_lede" varchar DEFAULT 'A complete marketing and AI system, built from your answers to a series of questions. Delivered ready to run. Yours to keep and own outright.',
  	"version_hero_primary_label" varchar DEFAULT 'Book a call',
  	"version_hero_secondary_label" varchar DEFAULT 'See packages',
  	"version_film_title" varchar DEFAULT 'Back in my day',
  	"version_film_pinned_line" varchar DEFAULT 'Back in my day, we used to struggle with marketing our business.',
  	"version_turn_heading" varchar DEFAULT 'Not a marketing agency like was possible yesterday.',
  	"version_turn_body" varchar DEFAULT 'Just a few short months ago, marketing was laborious and no one understood it. For those failing to adapt, it still is. We used to charge $25k+ for the same systems and, believe it or not, we did it all by hand.',
  	"version_turn_closing" varchar DEFAULT 'Today is the day that changed.',
  	"version_platter_eyebrow" varchar DEFAULT 'Done For You',
  	"version_platter_heading" varchar DEFAULT 'Everything on a golden platter.',
  	"version_platter_body" varchar DEFAULT 'When others say Done For You, they really mean “kinda”. You still have to execute the tasks and make the biggest decisions. Here, it all comes from a series of questions.',
  	"version_platter_note" varchar DEFAULT 'Shown: the Founder Package. What’s included varies by package.',
  	"version_steps_heading" varchar DEFAULT 'How it works',
  	"version_steps_note" varchar DEFAULT 'Basic DIY is a self-paced course: you run these steps yourself.',
  	"version_packages_eyebrow" varchar DEFAULT 'The packages',
  	"version_packages_heading" varchar DEFAULT 'Pick how much you want done for you.',
  	"version_packages_terms" varchar DEFAULT 'No refunds and no guarantees: see each package’s terms. Results depend on your commitment and creativity in answering the questions.',
  	"version_proof_eyebrow" varchar DEFAULT 'Client zero',
  	"version_proof_heading" varchar DEFAULT 'HONEST Marketing itself.',
  	"version_proof_body" varchar DEFAULT 'No testimonials here, because we won’t invent any. So here’s the real thing: the Notion and GoHighLevel system we run on.',
  	"version_proof_cta_heading" varchar DEFAULT 'I’m ready when you are.',
  	"version_proof_cta_label" varchar DEFAULT 'Book your call',
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "pages" ADD COLUMN "scenes_hero" "enum_pages_scenes_hero";
  ALTER TABLE "pages" ADD COLUMN "scenes_band" "enum_pages_scenes_band";
  ALTER TABLE "pages" ADD COLUMN "scenes_closing" "enum_pages_scenes_closing";
  ALTER TABLE "_pages_v" ADD COLUMN "version_scenes_hero" "enum__pages_v_version_scenes_hero";
  ALTER TABLE "_pages_v" ADD COLUMN "version_scenes_band" "enum__pages_v_version_scenes_band";
  ALTER TABLE "_pages_v" ADD COLUMN "version_scenes_closing" "enum__pages_v_version_scenes_closing";
  ALTER TABLE "homepage_film_chapters" ADD CONSTRAINT "homepage_film_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_platter_deliverables" ADD CONSTRAINT "homepage_platter_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_steps_items" ADD CONSTRAINT "homepage_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_proof_shots" ADD CONSTRAINT "homepage_proof_shots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_film_chapters" ADD CONSTRAINT "_homepage_v_version_film_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_platter_deliverables" ADD CONSTRAINT "_homepage_v_version_platter_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_steps_items" ADD CONSTRAINT "_homepage_v_version_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_proof_shots" ADD CONSTRAINT "_homepage_v_version_proof_shots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_film_chapters_order_idx" ON "homepage_film_chapters" USING btree ("_order");
  CREATE INDEX "homepage_film_chapters_parent_id_idx" ON "homepage_film_chapters" USING btree ("_parent_id");
  CREATE INDEX "homepage_platter_deliverables_order_idx" ON "homepage_platter_deliverables" USING btree ("_order");
  CREATE INDEX "homepage_platter_deliverables_parent_id_idx" ON "homepage_platter_deliverables" USING btree ("_parent_id");
  CREATE INDEX "homepage_steps_items_order_idx" ON "homepage_steps_items" USING btree ("_order");
  CREATE INDEX "homepage_steps_items_parent_id_idx" ON "homepage_steps_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_proof_shots_order_idx" ON "homepage_proof_shots" USING btree ("_order");
  CREATE INDEX "homepage_proof_shots_parent_id_idx" ON "homepage_proof_shots" USING btree ("_parent_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE INDEX "_homepage_v_version_film_chapters_order_idx" ON "_homepage_v_version_film_chapters" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_film_chapters_parent_id_idx" ON "_homepage_v_version_film_chapters" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_platter_deliverables_order_idx" ON "_homepage_v_version_platter_deliverables" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_platter_deliverables_parent_id_idx" ON "_homepage_v_version_platter_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_steps_items_order_idx" ON "_homepage_v_version_steps_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_steps_items_parent_id_idx" ON "_homepage_v_version_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_proof_shots_order_idx" ON "_homepage_v_version_proof_shots" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_proof_shots_parent_id_idx" ON "_homepage_v_version_proof_shots" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "homepage_film_chapters" CASCADE;
  DROP TABLE "homepage_platter_deliverables" CASCADE;
  DROP TABLE "homepage_steps_items" CASCADE;
  DROP TABLE "homepage_proof_shots" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "_homepage_v_version_film_chapters" CASCADE;
  DROP TABLE "_homepage_v_version_platter_deliverables" CASCADE;
  DROP TABLE "_homepage_v_version_steps_items" CASCADE;
  DROP TABLE "_homepage_v_version_proof_shots" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  ALTER TABLE "pages" DROP COLUMN "scenes_hero";
  ALTER TABLE "pages" DROP COLUMN "scenes_band";
  ALTER TABLE "pages" DROP COLUMN "scenes_closing";
  ALTER TABLE "_pages_v" DROP COLUMN "version_scenes_hero";
  ALTER TABLE "_pages_v" DROP COLUMN "version_scenes_band";
  ALTER TABLE "_pages_v" DROP COLUMN "version_scenes_closing";
  DROP TYPE "public"."enum_pages_scenes_hero";
  DROP TYPE "public"."enum_pages_scenes_band";
  DROP TYPE "public"."enum_pages_scenes_closing";
  DROP TYPE "public"."enum__pages_v_version_scenes_hero";
  DROP TYPE "public"."enum__pages_v_version_scenes_band";
  DROP TYPE "public"."enum__pages_v_version_scenes_closing";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_version_status";`)
}
