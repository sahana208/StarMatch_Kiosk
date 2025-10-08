import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "ai.db"

SCHEMA_SQL = r"""
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    style TEXT,
    image_url TEXT,
    link TEXT,
    design TEXT
);

CREATE TABLE IF NOT EXISTS item_trends (
    item_id INTEGER,
    trend_score REAL DEFAULT 0,
    FOREIGN KEY(item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS celebrities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    vibes TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    event TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id)
);
"""

def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(str(DB_PATH))

def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()

