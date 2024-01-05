CREATE TABLE IF NOT EXISTS users (
    id 				INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    first_name		TEXT,	
    last_name		TEXT,
    email			TEXT,
    password		TEXT,
    date_of_birth   DATE,	
    nickname		TEXT,
    avatar			TEXT,
    about_me		TEXT,
    is_private      BOOLEAN
);