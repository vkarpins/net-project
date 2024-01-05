CREATE TABLE IF NOT EXISTS group_notifications (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    sender_id           INTEGER,
    receiver_id         INTEGER,
    group_id            INTEGER,
    content             TEXT,
    type                TEXT,
    status              TEXT,
    FOREIGN KEY (receiver_id) REFERENCES users (id),
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);