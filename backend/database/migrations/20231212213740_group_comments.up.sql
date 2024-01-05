CREATE TABLE IF NOT EXISTS group_comments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    post_id         INTEGER,
    user_id         INTEGER,
    group_id        INTEGER,
    user_avatar     TEXT,
    creator_name    TEXT,
    content         TEXT,
    photo           TEXT,
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (user_avatar) REFERENCES users (avatar),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);