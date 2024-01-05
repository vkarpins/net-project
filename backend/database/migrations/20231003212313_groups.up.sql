CREATE TABLE IF NOT EXISTS groups (
    id             INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    name           TEXT,
    description    TEXT,
    creator_id      INTEGER,
    FOREIGN KEY (creator_id) REFERENCES users (id)
);