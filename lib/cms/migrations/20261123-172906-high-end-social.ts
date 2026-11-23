import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_social_profile_source" AS ENUM('own', 'instagram');
  CREATE TYPE "public"."enum__pages_v_blocks_social_profile_source" AS ENUM('own', 'instagram');
  CREATE TABLE "pages_blocks_social_profile_highlights_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "pages_blocks_social_profile_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"cover_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_social_profile_highlights_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_social_profile_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"cover_id" integer,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_social_profile" ALTER COLUMN "view_label" SET DEFAULT 'View on Instagram';
  ALTER TABLE "_pages_v_blocks_social_profile" ALTER COLUMN "view_label" SET DEFAULT 'View on Instagram';
  ALTER TABLE "pages_blocks_social_profile" ADD COLUMN "cover_id" integer;
  ALTER TABLE "pages_blocks_social_profile" ADD COLUMN "avatar_id" integer;
  ALTER TABLE "pages_blocks_social_profile" ADD COLUMN "source" "enum_pages_blocks_social_profile_source" DEFAULT 'own';
  ALTER TABLE "_pages_v_blocks_social_profile" ADD COLUMN "cover_id" integer;
  ALTER TABLE "_pages_v_blocks_social_profile" ADD COLUMN "avatar_id" integer;
  ALTER TABLE "_pages_v_blocks_social_profile" ADD COLUMN "source" "enum__pages_v_blocks_social_profile_source" DEFAULT 'own';
  ALTER TABLE "pages_blocks_social_profile_highlights_slides" ADD CONSTRAINT "pages_blocks_social_profile_highlights_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_profile_highlights_slides" ADD CONSTRAINT "pages_blocks_social_profile_highlights_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_social_profile_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_profile_highlights" ADD CONSTRAINT "pages_blocks_social_profile_highlights_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_profile_highlights" ADD CONSTRAINT "pages_blocks_social_profile_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_social_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights_slides" ADD CONSTRAINT "_pages_v_blocks_social_profile_highlights_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights_slides" ADD CONSTRAINT "_pages_v_blocks_social_profile_highlights_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_social_profile_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights" ADD CONSTRAINT "_pages_v_blocks_social_profile_highlights_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights" ADD CONSTRAINT "_pages_v_blocks_social_profile_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_social_profile"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_social_profile_highlights_slides_order_idx" ON "pages_blocks_social_profile_highlights_slides" USING btree ("_order");
  CREATE INDEX "pages_blocks_social_profile_highlights_slides_parent_id_idx" ON "pages_blocks_social_profile_highlights_slides" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_social_profile_highlights_slides_image_idx" ON "pages_blocks_social_profile_highlights_slides" USING btree ("image_id");
  CREATE INDEX "pages_blocks_social_profile_highlights_order_idx" ON "pages_blocks_social_profile_highlights" USING btree ("_order");
  CREATE INDEX "pages_blocks_social_profile_highlights_parent_id_idx" ON "pages_blocks_social_profile_highlights" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_social_profile_highlights_cover_idx" ON "pages_blocks_social_profile_highlights" USING btree ("cover_id");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_slides_order_idx" ON "_pages_v_blocks_social_profile_highlights_slides" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_slides_parent_id_idx" ON "_pages_v_blocks_social_profile_highlights_slides" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_slides_image_idx" ON "_pages_v_blocks_social_profile_highlights_slides" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_order_idx" ON "_pages_v_blocks_social_profile_highlights" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_parent_id_idx" ON "_pages_v_blocks_social_profile_highlights" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_profile_highlights_cover_idx" ON "_pages_v_blocks_social_profile_highlights" USING btree ("cover_id");
  ALTER TABLE "pages_blocks_social_profile" ADD CONSTRAINT "pages_blocks_social_profile_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_profile" ADD CONSTRAINT "pages_blocks_social_profile_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile" ADD CONSTRAINT "_pages_v_blocks_social_profile_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_profile" ADD CONSTRAINT "_pages_v_blocks_social_profile_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_social_profile_cover_idx" ON "pages_blocks_social_profile" USING btree ("cover_id");
  CREATE INDEX "pages_blocks_social_profile_avatar_idx" ON "pages_blocks_social_profile" USING btree ("avatar_id");
  CREATE INDEX "_pages_v_blocks_social_profile_cover_idx" ON "_pages_v_blocks_social_profile" USING btree ("cover_id");
  CREATE INDEX "_pages_v_blocks_social_profile_avatar_idx" ON "_pages_v_blocks_social_profile" USING btree ("avatar_id");
  ALTER TABLE "social_posts" DROP COLUMN "network";
  ALTER TABLE "social_posts" DROP COLUMN "url";
  ALTER TABLE "_social_posts_v" DROP COLUMN "version_network";
  ALTER TABLE "_social_posts_v" DROP COLUMN "version_url";
  DROP TYPE "public"."enum_social_posts_network";
  DROP TYPE "public"."enum__social_posts_v_version_network";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_posts_network" AS ENUM('instagram', 'x', 'youtube', 'tiktok', 'linkedin');
  CREATE TYPE "public"."enum__social_posts_v_version_network" AS ENUM('instagram', 'x', 'youtube', 'tiktok', 'linkedin');
  ALTER TABLE "pages_blocks_social_profile_highlights_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_social_profile_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_social_profile_highlights" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_social_profile_highlights_slides" CASCADE;
  DROP TABLE "pages_blocks_social_profile_highlights" CASCADE;
  DROP TABLE "_pages_v_blocks_social_profile_highlights_slides" CASCADE;
  DROP TABLE "_pages_v_blocks_social_profile_highlights" CASCADE;
  ALTER TABLE "pages_blocks_social_profile" DROP CONSTRAINT "pages_blocks_social_profile_cover_id_media_id_fk";
  
  ALTER TABLE "pages_blocks_social_profile" DROP CONSTRAINT "pages_blocks_social_profile_avatar_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_social_profile" DROP CONSTRAINT "_pages_v_blocks_social_profile_cover_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_social_profile" DROP CONSTRAINT "_pages_v_blocks_social_profile_avatar_id_media_id_fk";
  
  DROP INDEX "pages_blocks_social_profile_cover_idx";
  DROP INDEX "pages_blocks_social_profile_avatar_idx";
  DROP INDEX "_pages_v_blocks_social_profile_cover_idx";
  DROP INDEX "_pages_v_blocks_social_profile_avatar_idx";
  ALTER TABLE "pages_blocks_social_profile" ALTER COLUMN "view_label" SET DEFAULT 'View on';
  ALTER TABLE "_pages_v_blocks_social_profile" ALTER COLUMN "view_label" SET DEFAULT 'View on';
  ALTER TABLE "social_posts" ADD COLUMN "network" "enum_social_posts_network" DEFAULT 'instagram';
  ALTER TABLE "social_posts" ADD COLUMN "url" varchar;
  ALTER TABLE "_social_posts_v" ADD COLUMN "version_network" "enum__social_posts_v_version_network" DEFAULT 'instagram';
  ALTER TABLE "_social_posts_v" ADD COLUMN "version_url" varchar;
  ALTER TABLE "pages_blocks_social_profile" DROP COLUMN "cover_id";
  ALTER TABLE "pages_blocks_social_profile" DROP COLUMN "avatar_id";
  ALTER TABLE "pages_blocks_social_profile" DROP COLUMN "source";
  ALTER TABLE "_pages_v_blocks_social_profile" DROP COLUMN "cover_id";
  ALTER TABLE "_pages_v_blocks_social_profile" DROP COLUMN "avatar_id";
  ALTER TABLE "_pages_v_blocks_social_profile" DROP COLUMN "source";
  DROP TYPE "public"."enum_pages_blocks_social_profile_source";
  DROP TYPE "public"."enum__pages_v_blocks_social_profile_source";`)
}
