CREATE TABLE IF NOT EXISTS "user_relationships" (
    "id" INTEGER PRIMARY KEY, -- Unique identifier for each relationship
    "follower_id" INTEGER NOT NULL, -- User who is following
    "followed_id" INTEGER NOT NULL, -- User being followed
    "status" TEXT NOT NULL DEFAULT 'pending', -- Status of the relationship ('pending' or 'accepted')
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the follow action
    FOREIGN KEY ("follower_id") REFERENCES "users" ("user_id") ON DELETE CASCADE,
    FOREIGN KEY ("followed_id") REFERENCES "users" ("user_id") ON DELETE CASCADE,
    CONSTRAINT "unique_relationship" UNIQUE ("follower_id", "followed_id") -- Prevent duplicate relationships
);
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hidden_info TEXT,
    sender_id INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);