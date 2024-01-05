CREATE TABLE IF NOT EXISTS private_chat (
    id          INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    user1_id    INTEGER,
    user2_id    INTEGER,
    FOREIGN KEY (user1_id) REFERENCES users (id),
    FOREIGN KEY (user2_id) REFERENCES users (id)
)