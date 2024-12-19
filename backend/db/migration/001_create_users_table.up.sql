CREATE TABLE IF NOT EXISTS "users" (
    "user_id" VARCHAR(255) NOT NULL,  -- Use VARCHAR for variable-length strings
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- TIMESTAMP for date and time
    "email" VARCHAR(255) NOT NULL,  -- VARCHAR for email addresses
    "first_name" VARCHAR(255) NOT NULL,  -- VARCHAR for names
    "last_name" VARCHAR(255) NOT NULL,  -- VARCHAR for names
    "nickname" VARCHAR(255),  -- Nullable columns can simply omit the NOT NULL constraint
    "birthday" DATE NOT NULL,  -- DATE for birthdates
    "image" VARCHAR(255),  -- VARCHAR for string or image paths
    "about" TEXT,  -- TEXT for longer strings
    "password" VARCHAR(255) NOT NULL,  -- VARCHAR for passwords
    PRIMARY KEY ("user_id")
);
