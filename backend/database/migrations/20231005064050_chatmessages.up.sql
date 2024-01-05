CREATE TABLE IF NOT EXISTS chat_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    sender_id       INTEGER,
    content         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    private_chat_id INTEGER,
    group_chat_id   INTEGER,
    FOREIGN KEY (private_chat_id) REFERENCES private_chat (id),
    FOREIGN KEY (group_chat_id) REFERENCES groups (id),
    FOREIGN KEY (sender_id) REFERENCES users (id)
);