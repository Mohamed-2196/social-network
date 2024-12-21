CREATE TABLE IF NOT EXISTS "groups" (
    "group_id" INTEGER PRIMARY KEY,                      -- Auto-incrementing unique ID for the group
    "name" VARCHAR(255) NOT NULL,                        -- Name of the group (required)
    "description" TEXT,                                  -- Optional description of the group
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Timestamp when the group was created
    "type" BOOLEAN NOT NULL DEFAULT FALSE                -- Group type (e.g., public/private, default to public/false)
);
