CREATE TABLE IF NOT EXISTS "group_event" (
    "event_id" INTEGER PRIMARY KEY,  
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_id" INTEGER NOT NULL,
    FOREIGN KEY ("created_by") REFERENCES "users"("user_id"),
    FOREIGN KEY ("group_id") REFERENCES "groups"("group_id")
);

CREATE TABLE IF NOT EXISTS "event_option" (
    "option_id" INTEGER PRIMARY KEY, 
    "content" VARCHAR(255) NOT NULL,
    "event_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("event_id") REFERENCES "group_event"("event_id")
);

CREATE TABLE IF NOT EXISTS "option_vote" (
    "vote_id" INTEGER PRIMARY KEY, 
    "created_by" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL, 
    FOREIGN KEY ("created_by") REFERENCES "users"("user_id"),
    FOREIGN KEY ("option_id") REFERENCES "event_option"("option_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_vote ON option_vote (option_id, created_by);

