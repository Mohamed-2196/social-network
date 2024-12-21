CREATE TABLE IF NOT EXISTS "comment_interactions" (
    "id" INTEGER PRIMARY KEY,                     -- Auto-incrementing ID as the primary key
    "comment_id" INTEGER NOT NULL,               -- References the related comment
    "post_id" INTEGER NOT NULL,                  -- References the related post
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for when the interaction was created
    "created_by" INTEGER NOT NULL,               -- References the user who created the interaction
    FOREIGN KEY ("comment_id") REFERENCES "comments"("comment_id") ON DELETE CASCADE,
    FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE CASCADE
);
