CREATE TABLE IF NOT EXISTS "sessions" (
    "session_id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,  -- Use INTEGER for consistency with user_id
    "expiration_time" TIMESTAMP NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);
