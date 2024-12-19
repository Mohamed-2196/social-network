CREATE TABLE IF NOT EXISTS "group_messages" (
    "id" SERIAL PRIMARY KEY,              
    "group_id" INTEGER NOT NULL,         
    "member_id" INTEGER NOT NULL,        
    "interaction" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tracks when the post was created
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE,
    FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
);
 -- Use double quotes for case-sensitive table name
