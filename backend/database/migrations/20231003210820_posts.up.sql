CREATE TABLE IF NOT EXISTS posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    user_id         INTEGER,
    user_avatar     TEXT,
    title           TEXT,
    content         TEXT,
    photo           TEXT,
    privacy         TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
    FOREIGN KEY (user_avatar) REFERENCES users (avatar)
);