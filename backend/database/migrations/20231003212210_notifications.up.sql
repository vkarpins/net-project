CREATE TABLE IF NOT EXISTS notifications (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    user_id             INTEGER,
    sender_id           INTEGER,
    type                TEXT,
    content             TEXT,
    status              TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (sender_id) REFERENCES users (id)
);