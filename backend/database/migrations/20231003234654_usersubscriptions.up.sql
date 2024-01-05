CREATE TABLE IF NOT EXISTS user_following (
    user_id          INTEGER,
    "following"      INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);