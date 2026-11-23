import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_sales_hero_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum_pages_blocks_sales_section_groups_style" AS ENUM('cards', 'list', 'steps', 'statements', 'tags', 'yes', 'no', 'panel', 'apps', 'placeholders');
  CREATE TYPE "public"."enum_pages_blocks_sales_section_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum_pages_blocks_objections_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum_pages_blocks_offer_comparison_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_sales_hero_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_sales_section_groups_style" AS ENUM('cards', 'list', 'steps', 'statements', 'tags', 'yes', 'no', 'panel', 'apps', 'placeholders');
  CREATE TYPE "public"."enum__pages_v_blocks_sales_section_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_objections_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum__pages_v_blocks_offer_comparison_actions_kind" AS ENUM('call', 'text', 'email', 'price', 'link');
  CREATE TYPE "public"."enum_home_screen_buttons_style" AS ENUM('headlines', 'profile');
  CREATE TYPE "public"."enum_home_screen_background" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum_home_screen_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_screen_v_version_buttons_style" AS ENUM('headlines', 'profile');
  CREATE TYPE "public"."enum__home_screen_v_version_background" AS ENUM('amber-moon', 'astronaut-window', 'canyon', 'cockpit', 'desert-planet', 'frontier-street', 'lunar-horizon', 'lunar-walk', 'pink-mountains', 'ringed-mist', 'ringed-orbit', 'silk');
  CREATE TYPE "public"."enum__home_screen_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages_blocks_sales_hero_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_sales_hero_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_section_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"stat" varchar,
  	"stat_label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_section_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"style" "enum_pages_blocks_sales_section_groups_style" DEFAULT 'cards',
  	"intro" varchar,
  	"sample_figures" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_sales_section_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_sales_section_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"body" varchar,
  	"note" varchar,
  	"closing" varchar,
  	"topic" varchar,
  	"closing_style" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_objections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_objections_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_objections_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_objections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"closing" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_offer_comparison_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"badge" varchar
  );
  
  CREATE TABLE "pages_blocks_offer_comparison_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_offer_comparison_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_offer_comparison_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_offer_comparison_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_offer_comparison" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_hero_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_sales_hero_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_section_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"stat" varchar,
  	"stat_label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_section_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"style" "enum__pages_v_blocks_sales_section_groups_style" DEFAULT 'cards',
  	"intro" varchar,
  	"sample_figures" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_section_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_sales_section_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"body" varchar,
  	"note" varchar,
  	"closing" varchar,
  	"topic" varchar,
  	"closing_style" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_objections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_objections_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_objections_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_objections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"closing" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offer_comparison_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"badge" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offer_comparison_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offer_comparison_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offer_comparison_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_offer_comparison_actions_kind" DEFAULT 'call',
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offer_comparison" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"title" varchar,
  	"subheadline" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_screen_buttons_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_screen_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum_home_screen_buttons_style" DEFAULT 'headlines',
  	"note" varchar,
  	"handle" varchar
  );
  
  CREATE TABLE "home_screen_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "home_screen_offers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"line" varchar,
  	"href" varchar,
  	"badge" varchar
  );
  
  CREATE TABLE "home_screen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"background" "enum_home_screen_background" DEFAULT 'lunar-horizon',
  	"title" varchar DEFAULT 'HONEST Marketing',
  	"back_label" varchar DEFAULT 'Home screen',
  	"lock_enabled" boolean DEFAULT true,
  	"lock_app" varchar DEFAULT 'HONEST Marketing',
  	"lock_tag" varchar DEFAULT 'Priority',
  	"lock_title" varchar DEFAULT 'Did you get an audit from us?',
  	"lock_body" varchar DEFAULT 'Pick one, so the site shows you the right things.',
  	"lock_audit" varchar DEFAULT 'Yes, I got an audit',
  	"lock_browse" varchar DEFAULT 'I’m here for the website',
  	"lock_locked" varchar DEFAULT 'You didn’t pick an experience. Choose one above.',
  	"lock_hint" varchar DEFAULT 'Swipe up for the full site',
  	"bar_call" varchar DEFAULT 'Call',
  	"bar_text" varchar DEFAULT 'Text',
  	"bar_email" varchar DEFAULT 'Email',
  	"bar_price" varchar DEFAULT 'Get a Price',
  	"bar_text_message" varchar DEFAULT 'Hi Dylan, I’m on the {page} page of hnst.marketing. Can we talk?',
  	"bar_email_subject" varchar DEFAULT '{page}: hnst.marketing',
  	"bar_email_body" varchar DEFAULT 'Hi Dylan,
  
  I’m on the {page} page of hnst.marketing and I’d like to talk.
  
  ',
  	"bar_price_message" varchar DEFAULT 'Hi Dylan, I’d like a price for {page}. Here’s what we’re trying to do: ',
  	"bar_price_subject" varchar DEFAULT 'A price for {page}',
  	"offers_eyebrow" varchar DEFAULT 'Offers',
  	"offers_heading" varchar DEFAULT 'Custom scope, not a menu of discounts.',
  	"offers_body" varchar DEFAULT 'Three offers for companies already doing $10M+ a year. The scope is set by your ambition, not a package. There’s no price list here, because there’s no package. Use Get a Price and tell us what you’re trying to do. We’ll talk price after we hear the intent, not before.',
  	"offers_terms" varchar DEFAULT 'Results depend on your market, your offer and your commitment. We don’t guarantee revenue, rankings or downloads.',
  	"offers_price_label" varchar DEFAULT 'Get a Price',
  	"offers_explore_label" varchar DEFAULT 'Explore',
  	"_status" "enum_home_screen_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_screen_v_version_buttons_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_screen_v_version_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"style" "enum__home_screen_v_version_buttons_style" DEFAULT 'headlines',
  	"note" varchar,
  	"handle" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_screen_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_screen_v_version_offers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"line" varchar,
  	"href" varchar,
  	"badge" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_screen_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_enabled" boolean DEFAULT false,
  	"version_background" "enum__home_screen_v_version_background" DEFAULT 'lunar-horizon',
  	"version_title" varchar DEFAULT 'HONEST Marketing',
  	"version_back_label" varchar DEFAULT 'Home screen',
  	"version_lock_enabled" boolean DEFAULT true,
  	"version_lock_app" varchar DEFAULT 'HONEST Marketing',
  	"version_lock_tag" varchar DEFAULT 'Priority',
  	"version_lock_title" varchar DEFAULT 'Did you get an audit from us?',
  	"version_lock_body" varchar DEFAULT 'Pick one, so the site shows you the right things.',
  	"version_lock_audit" varchar DEFAULT 'Yes, I got an audit',
  	"version_lock_browse" varchar DEFAULT 'I’m here for the website',
  	"version_lock_locked" varchar DEFAULT 'You didn’t pick an experience. Choose one above.',
  	"version_lock_hint" varchar DEFAULT 'Swipe up for the full site',
  	"version_bar_call" varchar DEFAULT 'Call',
  	"version_bar_text" varchar DEFAULT 'Text',
  	"version_bar_email" varchar DEFAULT 'Email',
  	"version_bar_price" varchar DEFAULT 'Get a Price',
  	"version_bar_text_message" varchar DEFAULT 'Hi Dylan, I’m on the {page} page of hnst.marketing. Can we talk?',
  	"version_bar_email_subject" varchar DEFAULT '{page}: hnst.marketing',
  	"version_bar_email_body" varchar DEFAULT 'Hi Dylan,
  
  I’m on the {page} page of hnst.marketing and I’d like to talk.
  
  ',
  	"version_bar_price_message" varchar DEFAULT 'Hi Dylan, I’d like a price for {page}. Here’s what we’re trying to do: ',
  	"version_bar_price_subject" varchar DEFAULT 'A price for {page}',
  	"version_offers_eyebrow" varchar DEFAULT 'Offers',
  	"version_offers_heading" varchar DEFAULT 'Custom scope, not a menu of discounts.',
  	"version_offers_body" varchar DEFAULT 'Three offers for companies already doing $10M+ a year. The scope is set by your ambition, not a package. There’s no price list here, because there’s no package. Use Get a Price and tell us what you’re trying to do. We’ll talk price after we hear the intent, not before.',
  	"version_offers_terms" varchar DEFAULT 'Results depend on your market, your offer and your commitment. We don’t guarantee revenue, rankings or downloads.',
  	"version_offers_price_label" varchar DEFAULT 'Get a Price',
  	"version_offers_explore_label" varchar DEFAULT 'Explore',
  	"version__status" "enum__home_screen_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "pages_blocks_sales_hero_points" ADD CONSTRAINT "pages_blocks_sales_hero_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_hero_actions" ADD CONSTRAINT "pages_blocks_sales_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_hero" ADD CONSTRAINT "pages_blocks_sales_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_section_groups_items" ADD CONSTRAINT "pages_blocks_sales_section_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_section_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_section_groups" ADD CONSTRAINT "pages_blocks_sales_section_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_section_actions" ADD CONSTRAINT "pages_blocks_sales_section_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_section" ADD CONSTRAINT "pages_blocks_sales_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_objections_items" ADD CONSTRAINT "pages_blocks_objections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_objections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_objections_actions" ADD CONSTRAINT "pages_blocks_objections_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_objections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_objections" ADD CONSTRAINT "pages_blocks_objections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offer_comparison_columns" ADD CONSTRAINT "pages_blocks_offer_comparison_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offer_comparison_rows_cells" ADD CONSTRAINT "pages_blocks_offer_comparison_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offer_comparison_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offer_comparison_rows" ADD CONSTRAINT "pages_blocks_offer_comparison_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offer_comparison_actions" ADD CONSTRAINT "pages_blocks_offer_comparison_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offer_comparison" ADD CONSTRAINT "pages_blocks_offer_comparison_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_hero_points" ADD CONSTRAINT "_pages_v_blocks_sales_hero_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_hero_actions" ADD CONSTRAINT "_pages_v_blocks_sales_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_hero" ADD CONSTRAINT "_pages_v_blocks_sales_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_section_groups_items" ADD CONSTRAINT "_pages_v_blocks_sales_section_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_section_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_section_groups" ADD CONSTRAINT "_pages_v_blocks_sales_section_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_section_actions" ADD CONSTRAINT "_pages_v_blocks_sales_section_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_section" ADD CONSTRAINT "_pages_v_blocks_sales_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_objections_items" ADD CONSTRAINT "_pages_v_blocks_objections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_objections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_objections_actions" ADD CONSTRAINT "_pages_v_blocks_objections_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_objections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_objections" ADD CONSTRAINT "_pages_v_blocks_objections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offer_comparison_columns" ADD CONSTRAINT "_pages_v_blocks_offer_comparison_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offer_comparison_rows_cells" ADD CONSTRAINT "_pages_v_blocks_offer_comparison_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offer_comparison_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offer_comparison_rows" ADD CONSTRAINT "_pages_v_blocks_offer_comparison_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offer_comparison_actions" ADD CONSTRAINT "_pages_v_blocks_offer_comparison_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offer_comparison"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offer_comparison" ADD CONSTRAINT "_pages_v_blocks_offer_comparison_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_screen_buttons_lines" ADD CONSTRAINT "home_screen_buttons_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_screen_buttons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_screen_buttons" ADD CONSTRAINT "home_screen_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_screen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_screen_links" ADD CONSTRAINT "home_screen_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_screen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_screen_offers_items" ADD CONSTRAINT "home_screen_offers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_screen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_screen_v_version_buttons_lines" ADD CONSTRAINT "_home_screen_v_version_buttons_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_screen_v_version_buttons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_screen_v_version_buttons" ADD CONSTRAINT "_home_screen_v_version_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_screen_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_screen_v_version_links" ADD CONSTRAINT "_home_screen_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_screen_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_screen_v_version_offers_items" ADD CONSTRAINT "_home_screen_v_version_offers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_screen_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_sales_hero_points_order_idx" ON "pages_blocks_sales_hero_points" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_hero_points_parent_id_idx" ON "pages_blocks_sales_hero_points" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_hero_actions_order_idx" ON "pages_blocks_sales_hero_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_hero_actions_parent_id_idx" ON "pages_blocks_sales_hero_actions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_hero_order_idx" ON "pages_blocks_sales_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_hero_parent_id_idx" ON "pages_blocks_sales_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_hero_path_idx" ON "pages_blocks_sales_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_sales_section_groups_items_order_idx" ON "pages_blocks_sales_section_groups_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_section_groups_items_parent_id_idx" ON "pages_blocks_sales_section_groups_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_section_groups_order_idx" ON "pages_blocks_sales_section_groups" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_section_groups_parent_id_idx" ON "pages_blocks_sales_section_groups" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_section_actions_order_idx" ON "pages_blocks_sales_section_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_section_actions_parent_id_idx" ON "pages_blocks_sales_section_actions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_section_order_idx" ON "pages_blocks_sales_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_section_parent_id_idx" ON "pages_blocks_sales_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_section_path_idx" ON "pages_blocks_sales_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_objections_items_order_idx" ON "pages_blocks_objections_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_objections_items_parent_id_idx" ON "pages_blocks_objections_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_objections_actions_order_idx" ON "pages_blocks_objections_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_objections_actions_parent_id_idx" ON "pages_blocks_objections_actions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_objections_order_idx" ON "pages_blocks_objections" USING btree ("_order");
  CREATE INDEX "pages_blocks_objections_parent_id_idx" ON "pages_blocks_objections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_objections_path_idx" ON "pages_blocks_objections" USING btree ("_path");
  CREATE INDEX "pages_blocks_offer_comparison_columns_order_idx" ON "pages_blocks_offer_comparison_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_offer_comparison_columns_parent_id_idx" ON "pages_blocks_offer_comparison_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offer_comparison_rows_cells_order_idx" ON "pages_blocks_offer_comparison_rows_cells" USING btree ("_order");
  CREATE INDEX "pages_blocks_offer_comparison_rows_cells_parent_id_idx" ON "pages_blocks_offer_comparison_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offer_comparison_rows_order_idx" ON "pages_blocks_offer_comparison_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_offer_comparison_rows_parent_id_idx" ON "pages_blocks_offer_comparison_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offer_comparison_actions_order_idx" ON "pages_blocks_offer_comparison_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_offer_comparison_actions_parent_id_idx" ON "pages_blocks_offer_comparison_actions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offer_comparison_order_idx" ON "pages_blocks_offer_comparison" USING btree ("_order");
  CREATE INDEX "pages_blocks_offer_comparison_parent_id_idx" ON "pages_blocks_offer_comparison" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offer_comparison_path_idx" ON "pages_blocks_offer_comparison" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_sales_hero_points_order_idx" ON "_pages_v_blocks_sales_hero_points" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_hero_points_parent_id_idx" ON "_pages_v_blocks_sales_hero_points" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_hero_actions_order_idx" ON "_pages_v_blocks_sales_hero_actions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_hero_actions_parent_id_idx" ON "_pages_v_blocks_sales_hero_actions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_hero_order_idx" ON "_pages_v_blocks_sales_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_hero_parent_id_idx" ON "_pages_v_blocks_sales_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_hero_path_idx" ON "_pages_v_blocks_sales_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_sales_section_groups_items_order_idx" ON "_pages_v_blocks_sales_section_groups_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_section_groups_items_parent_id_idx" ON "_pages_v_blocks_sales_section_groups_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_section_groups_order_idx" ON "_pages_v_blocks_sales_section_groups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_section_groups_parent_id_idx" ON "_pages_v_blocks_sales_section_groups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_section_actions_order_idx" ON "_pages_v_blocks_sales_section_actions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_section_actions_parent_id_idx" ON "_pages_v_blocks_sales_section_actions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_section_order_idx" ON "_pages_v_blocks_sales_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_section_parent_id_idx" ON "_pages_v_blocks_sales_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_section_path_idx" ON "_pages_v_blocks_sales_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_objections_items_order_idx" ON "_pages_v_blocks_objections_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_objections_items_parent_id_idx" ON "_pages_v_blocks_objections_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_objections_actions_order_idx" ON "_pages_v_blocks_objections_actions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_objections_actions_parent_id_idx" ON "_pages_v_blocks_objections_actions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_objections_order_idx" ON "_pages_v_blocks_objections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_objections_parent_id_idx" ON "_pages_v_blocks_objections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_objections_path_idx" ON "_pages_v_blocks_objections" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_offer_comparison_columns_order_idx" ON "_pages_v_blocks_offer_comparison_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offer_comparison_columns_parent_id_idx" ON "_pages_v_blocks_offer_comparison_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offer_comparison_rows_cells_order_idx" ON "_pages_v_blocks_offer_comparison_rows_cells" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offer_comparison_rows_cells_parent_id_idx" ON "_pages_v_blocks_offer_comparison_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offer_comparison_rows_order_idx" ON "_pages_v_blocks_offer_comparison_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offer_comparison_rows_parent_id_idx" ON "_pages_v_blocks_offer_comparison_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offer_comparison_actions_order_idx" ON "_pages_v_blocks_offer_comparison_actions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offer_comparison_actions_parent_id_idx" ON "_pages_v_blocks_offer_comparison_actions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offer_comparison_order_idx" ON "_pages_v_blocks_offer_comparison" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offer_comparison_parent_id_idx" ON "_pages_v_blocks_offer_comparison" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offer_comparison_path_idx" ON "_pages_v_blocks_offer_comparison" USING btree ("_path");
  CREATE INDEX "home_screen_buttons_lines_order_idx" ON "home_screen_buttons_lines" USING btree ("_order");
  CREATE INDEX "home_screen_buttons_lines_parent_id_idx" ON "home_screen_buttons_lines" USING btree ("_parent_id");
  CREATE INDEX "home_screen_buttons_order_idx" ON "home_screen_buttons" USING btree ("_order");
  CREATE INDEX "home_screen_buttons_parent_id_idx" ON "home_screen_buttons" USING btree ("_parent_id");
  CREATE INDEX "home_screen_links_order_idx" ON "home_screen_links" USING btree ("_order");
  CREATE INDEX "home_screen_links_parent_id_idx" ON "home_screen_links" USING btree ("_parent_id");
  CREATE INDEX "home_screen_offers_items_order_idx" ON "home_screen_offers_items" USING btree ("_order");
  CREATE INDEX "home_screen_offers_items_parent_id_idx" ON "home_screen_offers_items" USING btree ("_parent_id");
  CREATE INDEX "home_screen__status_idx" ON "home_screen" USING btree ("_status");
  CREATE INDEX "_home_screen_v_version_buttons_lines_order_idx" ON "_home_screen_v_version_buttons_lines" USING btree ("_order");
  CREATE INDEX "_home_screen_v_version_buttons_lines_parent_id_idx" ON "_home_screen_v_version_buttons_lines" USING btree ("_parent_id");
  CREATE INDEX "_home_screen_v_version_buttons_order_idx" ON "_home_screen_v_version_buttons" USING btree ("_order");
  CREATE INDEX "_home_screen_v_version_buttons_parent_id_idx" ON "_home_screen_v_version_buttons" USING btree ("_parent_id");
  CREATE INDEX "_home_screen_v_version_links_order_idx" ON "_home_screen_v_version_links" USING btree ("_order");
  CREATE INDEX "_home_screen_v_version_links_parent_id_idx" ON "_home_screen_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_home_screen_v_version_offers_items_order_idx" ON "_home_screen_v_version_offers_items" USING btree ("_order");
  CREATE INDEX "_home_screen_v_version_offers_items_parent_id_idx" ON "_home_screen_v_version_offers_items" USING btree ("_parent_id");
  CREATE INDEX "_home_screen_v_version_version__status_idx" ON "_home_screen_v" USING btree ("version__status");
  CREATE INDEX "_home_screen_v_created_at_idx" ON "_home_screen_v" USING btree ("created_at");
  CREATE INDEX "_home_screen_v_updated_at_idx" ON "_home_screen_v" USING btree ("updated_at");
  CREATE INDEX "_home_screen_v_latest_idx" ON "_home_screen_v" USING btree ("latest");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_sales_hero_points" CASCADE;
  DROP TABLE "pages_blocks_sales_hero_actions" CASCADE;
  DROP TABLE "pages_blocks_sales_hero" CASCADE;
  DROP TABLE "pages_blocks_sales_section_groups_items" CASCADE;
  DROP TABLE "pages_blocks_sales_section_groups" CASCADE;
  DROP TABLE "pages_blocks_sales_section_actions" CASCADE;
  DROP TABLE "pages_blocks_sales_section" CASCADE;
  DROP TABLE "pages_blocks_objections_items" CASCADE;
  DROP TABLE "pages_blocks_objections_actions" CASCADE;
  DROP TABLE "pages_blocks_objections" CASCADE;
  DROP TABLE "pages_blocks_offer_comparison_columns" CASCADE;
  DROP TABLE "pages_blocks_offer_comparison_rows_cells" CASCADE;
  DROP TABLE "pages_blocks_offer_comparison_rows" CASCADE;
  DROP TABLE "pages_blocks_offer_comparison_actions" CASCADE;
  DROP TABLE "pages_blocks_offer_comparison" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_hero_points" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_hero_actions" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_section_groups_items" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_section_groups" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_section_actions" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_section" CASCADE;
  DROP TABLE "_pages_v_blocks_objections_items" CASCADE;
  DROP TABLE "_pages_v_blocks_objections_actions" CASCADE;
  DROP TABLE "_pages_v_blocks_objections" CASCADE;
  DROP TABLE "_pages_v_blocks_offer_comparison_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_offer_comparison_rows_cells" CASCADE;
  DROP TABLE "_pages_v_blocks_offer_comparison_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_offer_comparison_actions" CASCADE;
  DROP TABLE "_pages_v_blocks_offer_comparison" CASCADE;
  DROP TABLE "home_screen_buttons_lines" CASCADE;
  DROP TABLE "home_screen_buttons" CASCADE;
  DROP TABLE "home_screen_links" CASCADE;
  DROP TABLE "home_screen_offers_items" CASCADE;
  DROP TABLE "home_screen" CASCADE;
  DROP TABLE "_home_screen_v_version_buttons_lines" CASCADE;
  DROP TABLE "_home_screen_v_version_buttons" CASCADE;
  DROP TABLE "_home_screen_v_version_links" CASCADE;
  DROP TABLE "_home_screen_v_version_offers_items" CASCADE;
  DROP TABLE "_home_screen_v" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_sales_hero_actions_kind";
  DROP TYPE "public"."enum_pages_blocks_sales_section_groups_style";
  DROP TYPE "public"."enum_pages_blocks_sales_section_actions_kind";
  DROP TYPE "public"."enum_pages_blocks_objections_actions_kind";
  DROP TYPE "public"."enum_pages_blocks_offer_comparison_actions_kind";
  DROP TYPE "public"."enum__pages_v_blocks_sales_hero_actions_kind";
  DROP TYPE "public"."enum__pages_v_blocks_sales_section_groups_style";
  DROP TYPE "public"."enum__pages_v_blocks_sales_section_actions_kind";
  DROP TYPE "public"."enum__pages_v_blocks_objections_actions_kind";
  DROP TYPE "public"."enum__pages_v_blocks_offer_comparison_actions_kind";
  DROP TYPE "public"."enum_home_screen_buttons_style";
  DROP TYPE "public"."enum_home_screen_background";
  DROP TYPE "public"."enum_home_screen_status";
  DROP TYPE "public"."enum__home_screen_v_version_buttons_style";
  DROP TYPE "public"."enum__home_screen_v_version_background";
  DROP TYPE "public"."enum__home_screen_v_version_status";`)
}
