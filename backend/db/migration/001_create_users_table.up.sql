CREATE TABLE IF NOT EXISTS "users" (
    "user_id" INTEGER PRIMARY KEY,  -- Auto-increment for user_id
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255) NOT NULL UNIQUE,  -- Ensure email is unique
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(255),
    "birthday" DATE NOT NULL,
    "image" VARCHAR(255),
    "about" TEXT,
    "password" VARCHAR(255) NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT FALSE  -- Added private field         -- Added comma here (optional, but good practice)
);