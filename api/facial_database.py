import sqlite3
from pathlib import Path
from typing import Optional


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "face_data.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():
    connection = get_connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS facial_embeddings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                person_type TEXT NOT NULL,
                embedding TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()

    finally:
        connection.close()


def save_embedding(
    person_id: str,
    name: str,
    person_type: str,
    embedding: str,
):
    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO facial_embeddings (
                person_id,
                name,
                person_type,
                embedding
            )
            VALUES (?, ?, ?, ?)
            ON CONFLICT(person_id)
            DO UPDATE SET
                name = excluded.name,
                person_type = excluded.person_type,
                embedding = excluded.embedding,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                person_id,
                name,
                person_type,
                embedding,
            ),
        )

        connection.commit()

    finally:
        connection.close()


def get_all_embeddings():
    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                person_id,
                name,
                person_type,
                embedding
            FROM facial_embeddings
            ORDER BY name
            """
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_embedding(person_id: str) -> Optional[dict]:
    connection = get_connection()

    try:
        row = connection.execute(
            """
            SELECT
                person_id,
                name,
                person_type,
                embedding
            FROM facial_embeddings
            WHERE person_id = ?
            """,
            (person_id,),
        ).fetchone()

        return dict(row) if row else None

    finally:
        connection.close()


def delete_embedding(person_id: str) -> bool:
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            DELETE FROM facial_embeddings
            WHERE person_id = ?
            """,
            (person_id,),
        )

        connection.commit()

        return cursor.rowcount > 0

    finally:
        connection.close()
