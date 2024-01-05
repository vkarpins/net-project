CREATE TABLE IF NOT EXISTS user_privacy (
    user_id         INTEGER,
    privacy_option  TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);