import sqlite3

from config import DATABASE_NAME


def get_connection():

    connection = sqlite3.connect(
        DATABASE_NAME,
        timeout=10
    )

    connection.row_factory = sqlite3.Row

    connection.execute(
        "PRAGMA foreign_keys = ON"
    )

    return connection


def initialize_database():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
            )
        """)

        connection.commit()

    finally:

        connection.close()


def create_conversation(title="New Chat"):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO conversations (title)
            VALUES (?)
            """,
            (title,)
        )

        conversation_id = cursor.lastrowid

        connection.commit()

        return conversation_id

    finally:

        connection.close()


def get_conversations():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                title,
                created_at,
                updated_at
            FROM conversations
            ORDER BY updated_at DESC, id DESC
        """)

        return [
            dict(row)
            for row in cursor.fetchall()
        ]

    finally:

        connection.close()


def search_conversations(search_term):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        search_pattern = f"%{search_term}%"

        cursor.execute(
            """
            SELECT DISTINCT
                c.id,
                c.title,
                c.created_at,
                c.updated_at

            FROM conversations c

            LEFT JOIN messages m
                ON c.id = m.conversation_id

            WHERE
                c.title LIKE ?
                OR m.content LIKE ?

            ORDER BY
                c.updated_at DESC,
                c.id DESC
            """,
            (
                search_pattern,
                search_pattern
            )
        )

        return [
            dict(row)
            for row in cursor.fetchall()
        ]

    finally:

        connection.close()


def get_conversation(conversation_id):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                title,
                created_at,
                updated_at
            FROM conversations
            WHERE id = ?
            """,
            (conversation_id,)
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return dict(row)

    finally:

        connection.close()


def get_messages(conversation_id):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                conversation_id,
                role,
                content,
                created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            """,
            (conversation_id,)
        )

        return [
            dict(row)
            for row in cursor.fetchall()
        ]

    finally:

        connection.close()


def save_message(
    conversation_id,
    role,
    content
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO messages (
                conversation_id,
                role,
                content
            )
            VALUES (?, ?, ?)
            """,
            (
                conversation_id,
                role,
                content
            )
        )

        cursor.execute(
            """
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (conversation_id,)
        )

        connection.commit()

        return cursor.lastrowid

    finally:

        connection.close()


def rename_conversation(
    conversation_id,
    title
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE conversations
            SET
                title = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                title,
                conversation_id
            )
        )

        connection.commit()

    finally:

        connection.close()


def delete_conversation(conversation_id):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM messages
            WHERE conversation_id = ?
            """,
            (conversation_id,)
        )

        cursor.execute(
            """
            DELETE FROM conversations
            WHERE id = ?
            """,
            (conversation_id,)
        )

        connection.commit()

    finally:

        connection.close()