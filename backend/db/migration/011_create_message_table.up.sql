CREATE TABLE IF NOT EXISTS "messages" (
    "message_id" SERIAL PRIMARY KEY,  -- Auto-increment for message_id
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" VARCHAR(255) NOT NULL,
    "is_read" INT DEFAULT 0,
    FOREIGN KEY ("sender_id") REFERENCES "users"("user_id"),
    FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id")
);
