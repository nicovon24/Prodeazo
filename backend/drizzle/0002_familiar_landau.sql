CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"league_id" integer NOT NULL,
	"season_ids" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fixtures" ADD COLUMN "tournament_id" text;--> statement-breakpoint
ALTER TABLE "mini_leagues" ADD COLUMN "tournament_id" text;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_leagues" ADD CONSTRAINT "mini_leagues_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;
