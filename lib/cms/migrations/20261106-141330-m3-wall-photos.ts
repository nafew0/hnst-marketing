import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
CREATE TYPE "public"."enum_wall_photos_status" AS ENUM('pending', 'approved', 'rejected', 'removed');
CREATE TABLE "wall_photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"public_id" varchar NOT NULL,
  	"status" "enum_wall_photos_status" DEFAULT 'pending' NOT NULL,
  	"display_name" varchar,
  	"consent_text" varchar NOT NULL,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"adult" boolean DEFAULT false NOT NULL,
  	"remove_token_hash" varchar NOT NULL,
  	"reports" numeric DEFAULT 0 NOT NULL,
  	"status_changed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "wall_photos_id" integer;
CREATE UNIQUE INDEX "wall_photos_public_id_idx" ON "wall_photos" USING btree ("public_id");
CREATE INDEX "wall_photos_status_idx" ON "wall_photos" USING btree ("status");
CREATE INDEX "wall_photos_status_changed_at_idx" ON "wall_photos" USING btree ("status_changed_at");
CREATE INDEX "wall_photos_updated_at_idx" ON "wall_photos" USING btree ("updated_at");
CREATE INDEX "wall_photos_created_at_idx" ON "wall_photos" USING btree ("created_at");
CREATE UNIQUE INDEX "wall_photos_filename_idx" ON "wall_photos" USING btree ("filename");
CREATE INDEX "wall_photos_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "wall_photos" USING btree ("sizes_thumbnail_filename");
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wall_photos_fk" FOREIGN KEY ("wall_photos_id") REFERENCES "public"."wall_photos"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "payload_locked_documents_rels_wall_photos_id_idx" ON "payload_locked_documents_rels" USING btree ("wall_photos_id");
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
ALTER TABLE "wall_photos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_wall_photos_fk";
DROP INDEX "payload_locked_documents_rels_wall_photos_id_idx";
ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "wall_photos_id";
DROP TABLE "wall_photos" CASCADE;
DROP TYPE "public"."enum_wall_photos_status";
`)
}
