CREATE TABLE IF NOT EXISTS "group_membership" (
    "id" SERIAL PRIMARY KEY,                           -- Auto-incrementing primary key
    "group_id" INTEGER NOT NULL,                       -- References a group
    "user_id" INTEGER NOT NULL,                        -- References a user
    "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Tracks when the user joined the group
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);