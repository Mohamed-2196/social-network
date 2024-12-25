CREATE TABLE IF NOT EXISTS "post_interaction" (
    "id" INTEGER PRIMARY KEY,                      -- Auto-incrementing primary key
    "post_id" INTEGER NOT NULL,                   -- References the related post
    "user_id" INTEGER NOT NULL,                   -- References the user
    "interaction" BOOLEAN DEFAULT FALSE,          -- Tracks interaction (like/dislike)
    FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
    UNIQUE ("post_id", "user_id")                 -- Add UNIQUE constraint here
);