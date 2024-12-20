CREATE TABLE IF NOT EXISTS "comments" (
    "comment_id" SERIAL PRIMARY KEY,  -- Auto-increment for comment_id
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,  -- References the user who created the comment
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);
