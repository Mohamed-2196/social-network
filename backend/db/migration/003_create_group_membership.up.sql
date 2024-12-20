CREATE TABLE IF NOT EXISTS "group_membership" (
    "id" SERIAL PRIMARY KEY,
    "group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,  -- Referencing user_id
    "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);
