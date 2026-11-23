import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_posts_network" AS ENUM('instagram', 'x', 'youtube', 'tiktok', 'linkedin');
  CREATE TYPE "public"."enum_social_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__social_posts_v_version_network" AS ENUM('instagram', 'x', 'youtube', 'tiktok', 'linkedin');
  CREATE TYPE "public"."enum__social_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_prospect_visits_kind" AS ENUM('opened', 'page');
  CREATE TYPE "public"."enum_prospect_visits_device" AS ENUM('phone', 'computer');
  CREATE TABLE "pages_blocks_social_profile" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'HONEST Marketing',
  	"handle" varchar DEFAULT '@hnstmarketing',
  	"bio" varchar,
  	"follow_label" varchar DEFAULT 'Follow on',
  	"posts_heading" varchar DEFAULT 'Posts',
  	"view_label" varchar DEFAULT 'View on',
  	"empty_text" varchar DEFAULT 'The first posts are on their way. Until then, the fastest line to us is a call, a text or an email.',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_social_profile" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'HONEST Marketing',
  	"handle" varchar DEFAULT '@hnstmarketing',
  	"bio" varchar,
  	"follow_label" varchar DEFAULT 'Follow on',
  	"posts_heading" varchar DEFAULT 'Posts',
  	"view_label" varchar DEFAULT 'View on',
  	"empty_text" varchar DEFAULT 'The first posts are on their way. Until then, the fastest line to us is a call, a text or an email.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "social_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"network" "enum_social_posts_network" DEFAULT 'instagram',
  	"url" varchar,
  	"posted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_social_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_social_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_image_id" integer,
  	"version_caption" varchar,
  	"version_network" "enum__social_posts_v_version_network" DEFAULT 'instagram',
  	"version_url" varchar,
  	"version_posted_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__social_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "prospects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"company" varchar,
  	"greet" boolean DEFAULT true,
  	"token" varchar,
  	"last_visit" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "prospect_visits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prospect_id" integer NOT NULL,
  	"kind" "enum_prospect_visits_kind" NOT NULL,
  	"path" varchar NOT NULL,
  	"device" "enum_prospect_visits_device",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "social_posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prospects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prospect_visits_id" integer;
  ALTER TABLE "home_screen" ADD COLUMN "greeting" varchar DEFAULT '{name}, I knew you’d show up.';
  ALTER TABLE "_home_screen_v" ADD COLUMN "version_greeting" varchar DEFAULT '{name}, I knew you’d show up.';
  ALTER TABLE "pages_blocks_social_profile" ADD CONSTRAINT "pages_blocks_social_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile" ADD CONSTRAINT "_pages_v_blocks_social_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_social_posts_v" ADD CONSTRAINT "_social_posts_v_parent_id_social_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."social_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_social_posts_v" ADD CONSTRAINT "_social_posts_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "prospect_visits" ADD CONSTRAINT "prospect_visits_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_social_profile_order_idx" ON "pages_blocks_social_profile" USING btree ("_order");
  CREATE INDEX "pages_blocks_social_profile_parent_id_idx" ON "pages_blocks_social_profile" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_social_profile_path_idx" ON "pages_blocks_social_profile" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_social_profile_order_idx" ON "_pages_v_blocks_social_profile" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_profile_parent_id_idx" ON "_pages_v_blocks_social_profile" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_profile_path_idx" ON "_pages_v_blocks_social_profile" USING btree ("_path");
  CREATE INDEX "social_posts_image_idx" ON "social_posts" USING btree ("image_id");
  CREATE INDEX "social_posts_updated_at_idx" ON "social_posts" USING btree ("updated_at");
  CREATE INDEX "social_posts_created_at_idx" ON "social_posts" USING btree ("created_at");
  CREATE INDEX "social_posts__status_idx" ON "social_posts" USING btree ("_status");
  CREATE INDEX "_social_posts_v_parent_idx" ON "_social_posts_v" USING btree ("parent_id");
  CREATE INDEX "_social_posts_v_version_version_image_idx" ON "_social_posts_v" USING btree ("version_image_id");
  CREATE INDEX "_social_posts_v_version_version_updated_at_idx" ON "_social_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_social_posts_v_version_version_created_at_idx" ON "_social_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_social_posts_v_version_version__status_idx" ON "_social_posts_v" USING btree ("version__status");
  CREATE INDEX "_social_posts_v_created_at_idx" ON "_social_posts_v" USING btree ("created_at");
  CREATE INDEX "_social_posts_v_updated_at_idx" ON "_social_posts_v" USING btree ("updated_at");
  CREATE INDEX "_social_posts_v_latest_idx" ON "_social_posts_v" USING btree ("latest");
  CREATE UNIQUE INDEX "prospects_token_idx" ON "prospects" USING btree ("token");
  CREATE INDEX "prospects_updated_at_idx" ON "prospects" USING btree ("updated_at");
  CREATE INDEX "prospects_created_at_idx" ON "prospects" USING btree ("created_at");
  CREATE INDEX "prospect_visits_prospect_idx" ON "prospect_visits" USING btree ("prospect_id");
  CREATE INDEX "prospect_visits_updated_at_idx" ON "prospect_visits" USING btree ("updated_at");
  CREATE INDEX "prospect_visits_created_at_idx" ON "prospect_visits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_posts_fk" FOREIGN KEY ("social_posts_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prospects_fk" FOREIGN KEY ("prospects_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prospect_visits_fk" FOREIGN KEY ("prospect_visits_id") REFERENCES "public"."prospect_visits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_social_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("social_posts_id");
  CREATE INDEX "payload_locked_documents_rels_prospects_id_idx" ON "payload_locked_documents_rels" USING btree ("prospects_id");
  CREATE INDEX "payload_locked_documents_rels_prospect_visits_id_idx" ON "payload_locked_documents_rels" USING btree ("prospect_visits_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_social_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_social_profile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_social_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prospects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "prospect_visits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_social_profile" CASCADE;
  DROP TABLE "_pages_v_blocks_social_profile" CASCADE;
  DROP TABLE "social_posts" CASCADE;
  DROP TABLE "_social_posts_v" CASCADE;
  DROP TABLE "prospects" CASCADE;
  DROP TABLE "prospect_visits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_social_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prospects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prospect_visits_fk";
  
  DROP INDEX "payload_locked_documents_rels_social_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_prospects_id_idx";
  DROP INDEX "payload_locked_documents_rels_prospect_visits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "social_posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prospects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prospect_visits_id";
  ALTER TABLE "home_screen" DROP COLUMN "greeting";
  ALTER TABLE "_home_screen_v" DROP COLUMN "version_greeting";
  DROP TYPE "public"."enum_social_posts_network";
  DROP TYPE "public"."enum_social_posts_status";
  DROP TYPE "public"."enum__social_posts_v_version_network";
  DROP TYPE "public"."enum__social_posts_v_version_status";
  DROP TYPE "public"."enum_prospect_visits_kind";
  DROP TYPE "public"."enum_prospect_visits_device";`)
}
