import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from openai import OpenAI

from rag import search_similar_chunks
from self_check_questions import format_questions_for_prompt, get_question_label

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

app = FastAPI(title="HealFish API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

openai_client = OpenAI(
    api_key=os.getenv("OPEN_ROUTER_API_KEY"),
    base_url=OPENROUTER_BASE_URL,
)


def get_conn():
    return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=psycopg2.extras.RealDictCursor)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub)
    except JWTError:
        return None
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, email, points_total, newsletter, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            user = cur.fetchone()
    finally:
        conn.close()
    return dict(user) if user else None


def require_user(user=Depends(get_current_user)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    newsletter: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SelfCheckRequest(BaseModel):
    answers: dict[str, str]  # question_id -> answer text


class QuizAttemptRequest(BaseModel):
    answers: dict[int, str]


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            cur.execute(
                """
                INSERT INTO users (first_name, last_name, email, password_hash, newsletter)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
                """,
                (body.first_name, body.last_name, body.email, hash_password(body.password), body.newsletter),
            )
            user_id = cur.fetchone()["id"]
        conn.commit()
    finally:
        conn.close()
    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token}


@app.post("/auth/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends()):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (form.username,))
            user = cur.fetchone()
    finally:
        conn.close()
    if not user or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["id"])})
    return {"access_token": token}


@app.get("/users/me")
def me(user=Depends(require_user)):
    return user


# ---------------------------------------------------------------------------
# Articles
# ---------------------------------------------------------------------------

@app.get("/articles")
def list_articles(
    specialization: Optional[str] = None,
    for_women: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            filters = []
            params: list = []
            if specialization:
                filters.append("a.specialization = %s")
                params.append(specialization)
            if for_women is not None:
                filters.append("a.for_women = %s")
                params.append(for_women)
            where = ("WHERE " + " AND ".join(filters)) if filters else ""
            cur.execute(
                f"""
                SELECT
                    a.id, a.slug, a.title, a.specialization, a.published_at, a.updated_at,
                    a.source_url, a.quiz_slug, a.for_women,
                    LEFT(a.content, 300) AS excerpt,
                    au.first_name AS author_first_name, au.last_name AS author_last_name,
                    au.specialization AS author_specialization, au.location AS author_location,
                    au.znany_lekarz_url
                FROM articles a
                JOIN authors au ON a.author_id = au.id
                {where}
                ORDER BY a.published_at DESC
                LIMIT %s OFFSET %s
                """,
                [*params, limit, offset],
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@app.get("/articles/{slug}")
def get_article(slug: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    a.id, a.slug, a.title, a.content, a.source_content, a.specialization,
                    a.published_at, a.updated_at, a.source_url, a.quiz_slug, a.for_women,
                    au.first_name AS author_first_name, au.last_name AS author_last_name,
                    au.specialization AS author_specialization, au.location AS author_location,
                    au.znany_lekarz_url
                FROM articles a
                JOIN authors au ON a.author_id = au.id
                WHERE a.slug = %s
                """,
                (slug,),
            )
            article = cur.fetchone()
    finally:
        conn.close()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return dict(article)


# ---------------------------------------------------------------------------
# Quizzes
# ---------------------------------------------------------------------------

@app.get("/quizzes")
def list_quizzes(specialization: Optional[str] = None, for_women: Optional[bool] = None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            filters = []
            params: list = []
            if specialization:
                filters.append("a.specialization = %s")
                params.append(specialization)
            if for_women is not None:
                filters.append("a.for_women = %s")
                params.append(for_women)
            where = ("WHERE " + " AND ".join(filters)) if filters else ""
            cur.execute(
                f"""
                SELECT q.id, q.slug, q.title, q.passing_score, q.points_reward, q.is_active,
                       a.slug AS article_slug, a.specialization, a.for_women, a.published_at AS date
                FROM quizzes q
                JOIN articles a ON q.article_id = a.id
                {where}
                ORDER BY q.id
                """,
                params,
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@app.get("/quizzes/{slug}")
def get_quiz(slug: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT q.id, q.slug, q.title, q.passing_score, q.points_reward, q.is_active,
                       a.slug AS article_slug, a.specialization, a.for_women, a.published_at AS date
                FROM quizzes q
                JOIN articles a ON q.article_id = a.id
                WHERE q.slug = %s
                """,
                (slug,),
            )
            quiz = cur.fetchone()
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")
            quiz = dict(quiz)

            cur.execute(
                """
                SELECT qq.id, qq.question_index, qq.question_text,
                       json_agg(
                           json_build_object(
                               'id', qa.id,
                               'label', qa.answer_label,
                               'text', qa.answer_text
                           ) ORDER BY qa.answer_label
                       ) AS answers
                FROM quiz_questions qq
                JOIN quiz_answers qa ON qa.question_id = qq.id
                WHERE qq.quiz_id = %s
                GROUP BY qq.id, qq.question_index, qq.question_text
                ORDER BY qq.question_index
                """,
                (quiz["id"],),
            )
            quiz["questions"] = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()
    return quiz


@app.post("/quiz/{quiz_slug}/attempt")
def submit_quiz(quiz_slug: str, body: QuizAttemptRequest, user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Fetch quiz
            cur.execute(
                "SELECT id, passing_score, points_reward FROM quizzes WHERE slug = %s AND is_active = TRUE",
                (quiz_slug,),
            )
            quiz = cur.fetchone()
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")

            # One attempt per day
            cur.execute(
                """
                SELECT id FROM user_quiz_attempts
                WHERE user_id = %s AND quiz_id = %s AND attempted_at::DATE = CURRENT_DATE
                """,
                (user["id"], quiz["id"]),
            )
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Already attempted today")

            # Fetch correct answers
            cur.execute(
                """
                SELECT qq.question_index, qa.answer_label
                FROM quiz_questions qq
                JOIN quiz_answers qa ON qa.question_id = qq.id
                WHERE qq.quiz_id = %s AND qa.is_correct = TRUE
                ORDER BY qq.question_index
                """,
                (quiz["id"],),
            )
            correct_map: dict[int, str] = {r["question_index"]: r["answer_label"] for r in cur.fetchall()}

            total = len(correct_map)
            if total == 0:
                raise HTTPException(status_code=500, detail="Quiz has no questions")

            correct_count = sum(
                1 for idx, label in body.answers.items() if correct_map.get(int(idx)) == label
            )
            score_percent = round(correct_count / total * 100)
            passed = score_percent >= quiz["passing_score"]
            points_earned = quiz["points_reward"] if passed else 0

            # Save attempt
            cur.execute(
                """
                INSERT INTO user_quiz_attempts (user_id, quiz_id, score_percent, passed, points_earned)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user["id"], quiz["id"], score_percent, passed, points_earned),
            )

            if passed and points_earned > 0:
                cur.execute(
                    "UPDATE users SET points_total = points_total + %s WHERE id = %s",
                    (points_earned, user["id"]),
                )
                cur.execute(
                    """
                    INSERT INTO user_point_transactions (user_id, amount, reason, reference_id)
                    VALUES (%s, %s, 'quiz_completion', %s)
                    """,
                    (user["id"], points_earned, quiz["id"]),
                )
        conn.commit()
    finally:
        conn.close()

    return {
        "score_percent": score_percent,
        "passed": passed,
        "points_earned": points_earned,
        "correct_answers": correct_map,
    }


# ---------------------------------------------------------------------------
# Self-check (RAG)
# ---------------------------------------------------------------------------

@app.post("/self-check")
def self_check(body: SelfCheckRequest):
    # Build query from filled answers with question context
    answer_parts = []
    user_answers_lines = []
    for q_id, answer in body.answers.items():
        if answer.strip():
            label = get_question_label(q_id)
            answer_parts.append(f"{label}: {answer}")
            user_answers_lines.append(f"- {label}\n  Odpowiedź: {answer}")

    query = " ".join(answer_parts) if answer_parts else " ".join(body.answers.values())
    all_chunks, article_refs = search_similar_chunks(query, top_k=5)
    context = "\n\n".join(c["chunk_text"] for c in all_chunks)

    questions_context = format_questions_for_prompt()
    user_answers_formatted = "\n".join(user_answers_lines) if user_answers_lines else "(brak odpowiedzi)"

    article_titles = "\n".join(f"- {a['title']}" for a in article_refs)

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Jesteś asystentem zdrowotnym aplikacji HealFish. "
                    "Twoje zadanie to napisanie krótkiego, ciepłego podsumowania dla użytkownika "
                    "na podstawie jego odpowiedzi w kwestionariuszu self-check.\n\n"
                    "BEZWZGLĘDNE ZASADY:\n"
                    "1. Zaznacz wprost na początku, że to NIE jest diagnoza medyczna — to wyłącznie subiektywne podsumowanie odczuć użytkownika\n"
                    "2. Nie sugeruj konkretnych chorób ani schorzeń\n"
                    "3. Wspomnij o dopasowanych artykułach (wymień je z tytułu) i zachęć do ich przeczytania\n"
                    "4. Zachęć do umówienia się na profilaktyczne badania u specjalisty w okolicy\n"
                    "5. Pisz ciepło i motywująco, maksymalnie 5 zdań\n"
                    "6. Odpowiadaj wyłącznie po polsku\n\n"
                    f"Pytania kwestionariusza self-check (kontekst):\n{questions_context}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Odpowiedzi użytkownika:\n{user_answers_formatted}\n\n"
                    f"Artykuły dopasowane przez RAG:\n{article_titles}\n\n"
                    f"Fragmenty artykułów (kontekst wiedzy):\n{context}"
                ),
            },
        ],
    )

    # Fetch Trójmiasto specialists matching the found article specializations
    matched_specializations = list({a["specialization"] for a in article_refs})
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, first_name, last_name, specialization, location, znany_lekarz_url
                FROM authors
                WHERE location IN ('Gdańsk', 'Gdynia')
                  AND specialization = ANY(%s)
                ORDER BY specialization, location, id
                """,
                (matched_specializations,),
            )
            specialists = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    return {
        "answer": response.choices[0].message.content,
        "articles": [
            {
                "title": a["title"],
                "slug": a["slug"],
                "specialization": a["specialization"],
                "author": f"{a['author_first_name']} {a['author_last_name']}",
                "similarity": a["similarity"],
            }
            for a in article_refs
        ],
        "specialists": [
            {
                "id": s["id"],
                "name": f"{s['first_name']} {s['last_name']}",
                "specialization": s["specialization"],
                "location": s["location"],
                "znany_lekarz_url": s["znany_lekarz_url"],
            }
            for s in specialists
        ],
    }


# ---------------------------------------------------------------------------
# Discounts
# ---------------------------------------------------------------------------

@app.get("/discounts")
def list_discounts():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT d.id, d.description, d.points_cost, d.discount_percent, d.valid_until,
                       au.first_name AS author_first_name, au.last_name AS author_last_name,
                       au.specialization, au.location, au.znany_lekarz_url
                FROM discounts d
                JOIN authors au ON d.author_id = au.id
                WHERE d.is_active = TRUE AND (d.valid_until IS NULL OR d.valid_until >= CURRENT_DATE)
                ORDER BY d.points_cost
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]
