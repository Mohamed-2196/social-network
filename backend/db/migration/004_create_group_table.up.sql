CREATE TABLE IF NOT EXISTS "groups" (
    "group_id" INTEGER PRIMARY KEY,                     -- Auto-incrementing unique ID for the group
    "title" VARCHAR(255) NOT NULL,                       -- Name of the group (required)
    "description" TEXT,                                 -- Optional description of the group
    "admin_id" INT NOT NULL,                            -- Administrator's user ID
    FOREIGN KEY ("admin_id") REFERENCES "users" ("user_id") ON DELETE CASCADE
); -- Removed the trailing comma here

CREATE TABLE IF NOT EXISTS "group_post_comments" (
    "comment_id" INTEGER PRIMARY KEY,                 -- Auto-incrementing unique ID for the comment
    "group_id" INT NOT NULL,                          -- Group ID to associate the comment with a group
    "post_id" INT NOT NULL,                           -- Post ID to associate the comment with a specific post
    "user_id" INT NOT NULL,                           -- User ID of the commenter
    "content" TEXT NOT NULL,                          -- Content of the comment
    "image" TEXT,                                     -- File path or URL of the image (optional)
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of when the comment was created
    FOREIGN KEY ("group_id") REFERENCES "groups" ("group_id") ON DELETE CASCADE,
    FOREIGN KEY ("post_id") REFERENCES "posts" ("post_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE
);