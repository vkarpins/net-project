CREATE TABLE IF NOT EXISTS group_event_choice (
    event_id        INTEGER,
    user_id         INTEGER,
    option          TEXT,
    FOREIGN KEY (event_id) REFERENCES groupevents (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);