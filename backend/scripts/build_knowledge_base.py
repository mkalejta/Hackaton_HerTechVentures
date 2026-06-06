#!/usr/bin/env python3
"""
Idempotent script to populate PostgreSQL + pgvector with articles,
source chunks, and quizzes from the data/ directory.

Usage:
    python scripts/build_knowledge_base.py
    # or inside docker:
    docker compose exec backend python /app/scripts/build_knowledge_base.py
"""

import os
import re
import sys
import time
import logging
from pathlib import Path

import psycopg2
import psycopg2.extras
import yaml
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/healthdb")
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 50))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def setup_schema(conn):
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS authors (
                id               SERIAL PRIMARY KEY,
                first_name       VARCHAR(100) NOT NULL,
                last_name        VARCHAR(100) NOT NULL,
                specialization   VARCHAR(100),
                znany_lekarz_url TEXT,
                location         VARCHAR(200),
                UNIQUE (first_name, last_name)
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id             SERIAL PRIMARY KEY,
                slug           VARCHAR(200) UNIQUE NOT NULL,
                title          VARCHAR(500) NOT NULL,
                author_id      INTEGER REFERENCES authors(id),
                published_at   DATE,
                updated_at     DATE,
                specialization VARCHAR(100),
                content        TEXT NOT NULL,
                source_content TEXT,
                source_url     TEXT,
                quiz_slug      VARCHAR(200),
                for_women      BOOLEAN DEFAULT FALSE
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS article_chunks (
                id          SERIAL PRIMARY KEY,
                article_id  INTEGER REFERENCES articles(id) ON DELETE CASCADE,
                chunk_index INTEGER NOT NULL,
                chunk_text  TEXT NOT NULL,
                embedding   vector(384),
                source      VARCHAR(20) DEFAULT 'article'
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id            SERIAL PRIMARY KEY,
                slug          VARCHAR(200) UNIQUE NOT NULL,
                title         VARCHAR(500) NOT NULL,
                article_id    INTEGER REFERENCES articles(id),
                passing_score INTEGER DEFAULT 70,
                points_reward INTEGER DEFAULT 100,
                is_active     BOOLEAN DEFAULT TRUE
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id             SERIAL PRIMARY KEY,
                quiz_id        INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
                question_index INTEGER NOT NULL,
                question_text  TEXT NOT NULL
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS quiz_answers (
                id            SERIAL PRIMARY KEY,
                question_id   INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
                answer_label  CHAR(1) NOT NULL,
                answer_text   TEXT NOT NULL,
                is_correct    BOOLEAN NOT NULL DEFAULT FALSE
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            SERIAL PRIMARY KEY,
                first_name    VARCHAR(100) NOT NULL,
                last_name     VARCHAR(100) NOT NULL,
                email         VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                points_total  INTEGER DEFAULT 0,
                newsletter    BOOLEAN DEFAULT FALSE,
                created_at    TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_quiz_attempts (
                id           SERIAL PRIMARY KEY,
                user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
                quiz_id      INTEGER REFERENCES quizzes(id),
                attempted_at TIMESTAMP DEFAULT NOW(),
                score_percent INTEGER NOT NULL,
                passed       BOOLEAN NOT NULL,
                points_earned INTEGER DEFAULT 0
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_point_transactions (
                id           SERIAL PRIMARY KEY,
                user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount       INTEGER NOT NULL,
                reason       VARCHAR(255),
                reference_id INTEGER,
                created_at   TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS discounts (
                id               SERIAL PRIMARY KEY,
                author_id        INTEGER REFERENCES authors(id),
                description      TEXT NOT NULL,
                points_cost      INTEGER DEFAULT 300,
                discount_percent INTEGER,
                valid_until      DATE,
                is_active        BOOLEAN DEFAULT TRUE
            );
        """)
    conn.commit()
    log.info("Schema ready.")


# ---------------------------------------------------------------------------
# Text chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start += size - overlap
    return chunks


# ---------------------------------------------------------------------------
# Article frontmatter parsing
# ---------------------------------------------------------------------------

REQUIRED_ARTICLE_FIELDS = {"title", "author_first_name", "author_last_name", "specialization", "published_at"}


def parse_article_file(path: Path) -> tuple[dict, str] | None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        log.warning("Skipping %s — missing frontmatter", path.name)
        return None
    parts = text.split("---", 2)
    if len(parts) < 3:
        log.warning("Skipping %s — malformed frontmatter", path.name)
        return None
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        log.warning("Skipping %s — YAML error: %s", path.name, e)
        return None
    missing = REQUIRED_ARTICLE_FIELDS - set(meta.keys())
    if missing:
        log.warning("Skipping %s — missing fields: %s", path.name, missing)
        return None
    content = parts[2].strip()
    if not content:
        log.warning("Skipping %s — empty content", path.name)
        return None
    return meta, content


# ---------------------------------------------------------------------------
# Quiz file parsing
# ---------------------------------------------------------------------------

REQUIRED_QUIZ_FIELDS = {"quiz_slug", "article_slug", "title"}
ANSWER_LABELS = ["A", "B", "C", "D"]


def parse_quiz_blocks(path: Path) -> list[dict]:
    """
    Parse a quiz file that may contain multiple quiz blocks separated by '---'.
    Each block starts with YAML frontmatter enclosed by '---' delimiters.
    """
    text = path.read_text(encoding="utf-8")
    # Split on '---' boundaries; the file starts with '---'
    raw_blocks = re.split(r"^---\s*$", text, flags=re.MULTILINE)
    # raw_blocks[0] is empty string before first '---'
    # then alternating: yaml, questions, yaml, questions, ...
    quizzes = []
    i = 1
    while i + 1 < len(raw_blocks):
        yaml_str = raw_blocks[i].strip()
        questions_str = raw_blocks[i + 1].strip()
        i += 2
        if not yaml_str:
            continue
        try:
            meta = yaml.safe_load(yaml_str) or {}
        except yaml.YAMLError as e:
            log.warning("Skipping quiz block in %s — YAML error: %s", path.name, e)
            continue
        missing = REQUIRED_QUIZ_FIELDS - set(meta.keys())
        if missing:
            log.warning("Skipping quiz block in %s — missing fields: %s", path.name, missing)
            continue
        questions = parse_quiz_questions(questions_str, path.name, meta.get("quiz_slug", ""))
        if not questions:
            log.warning("Skipping quiz '%s' in %s — no valid questions", meta.get("quiz_slug"), path.name)
            continue
        quizzes.append({"meta": meta, "questions": questions})
    return quizzes


def parse_quiz_questions(text: str, filename: str, quiz_slug: str) -> list[dict]:
    """
    Parse quiz questions from text block. Expected format:
        Pytanie N:
        Question text?
        A) Answer A
        B) Answer B
        C) Answer C
        D) Answer D
        Odpowiedź: X
    """
    questions = []
    # Split into question blocks by "Pytanie N:"
    blocks = re.split(r"Pytanie\s+\d+\s*:", text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if len(lines) < 6:
            continue

        # First line(s) before answer options are the question text
        answer_lines = {}
        correct_answer = None
        question_lines = []
        for line in lines:
            m_ans = re.match(r"^([A-D])\)\s+(.+)$", line)
            m_correct = re.match(r"^Odpowiedź:\s*([A-D])$", line, re.IGNORECASE)
            if m_ans:
                answer_lines[m_ans.group(1)] = m_ans.group(2)
            elif m_correct:
                correct_answer = m_correct.group(1).upper()
            else:
                if not answer_lines:  # still in question text
                    question_lines.append(line)

        question_text = " ".join(question_lines).strip()
        if not question_text or len(answer_lines) < 4 or correct_answer is None:
            log.warning("Malformed question block in %s / %s — skipping", filename, quiz_slug)
            continue
        if correct_answer not in answer_lines:
            log.warning("Correct answer '%s' not in options in %s / %s", correct_answer, filename, quiz_slug)
            continue

        questions.append({
            "text": question_text,
            "answers": answer_lines,
            "correct": correct_answer,
        })
    return questions


# ---------------------------------------------------------------------------
# DB insert helpers
# ---------------------------------------------------------------------------

def upsert_author(cur, meta: dict) -> int:
    cur.execute(
        """
        INSERT INTO authors (first_name, last_name, specialization, znany_lekarz_url, location)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (first_name, last_name) DO UPDATE
            SET specialization   = EXCLUDED.specialization,
                znany_lekarz_url = EXCLUDED.znany_lekarz_url,
                location         = EXCLUDED.location
        RETURNING id
        """,
        (
            meta["author_first_name"],
            meta["author_last_name"],
            meta.get("specialization"),
            meta.get("znany_lekarz_url") or None,
            meta.get("location") or None,
        ),
    )
    return cur.fetchone()["id"]


def upsert_article(cur, slug: str, meta: dict, content: str, author_id: int) -> int:
    cur.execute(
        """
        INSERT INTO articles
            (slug, title, author_id, published_at, updated_at, specialization,
             content, source_url, quiz_slug, for_women)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (slug) DO UPDATE
            SET title          = EXCLUDED.title,
                author_id      = EXCLUDED.author_id,
                published_at   = EXCLUDED.published_at,
                specialization = EXCLUDED.specialization,
                content        = EXCLUDED.content,
                source_url     = EXCLUDED.source_url,
                quiz_slug      = EXCLUDED.quiz_slug,
                for_women      = EXCLUDED.for_women
        RETURNING id
        """,
        (
            slug,
            meta["title"],
            author_id,
            meta.get("published_at"),
            meta.get("updated_at"),
            meta.get("specialization"),
            content,
            meta.get("source_url") or None,
            meta.get("quiz_slug") or None,
            bool(meta.get("for_women", False)),
        ),
    )
    return cur.fetchone()["id"]


def insert_chunks(cur, model, article_id: int, text: str, source: str) -> int:
    # Delete old chunks for this article+source
    cur.execute(
        "DELETE FROM article_chunks WHERE article_id = %s AND source = %s",
        (article_id, source),
    )
    chunks = chunk_text(text)
    if not chunks:
        return 0
    embeddings = model.encode(chunks, show_progress_bar=False)
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO article_chunks (article_id, chunk_index, chunk_text, embedding, source)
        VALUES %s
        """,
        [
            (article_id, idx, chunk, emb.tolist(), source)
            for idx, (chunk, emb) in enumerate(zip(chunks, embeddings))
        ],
        template="(%s, %s, %s, %s::vector, %s)",
    )
    return len(chunks)


def upsert_quiz(cur, meta: dict, article_id: int, questions: list[dict]) -> None:
    cur.execute(
        """
        INSERT INTO quizzes (slug, title, article_id, passing_score, points_reward)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (slug) DO UPDATE
            SET title         = EXCLUDED.title,
                article_id    = EXCLUDED.article_id,
                passing_score = EXCLUDED.passing_score,
                points_reward = EXCLUDED.points_reward
        RETURNING id
        """,
        (
            meta["quiz_slug"],
            meta["title"],
            article_id,
            int(meta.get("passing_score", 70)),
            int(meta.get("points", 100)),
        ),
    )
    quiz_id = cur.fetchone()["id"]

    # Delete old questions (cascades to answers)
    cur.execute("DELETE FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))

    for idx, q in enumerate(questions, start=1):
        cur.execute(
            "INSERT INTO quiz_questions (quiz_id, question_index, question_text) VALUES (%s, %s, %s) RETURNING id",
            (quiz_id, idx, q["text"]),
        )
        question_id = cur.fetchone()["id"]
        for label in ANSWER_LABELS:
            if label not in q["answers"]:
                continue
            cur.execute(
                "INSERT INTO quiz_answers (question_id, answer_label, answer_text, is_correct) VALUES (%s, %s, %s, %s)",
                (question_id, label, q["answers"][label], label == q["correct"]),
            )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    start = time.time()
    log.info("Connecting to database...")
    conn = get_conn()
    setup_schema(conn)

    log.info("Loading embedding model: %s", EMBEDDING_MODEL)
    model = SentenceTransformer(EMBEDDING_MODEL)

    articles_dir = DATA_DIR / "articles"
    sources_dir = DATA_DIR / "sources"
    # Support both 'quizzes' and 'quizes' directory names
    quizzes_dir = DATA_DIR / "quizzes" if (DATA_DIR / "quizzes").exists() else DATA_DIR / "quizes"

    article_count = 0
    chunk_count = 0

    article_files = sorted(articles_dir.glob("*.txt")) if articles_dir.exists() else []
    log.info("Processing %d article files...", len(article_files))

    for path in tqdm(article_files, desc="Articles"):
        parsed = parse_article_file(path)
        if parsed is None:
            continue
        meta, content = parsed
        slug = path.stem

        with conn.cursor() as cur:
            author_id = upsert_author(cur, meta)
            article_id = upsert_article(cur, slug, meta, content, author_id)
            n = insert_chunks(cur, model, article_id, content, "article")
            chunk_count += n

            # Source file
            source_path = sources_dir / f"{slug}-source.txt"
            if source_path.exists():
                source_text = source_path.read_text(encoding="utf-8").strip()
                if source_text:
                    # Update source_content column
                    cur.execute(
                        "UPDATE articles SET source_content = %s WHERE id = %s",
                        (source_text, article_id),
                    )
                    n = insert_chunks(cur, model, article_id, source_text, "source")
                    chunk_count += n

        conn.commit()
        article_count += 1

    # HNSW index for fast cosine search
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS article_chunks_embedding_hnsw
            ON article_chunks USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
            """
        )
    conn.commit()
    log.info("HNSW index created.")

    # Phase 2: Quizzes
    quiz_count = 0
    question_count = 0

    quiz_files = sorted(quizzes_dir.glob("*.txt")) if quizzes_dir.exists() else []
    log.info("Processing %d quiz files...", len(quiz_files))

    for path in tqdm(quiz_files, desc="Quizzes"):
        quiz_blocks = parse_quiz_blocks(path)
        for block in quiz_blocks:
            meta = block["meta"]
            article_slug = meta["article_slug"]
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM articles WHERE slug = %s", (article_slug,))
                row = cur.fetchone()
                if not row:
                    log.warning("Article '%s' not found for quiz '%s' — skipping", article_slug, meta["quiz_slug"])
                    continue
                article_id = row["id"]
                upsert_quiz(cur, meta, article_id, block["questions"])
            conn.commit()
            quiz_count += 1
            question_count += len(block["questions"])

    ensure_manual_data(conn)

    conn.close()
    elapsed = time.time() - start
    print("\n" + "=" * 50)
    print(f"  Articles indexed : {article_count}")
    print(f"  Chunks created   : {chunk_count}")
    print(f"  Quizzes indexed  : {quiz_count}")
    print(f"  Questions total  : {question_count}")
    print(f"  Time elapsed     : {elapsed:.1f}s")
    print("=" * 50)


def ensure_manual_data(conn) -> None:
    """Idempotent post-seed fixes: quiz_slug links and Trójmiasto specialists."""
    with conn.cursor() as cur:
        # Link articles to their quizzes
        quiz_links = [
            ("quiz-cwiczenia-przewlekly-bol-plecow",       "bol-krzyz-ruch-sprzymierzeniec"),
            ("quiz-spacery-bol-plecow",                    "spacer-po-epizodzie-bolu-plecow"),
            ("quiz-cwiczenia-profilaktyka-plecy",           "cwiczenia-profilaktyka-bolu-plecow"),
            ("quiz-chodzenie-kregoslup",                    "ile-chodzic-dziennie-kregoslup"),
            ("quiz-praca-siedzaca-bol-plecow",              "praca-siedzaca-zmiana-pozycji"),
            ("quiz-nierownosci-plci-badania-medyczne",      "nierownosci-plci-badania-medyczne"),
            ("quiz-wplyw-plci-farmakokinetyka",             "wplyw-plci-farmakokinetyka"),
        ]
        for quiz_slug, article_slug in quiz_links:
            cur.execute(
                "UPDATE articles SET quiz_slug = %s WHERE slug = %s AND (quiz_slug IS NULL OR quiz_slug != %s)",
                (quiz_slug, article_slug, quiz_slug),
            )

        # znany_lekarz_url for existing Gdańsk physio authors
        cur.execute(
            """
            UPDATE authors
            SET znany_lekarz_url = 'https://www.znany-lekarz.pl/lekarze/fizjoterapeuta/gdansk'
            WHERE specialization = 'Fizjoterapia' AND location = 'Gdańsk'
              AND (znany_lekarz_url IS NULL OR znany_lekarz_url = '')
            """
        )

        # Trójmiasto specialists
        trojmiasto = [
            ("Agnieszka", "Wojciechowska", "Fizjoterapia",   "Gdynia", "https://www.znany-lekarz.pl/lekarze/fizjoterapeuta/gdynia"),
            ("Joanna",    "Kamińska",      "Endokrynologia", "Gdańsk", "https://www.znany-lekarz.pl/lekarze/endokrynolog/gdansk"),
            ("Piotr",     "Szymański",     "Endokrynologia", "Gdynia", "https://www.znany-lekarz.pl/lekarze/endokrynolog/gdynia"),
            ("Marta",     "Kowalik",       "Stomatologia",   "Gdańsk", "https://www.znany-lekarz.pl/lekarze/stomatolog/gdansk"),
            ("Jakub",     "Lewandowski",   "Stomatologia",   "Gdynia", "https://www.znany-lekarz.pl/lekarze/stomatolog/gdynia"),
        ]
        for first, last, spec, loc, url in trojmiasto:
            cur.execute(
                """
                INSERT INTO authors (first_name, last_name, specialization, location, znany_lekarz_url)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (first_name, last_name) DO UPDATE
                    SET specialization   = EXCLUDED.specialization,
                        location         = EXCLUDED.location,
                        znany_lekarz_url = EXCLUDED.znany_lekarz_url
                """,
                (first, last, spec, loc, url),
            )
    conn.commit()
    log.info("Manual data fixes applied.")


if __name__ == "__main__":
    main()
