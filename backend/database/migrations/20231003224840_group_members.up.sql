CREATE TABLE IF NOT EXISTS group_members (
    id             INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    group_id       INTEGER,
    requester_id   INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups (id),
    FOREIGN KEY (requester_id) REFERENCES users (id)
);