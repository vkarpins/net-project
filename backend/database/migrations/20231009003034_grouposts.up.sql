CREATE TABLE IF NOT EXISTS group_posts (
    id		    INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    group_id    INTEGER,
    user_id     INTEGER,
    user_avatar VARCHAR(255),
    title       TEXT,
    content     TEXT,
    photo       TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (user_avatar) REFERENCES users (avatar),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);