DROP TABLE IF EXISTS user_followers;

DROP TABLE IF EXISTS user_following;

CREATE TABLE IF NOT EXISTS user_following (
    follower_id INTEGER,
    following_id INTEGER,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id)
);