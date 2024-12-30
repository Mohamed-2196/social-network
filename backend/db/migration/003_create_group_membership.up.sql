CREATE TABLE IF NOT EXISTS "group_membership" (
    "membership_id" INTEGER PRIMARY KEY,                   -- Auto-incrementing unique ID for the membership
    "group_id" INTEGER NOT NULL,                           -- ID of the group
    "user_id" INTEGER NOT NULL,                            -- ID of the user
    "status" TEXT CHECK(status IN ('accepted', 'pending')), -- Status of the membership
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);