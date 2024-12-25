CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INT NOT NULL,                -- Assuming user_id is an integer
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hidden_info TEXT,                    -- Optional field for hidden information
    sender_id INT DEFAULT 0,             -- Default to 0 to indicate no sender
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Adjust foreign key reference as necessary
);