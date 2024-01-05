CREATE TABLE join_requests (
    id INTEGER PRIMARY KEY,
    requester_id INTEGER,
    group_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

