CREATE TABLE IF NOT EXISTS group_events (
    id             INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    group_id       INTEGER,
    creator_id     INTEGER,
    name           TEXT,
    description    TEXT,
    time           TEXT,
    options        TEXT,
    FOREIGN KEY (creator_id) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);