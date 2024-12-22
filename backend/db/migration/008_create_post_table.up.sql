CREATE TABLE IF NOT EXISTS "posts" (
    "post_id" INTEGER NOT NULL PRIMARY KEY,          -- Primary key for the post
    "user_id" INTEGER NOT NULL,                      -- ID of the user creating the post
    "content_text" TEXT NOT NULL,                    -- Content of the post (text)
    "content_image" VARCHAR(255),                   -- Optional image URL or path
    "privacy" VARCHAR(50) DEFAULT 'public',         -- Privacy setting (e.g., public, private, friends-only)
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the post was created
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") -- Foreign key referencing the user
);
