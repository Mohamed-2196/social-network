CREATE TABLE IF NOT EXISTS "comment_interactions" (
    "id" SERIAL NOT NULL PRIMARY KEY,  -- Auto-incrementing ID as the primary key
    "comment_id" VARCHAR(255) NOT NULL,
    "post_id" VARCHAR(255) NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255) NOT NULL
);
