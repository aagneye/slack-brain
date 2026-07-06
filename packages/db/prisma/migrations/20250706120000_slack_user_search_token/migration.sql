-- Per-user Slack search token (user OAuth xoxp-, not bot xoxb-)
ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "slack_search_token_ref" TEXT;
