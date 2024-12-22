CREATE TABLE IF NOT EXISTS "user_relationships" (
    "id" INTEGER PRIMARY KEY, -- Unique identifier for each relationship
    "follower_id" INTEGER NOT NULL, -- User who is following
    "followed_id" INTEGER NOT NULL, -- User being followed
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the follow action
    FOREIGN KEY ("follower_id") REFERENCES "users" ("user_id") ON DELETE CASCADE,
    FOREIGN KEY ("followed_id") REFERENCES "users" ("user_id") ON DELETE CASCADE,
    CONSTRAINT "unique_relationship" UNIQUE ("follower_id", "followed_id") -- Prevent duplicate relationships
);