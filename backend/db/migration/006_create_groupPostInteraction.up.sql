CREATE TABLE IF NOT EXISTS "group_post_interactions" (
    "group_post_interaction_id" INTEGER PRIMARY KEY,                         -- Auto-incrementing primary key
    "group_post_id" INTEGER NOT NULL,                 -- References a specific group post
    "user_id" INTEGER NOT NULL,                       -- References the member performing the interaction
    "interaction" BOOLEAN NOT NULL DEFAULT FALSE,     -- Indicates interaction status, defaults to FALSE
    FOREIGN KEY ("group_post_id") REFERENCES "group_post"("group_post_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);