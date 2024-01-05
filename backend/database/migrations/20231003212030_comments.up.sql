CREATE TABLE IF NOT EXISTS comments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    post_id         INTEGER,
    user_id         INTEGER,
    user_avatar     TEXT,
    creator_name    TEXT,
    content         TEXT,
    photo           TEXT,
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (user_avatar) REFERENCES users (avatar)
);