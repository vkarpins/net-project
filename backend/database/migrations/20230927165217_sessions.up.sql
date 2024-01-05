CREATE TABLE IF NOT EXISTS sessions (
    id				INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    user_id 		INTEGER,
    session_token	TEXT,
    expiration		TIMESTAMP
);