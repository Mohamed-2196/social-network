CREATE TABLE IF NOT EXISTS "group_post_interactions" (
    "id" INTEGER PRIMARY KEY,                         -- Auto-incrementing primary key
    "group_post_id" INTEGER NOT NULL,                -- References a specific post
    "member_id" INTEGER NOT NULL,                    -- References the member performing the interaction
    "interaction" BOOLEAN NOT NULL DEFAULT FALSE,    -- Indicates interaction status, defaults to FALSE
    FOREIGN KEY ("group_post_id") REFERENCES "group_posts"("id") ON DELETE CASCADE,
    FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
);
 -- Use double quotes for case-sensitive table name
