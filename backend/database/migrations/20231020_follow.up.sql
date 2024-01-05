CREATE TABLE IF NOT EXISTS follow_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    requester_id INTEGER,
    recipient_id INTEGER,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

