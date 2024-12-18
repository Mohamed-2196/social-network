CREATE TABLE IF NOT EXISTS "posts" (
    "post_id" INTEGER NOT NULL PRIMARY KEY,          -- Primary key for the 
    "user_id" INTEGER NOT NULL,   
    "content_text" TEXT NOT NULL,                    -- Content of the post (text)
    "content_image" VARCHAR(255),                    -- Optional image URL or path
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the post was created                
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") -- Foreign key referencing the user
);

  -- Use double quotes for case-sensitive table name
