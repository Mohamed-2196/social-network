CREATE TABLE IF NOT EXISTS "group_messages" (
    "groupmessage_id" INTEGER PRIMARY KEY,              
    "group_id" INTEGER NOT NULL,         
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,        
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tracks when the post was created
    "group_post_id" VARCHAR(255),
     "content" VARCHAR(255),
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE,
   FOREIGN KEY ("sender_id") REFERENCES "users"("user_id"),
    FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id")
    FOREIGN KEY ("group_post_id") REFERENCES "group_post"("group_post_id")

    
);
 -- Use double quotes for case-sensitive table name
