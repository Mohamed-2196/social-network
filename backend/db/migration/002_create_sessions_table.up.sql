CREATE TABLE IF NOT EXISTS "sessions" (
    "session_id" VARCHAR(255) NOT NULL PRIMARY KEY,  -- Use VARCHAR for session ID
    "user_id" VARCHAR(255) NOT NULL,  -- Use VARCHAR for user ID
    "expiration_time" TIMESTAMP NOT NULL  -- Use TIMESTAMP for expiration time
);
