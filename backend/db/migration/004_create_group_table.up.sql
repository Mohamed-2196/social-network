CREATE TABLE IF NOT EXISTS "groups" (
    "group_id" INTEGER PRIMARY KEY,                     -- Auto-incrementing unique ID for the group
    "title" VARCHAR(255) NOT NULL,                       -- Name of the group (required)
    "description" TEXT,                                 -- Optional description of the group
    "admin_id" INT NOT NULL,                            -- Administrator's user ID
    FOREIGN KEY ("admin_id") REFERENCES "users" ("user_id") ON DELETE CASCADE
); -- Removed the trailing comma here