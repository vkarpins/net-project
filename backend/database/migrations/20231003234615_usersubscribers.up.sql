CREATE TABLE IF NOT EXISTS user_followers (
    user_id          INTEGER,
    followers        INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);