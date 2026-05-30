import os
import psycopg2
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))
    return _model


def _get_conn():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def search_similar_chunks(query: str, top_k: int = 5) -> list[dict]:
    """
    Accepts a user's Self-Check query, returns top_k most similar
    chunks with article metadata. Deduplicates to at most 3 unique articles.
    """
    model = _get_model()
    embedding = model.encode(query).tolist()

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    ac.chunk_text,
                    ac.source,
                    a.id,
                    a.title,
                    a.slug,
                    a.specialization,
                    au.first_name,
                    au.last_name,
                    1 - (ac.embedding <=> %s::vector) AS similarity
                FROM article_chunks ac
                JOIN articles a ON ac.article_id = a.id
                JOIN authors au ON a.author_id = au.id
                ORDER BY ac.embedding <=> %s::vector
                LIMIT %s;
                """,
                (embedding, embedding, top_k),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    results = [
        {
            "chunk_text": r[0],
            "source": r[1],
            "article_id": r[2],
            "title": r[3],
            "slug": r[4],
            "specialization": r[5],
            "author_first_name": r[6],
            "author_last_name": r[7],
            "similarity": float(r[8]),
        }
        for r in rows
    ]

    # Deduplicate — keep first occurrence of each article_id, max 3 unique
    seen_ids: set[int] = set()
    unique_articles: list[dict] = []
    for chunk in results:
        if chunk["article_id"] not in seen_ids:
            seen_ids.add(chunk["article_id"])
            unique_articles.append(chunk)
        if len(seen_ids) >= 3:
            break

    return results, unique_articles
