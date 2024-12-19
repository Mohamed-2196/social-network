CREATE TABLE IF NOT EXISTS "post_interaction" (
    "id" SERIAL PRIMARY KEY,                     -- Auto-incrementing primary key
    "post_id" INTEGER NOT NULL,                  -- References the related post
    "user_id" INTEGER NOT NULL,                  -- References the user interacting
    "interaction" BOOLEAN DEFAULT FALSE          -- Tracks interaction (e.g., like/dislike)
);
-- Use double quotes for case-sensitive table name
