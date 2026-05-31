import os
import re
from contextlib import asynccontextmanager
from datetime import date, datetime, time, timedelta, timezone
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


def run_migrations():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Base user health fields
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS weight NUMERIC(5,1)")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS height NUMERIC(5,1)")
            # Doctor profile fields
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_doctor BOOLEAN DEFAULT FALSE")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(100)")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100)")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS pwz_number VARCHAR(50)")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(50) DEFAULT ''")
            # Legacy: keep authors.user_id to track migration progress
            cur.execute("ALTER TABLE authors ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
            cur.execute("ALTER TABLE authors ADD COLUMN IF NOT EXISTS street_address TEXT")

            # --- Migrate all authors without a user account into users ---
            _imported_hash = hash_password("HEALFISH_IMPORTED_NO_LOGIN")
            cur.execute(
                "SELECT id, first_name, last_name, specialization, street_address, location "
                "FROM authors WHERE user_id IS NULL"
            )
            for a in cur.fetchall():
                placeholder_email = f"imported.{a['id']}@healfish.placeholder"
                cur.execute("SELECT id FROM users WHERE email = %s", (placeholder_email,))
                existing = cur.fetchone()
                if existing:
                    cur.execute(
                        "UPDATE authors SET user_id = %s WHERE id = %s AND user_id IS NULL",
                        (existing["id"], a["id"]),
                    )
                else:
                    cur.execute(
                        """INSERT INTO users (first_name, last_name, email, password_hash, is_doctor,
                                             specialty, street_address, location, newsletter, points_total)
                           VALUES (%s, %s, %s, %s, TRUE, %s, %s, %s, FALSE, 0) RETURNING id""",
                        (a["first_name"], a["last_name"], placeholder_email, _imported_hash,
                         a["specialization"], a.get("street_address"), a.get("location")),
                    )
                    row = cur.fetchone()
                    if row:
                        cur.execute("UPDATE authors SET user_id = %s WHERE id = %s", (row["id"], a["id"]))

            # Link articles and discounts directly to users
            cur.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
            cur.execute("""
                UPDATE articles a SET user_id = au.user_id
                FROM authors au
                WHERE au.id = a.author_id AND a.user_id IS NULL AND au.user_id IS NOT NULL
            """)
            cur.execute("ALTER TABLE discounts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
            cur.execute("""
                UPDATE discounts d SET user_id = au.user_id
                FROM authors au
                WHERE au.id = d.author_id AND d.user_id IS NULL AND au.user_id IS NOT NULL
            """)

            # Remove specialists not from Gdańsk or Gdynia that are not article/discount authors
            cur.execute("""
                DELETE FROM authors
                WHERE location IS NOT NULL
                  AND location NOT IN ('Gdańsk', 'Gdynia')
                  AND id NOT IN (SELECT author_id FROM articles WHERE author_id IS NOT NULL)
                  AND id NOT IN (SELECT author_id FROM discounts WHERE author_id IS NOT NULL)
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS doctor_availability (
                    id SERIAL PRIMARY KEY,
                    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    UNIQUE(doctor_id, day_of_week)
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id SERIAL PRIMARY KEY,
                    doctor_id INTEGER NOT NULL REFERENCES users(id),
                    patient_id INTEGER REFERENCES users(id),
                    appointment_date DATE NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    patient_first_name VARCHAR(100) NOT NULL,
                    patient_last_name VARCHAR(100) NOT NULL,
                    patient_phone VARCHAR(30),
                    description TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)

            # Seed one discount per medical specialty if discounts table is empty
            cur.execute("SELECT COUNT(*) AS cnt FROM discounts WHERE is_active = TRUE")
            if cur.fetchone()["cnt"] == 0:
                specialty_configs = {
                    "Endokrynologia": (500, 10),
                    "Stomatologia": (700, 15),
                    "Fizjoterapia": (500, 10),
                    "Kardiologia": (1000, 20),
                    "Ginekologia": (700, 15),
                    "Dermatologia": (500, 10),
                    "Neurologia": (1000, 20),
                    "Ortopedia": (700, 15),
                    "Psychiatria": (1000, 20),
                    "Urologia": (700, 15),
                    "Chirurgia": (1000, 20),
                    "Okulistyka": (500, 10),
                    "Pediatria": (500, 10),
                    "Radiologia": (700, 15),
                    "Reumatologia": (1000, 20),
                }
                cur.execute(
                    """
                    SELECT DISTINCT ON (specialty) id, specialty
                    FROM users
                    WHERE is_doctor = TRUE AND specialty IS NOT NULL AND specialty != ''
                      AND specialty != 'Farmakologia'
                    ORDER BY specialty, id
                    """
                )
                doctors_by_spec = cur.fetchall()
                for doc in doctors_by_spec:
                    spec = doc["specialty"]
                    cost, pct = specialty_configs.get(spec, (500, 10))
                    cur.execute(
                        """
                        INSERT INTO discounts (user_id, description, points_cost, discount_percent, is_active)
                        VALUES (%s, %s, %s, %s, TRUE)
                        """,
                        (doc["id"], f"Konsultacja — {spec}", cost, pct),
                    )

        conn.commit()
    except Exception as e:
        print(f"[migration] error: {e}")
        conn.rollback()
    finally:
        conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    yield


app = FastAPI(title="HealFish API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
                """SELECT id, first_name, last_name, email, points_total, newsletter, created_at,
                          age, gender, weight, height, is_doctor, specialty, street_address, bio, location
                   FROM users WHERE id = %s""",
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


def require_doctor(user=Depends(require_user)):
    if not user.get("is_doctor"):
        raise HTTPException(status_code=403, detail="Only doctors can perform this action")
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


class DoctorRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    specialty: str
    street_address: str
    pwz_number: str
    title: Optional[str] = None
    bio: Optional[str] = None
    newsletter: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    specialty: Optional[str] = None
    street_address: Optional[str] = None
    bio: Optional[str] = None


class SelfCheckRequest(BaseModel):
    answers: dict[str, str]
    user_profile: Optional[dict] = None


class QuizAttemptRequest(BaseModel):
    answers: dict[int, str]


class AvailabilityDay(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str


class SetAvailabilityRequest(BaseModel):
    slots: list[AvailabilityDay]


class BookAppointmentRequest(BaseModel):
    doctor_id: int
    appointment_date: str
    start_time: str
    patient_first_name: str
    patient_last_name: str
    patient_phone: Optional[str] = None
    description: Optional[str] = None


class RescheduleRequest(BaseModel):
    appointment_date: str
    start_time: str


class CreateArticleRequest(BaseModel):
    title: str
    content: str
    for_women: bool = False
    source_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PL_CHARS = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")


def slugify(text: str) -> str:
    text = text.translate(_PL_CHARS).lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text or "artykul"


def generate_time_slots(start: time, end: time, duration: int = 20) -> list[time]:
    slots = []
    dt = datetime.combine(date.today(), start)
    end_dt = datetime.combine(date.today(), end)
    while dt + timedelta(minutes=duration) <= end_dt:
        slots.append(dt.time())
        dt += timedelta(minutes=duration)
    return slots


def fmt_appointment(r: dict) -> dict:
    return {
        "id": r["id"],
        "appointment_date": r["appointment_date"].strftime("%Y-%m-%d"),
        "start_time": r["start_time"].strftime("%H:%M"),
        "end_time": r["end_time"].strftime("%H:%M"),
        "status": r["status"],
        "patient_first_name": r["patient_first_name"],
        "patient_last_name": r["patient_last_name"],
        "patient_phone": r.get("patient_phone"),
        "description": r.get("description"),
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
    }


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
                """INSERT INTO users (first_name, last_name, email, password_hash, newsletter)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (body.first_name, body.last_name, body.email, hash_password(body.password), body.newsletter),
            )
            user_id = cur.fetchone()["id"]
        conn.commit()
    finally:
        conn.close()
    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token}


@app.post("/auth/register/doctor", response_model=TokenResponse)
def register_doctor(body: DoctorRegisterRequest):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            cur.execute(
                """INSERT INTO users (first_name, last_name, email, password_hash, newsletter,
                                     is_doctor, specialty, street_address, bio, location, pwz_number, title)
                   VALUES (%s, %s, %s, %s, %s, TRUE, %s, %s, %s, 'Gdańsk', %s, %s) RETURNING id""",
                (body.first_name, body.last_name, body.email, hash_password(body.password),
                 body.newsletter, body.specialty, body.street_address, body.bio, body.pwz_number,
                 body.title or ""),
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


@app.patch("/users/me")
def update_profile(body: UpdateProfileRequest, user=Depends(require_user)):
    updates: dict = {}
    if body.first_name is not None:
        updates["first_name"] = body.first_name
    if body.last_name is not None:
        updates["last_name"] = body.last_name
    if body.age is not None:
        updates["age"] = body.age
    if body.gender is not None:
        updates["gender"] = body.gender
    if body.weight is not None:
        updates["weight"] = body.weight
    if body.height is not None:
        updates["height"] = body.height
    if body.specialty is not None:
        updates["specialty"] = body.specialty
    if body.street_address is not None:
        updates["street_address"] = body.street_address
    if body.bio is not None:
        updates["bio"] = body.bio

    if not updates:
        return user

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [user["id"]]

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE users SET {set_clause} WHERE id = %s", values)
            cur.execute(
                """SELECT id, first_name, last_name, email, points_total, newsletter, created_at,
                          age, gender, weight, height, is_doctor, specialty, street_address, bio, location
                   FROM users WHERE id = %s""",
                (user["id"],),
            )
            updated = cur.fetchone()
        conn.commit()
    finally:
        conn.close()
    return dict(updated)


# ---------------------------------------------------------------------------
# Articles
# ---------------------------------------------------------------------------

@app.post("/articles")
def create_article(body: CreateArticleRequest, user=Depends(require_doctor)):
    base_slug = slugify(body.title)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            slug = base_slug
            counter = 1
            while True:
                cur.execute("SELECT id FROM articles WHERE slug = %s", (slug,))
                if not cur.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            cur.execute(
                """INSERT INTO articles (slug, title, content, specialization, user_id,
                          for_women, source_url, published_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id, slug""",
                (slug, body.title, body.content, user["specialty"] or "Ogólne",
                 user["id"], body.for_women, body.source_url),
            )
            result = cur.fetchone()
        conn.commit()
    finally:
        conn.close()
    return {"id": result["id"], "slug": result["slug"]}


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
                SELECT a.id, a.slug, a.title, a.specialization, a.published_at, a.updated_at,
                       a.source_url, a.quiz_slug, a.for_women,
                       LEFT(a.content, 300) AS excerpt,
                       u.first_name AS author_first_name, u.last_name AS author_last_name,
                       u.specialty AS author_specialization, u.location AS author_location,
                       a.user_id AS author_user_id
                FROM articles a
                JOIN users u ON a.user_id = u.id
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
                SELECT a.id, a.slug, a.title, a.content, a.source_content, a.specialization,
                       a.published_at, a.updated_at, a.source_url, a.quiz_slug, a.for_women,
                       u.id AS author_id,
                       u.first_name AS author_first_name, u.last_name AS author_last_name,
                       u.specialty AS author_specialization, u.location AS author_location,
                       u.id AS author_user_id
                FROM articles a
                JOIN users u ON a.user_id = u.id
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


MAX_DAILY_ATTEMPTS = 3


@app.get("/quiz/{quiz_slug}/status")
def quiz_status(quiz_slug: str, user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM quizzes WHERE slug = %s", (quiz_slug,))
            quiz = cur.fetchone()
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE attempted_at::DATE = CURRENT_DATE) AS attempts_today,
                    COALESCE(BOOL_OR(passed), FALSE) AS ever_passed
                FROM user_quiz_attempts
                WHERE user_id = %s AND quiz_id = %s
                """,
                (user["id"], quiz["id"]),
            )
            row = cur.fetchone()
            attempts_today = row["attempts_today"]
            ever_passed = row["ever_passed"]
    finally:
        conn.close()
    can_retry = (not ever_passed) and (attempts_today < MAX_DAILY_ATTEMPTS)
    return {
        "attempts_today": attempts_today,
        "max_attempts": MAX_DAILY_ATTEMPTS,
        "can_retry": can_retry,
        "ever_passed": ever_passed,
    }


@app.post("/quiz/{quiz_slug}/attempt")
def submit_quiz(quiz_slug: str, body: QuizAttemptRequest, user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, passing_score, points_reward FROM quizzes WHERE slug = %s AND is_active = TRUE",
                (quiz_slug,),
            )
            quiz = cur.fetchone()
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")

            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE attempted_at::DATE = CURRENT_DATE) AS attempts_today,
                    COALESCE(BOOL_OR(passed), FALSE) AS ever_passed
                FROM user_quiz_attempts
                WHERE user_id = %s AND quiz_id = %s
                """,
                (user["id"], quiz["id"]),
            )
            row = cur.fetchone()
            attempts_today = row["attempts_today"]
            ever_passed = row["ever_passed"]
            if ever_passed:
                raise HTTPException(status_code=400, detail="Quiz już zaliczony. Nie można go powtórzyć.")
            if attempts_today >= MAX_DAILY_ATTEMPTS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Wyczerpano limit prób na dziś ({MAX_DAILY_ATTEMPTS}/{MAX_DAILY_ATTEMPTS}). Spróbuj jutro.",
                )

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
            passed = correct_count * 3 >= total * 2
            points_earned = quiz["points_reward"] if passed else 0

            cur.execute(
                """INSERT INTO user_quiz_attempts (user_id, quiz_id, score_percent, passed, points_earned)
                   VALUES (%s, %s, %s, %s, %s)""",
                (user["id"], quiz["id"], score_percent, passed, points_earned),
            )

            if passed and points_earned > 0:
                cur.execute(
                    "UPDATE users SET points_total = points_total + %s WHERE id = %s",
                    (points_earned, user["id"]),
                )
                cur.execute(
                    """INSERT INTO user_point_transactions (user_id, amount, reason, reference_id)
                       VALUES (%s, %s, 'quiz_completion', %s)""",
                    (user["id"], points_earned, quiz["id"]),
                )
        conn.commit()
    finally:
        conn.close()

    new_attempts_today = attempts_today + 1
    can_retry = (not passed) and (new_attempts_today < MAX_DAILY_ATTEMPTS)
    return {
        "score_percent": score_percent,
        "passed": passed,
        "points_earned": points_earned,
        "correct_answers": correct_map,
        "attempts_today": new_attempts_today,
        "max_attempts": MAX_DAILY_ATTEMPTS,
        "can_retry": can_retry,
        "ever_passed": passed,
    }


# ---------------------------------------------------------------------------
# Self-check (RAG)
# ---------------------------------------------------------------------------

@app.post("/self-check")
def self_check(body: SelfCheckRequest, user=Depends(get_current_user)):
    answer_parts = []
    user_answers_lines = []
    for q_id, answer in body.answers.items():
        if answer.strip():
            label = get_question_label(q_id)
            answer_parts.append(f"{label}: {answer}")
            user_answers_lines.append(f"- {label}\n  Odpowiedź: {answer}")

    query = " ".join(answer_parts) if answer_parts else " ".join(body.answers.values())
    all_chunks, article_refs = search_similar_chunks(query, top_k=3)
    context = "\n\n".join(c["chunk_text"] for c in all_chunks)

    questions_context = format_questions_for_prompt()
    user_answers_formatted = "\n".join(user_answers_lines) if user_answers_lines else "(brak odpowiedzi)"
    article_titles = "\n".join(f"- {a['title']}" for a in article_refs)

    profile_context = ""
    if body.user_profile:
        parts = []
        if body.user_profile.get("age"):
            parts.append(f"Wiek: {body.user_profile['age']} lat")
        if body.user_profile.get("gender"):
            parts.append(f"Płeć: {body.user_profile['gender']}")
        if body.user_profile.get("weight"):
            parts.append(f"Waga: {body.user_profile['weight']} kg")
        if body.user_profile.get("height"):
            parts.append(f"Wzrost: {body.user_profile['height']} cm")
        if parts:
            profile_context = "\nDane profilowe użytkownika:\n" + "\n".join(parts) + "\n"

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
                    "6. Odpowiadaj wyłącznie po polsku\n"
                    "7. Jeśli podano dane profilowe użytkownika, uwzględnij je w kontekście odpowiedzi\n\n"
                    f"Pytania kwestionariusza self-check (kontekst):\n{questions_context}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"{profile_context}"
                    f"Odpowiedzi użytkownika:\n{user_answers_formatted}\n\n"
                    f"Artykuły dopasowane przez RAG:\n{article_titles}\n\n"
                    f"Fragmenty artykułów (kontekst wiedzy):\n{context}"
                ),
            },
        ],
    )

    matched_specializations = list({a["specialization"] for a in article_refs})
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, first_name, last_name, specialty AS specialization, location, street_address
                FROM users
                WHERE is_doctor = TRUE
                  AND location IN ('Gdańsk', 'Gdynia')
                  AND specialty = ANY(%s)
                ORDER BY specialty, location, id
                LIMIT 3
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
            for a in article_refs[:3]
        ],
        "specialists": [
            {
                "id": s["id"],
                "name": f"{s['first_name']} {s['last_name']}",
                "specialization": s["specialization"],
                "location": s["location"],
                "street_address": s.get("street_address"),
                "user_id": s["id"],
            }
            for s in specialists
        ],
    }


# ---------------------------------------------------------------------------
# Specialists
# ---------------------------------------------------------------------------

@app.get("/specialists")
def list_specialists(for_women: Optional[bool] = None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            filters = ["is_doctor = TRUE", "location IN ('Gdańsk', 'Gdynia')"]
            if for_women:
                filters.append("first_name ILIKE '%a'")
            where = "WHERE " + " AND ".join(filters)
            cur.execute(
                f"""
                SELECT id, first_name, last_name, COALESCE(title, '') AS title,
                       specialty AS specialization, location, street_address
                FROM users
                {where}
                ORDER BY specialty, location, id
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {
            "id": r["id"],
            "name": " ".join(p for p in [r["title"], r["first_name"], r["last_name"]] if p),
            "specialization": r["specialization"],
            "location": r["location"],
            "street_address": r.get("street_address"),
            "user_id": r["id"],
        }
        for r in rows
    ]


@app.get("/specializations")
def list_specializations():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT specialty FROM users
                WHERE is_doctor = TRUE AND specialty IS NOT NULL AND specialty != ''
                  AND specialty != 'Farmakologia'
                ORDER BY specialty
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [r["specialty"] for r in rows]


# ---------------------------------------------------------------------------
# Discounts
# ---------------------------------------------------------------------------

@app.delete("/articles/{slug}")
def delete_article(slug: str, user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, user_id FROM articles WHERE slug = %s", (slug,))
            article = cur.fetchone()
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            if article["user_id"] != user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized to delete this article")
            cur.execute("DELETE FROM articles WHERE slug = %s", (slug,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "deleted"}


@app.get("/discounts")
def list_discounts():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT d.id, d.description, d.points_cost, d.discount_percent, d.valid_until,
                       u.first_name AS author_first_name, u.last_name AS author_last_name,
                       u.specialty AS specialization, u.location
                FROM discounts d
                JOIN users u ON d.user_id = u.id
                WHERE d.is_active = TRUE AND (d.valid_until IS NULL OR d.valid_until >= CURRENT_DATE)
                ORDER BY d.points_cost
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Doctor availability
# ---------------------------------------------------------------------------

@app.get("/doctors/me/availability")
def get_my_availability(user=Depends(require_doctor)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT day_of_week, start_time, end_time FROM doctor_availability WHERE doctor_id = %s ORDER BY day_of_week",
                (user["id"],),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {"day_of_week": r["day_of_week"], "start_time": r["start_time"].strftime("%H:%M"),
         "end_time": r["end_time"].strftime("%H:%M")}
        for r in rows
    ]


@app.put("/doctors/me/availability")
def set_my_availability(body: SetAvailabilityRequest, user=Depends(require_doctor)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM doctor_availability WHERE doctor_id = %s", (user["id"],))
            for slot in body.slots:
                cur.execute(
                    """INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
                       VALUES (%s, %s, %s, %s)""",
                    (user["id"], slot.day_of_week, slot.start_time, slot.end_time),
                )
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}


@app.get("/doctors/{doctor_id}/slots")
def get_doctor_slots(doctor_id: int, date: str):
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
    day_of_week = d.weekday()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s AND is_doctor = TRUE", (doctor_id,))
            if not cur.fetchone():
                return {"slots": []}
            cur.execute(
                "SELECT start_time, end_time FROM doctor_availability WHERE doctor_id = %s AND day_of_week = %s",
                (doctor_id, day_of_week),
            )
            avail = cur.fetchone()
            if not avail:
                return {"slots": []}
            all_slots = generate_time_slots(avail["start_time"], avail["end_time"])
            cur.execute(
                """SELECT start_time FROM appointments
                   WHERE doctor_id = %s AND appointment_date = %s AND status = 'scheduled'""",
                (doctor_id, d),
            )
            booked = {r["start_time"] for r in cur.fetchall()}
            available = [s for s in all_slots if s not in booked]
    finally:
        conn.close()
    return {"slots": [s.strftime("%H:%M") for s in available]}


@app.get("/doctors/{doctor_id}")
def get_doctor_profile(doctor_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, first_name, last_name, specialty AS specialization,
                          location, street_address, bio
                   FROM users WHERE id = %s AND is_doctor = TRUE""",
                (doctor_id,),
            )
            doctor = cur.fetchone()
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")
            result = {
                "id": doctor["id"],
                "name": f"{doctor['first_name']} {doctor['last_name']}",
                "specialization": doctor["specialization"],
                "location": doctor["location"],
                "street_address": doctor.get("street_address"),
                "user_id": doctor["id"],
                "bio": doctor.get("bio"),
                "is_bookable": True,
                "schedule": [],
            }
            cur.execute(
                "SELECT day_of_week, start_time, end_time FROM doctor_availability WHERE doctor_id = %s ORDER BY day_of_week",
                (doctor_id,),
            )
            result["schedule"] = [
                {"day_of_week": r["day_of_week"], "start_time": r["start_time"].strftime("%H:%M"),
                 "end_time": r["end_time"].strftime("%H:%M")}
                for r in cur.fetchall()
            ]
    finally:
        conn.close()
    return result


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

@app.post("/appointments")
def book_appointment(body: BookAppointmentRequest, user=Depends(require_user)):
    try:
        d = datetime.strptime(body.appointment_date, "%Y-%m-%d").date()
        t = datetime.strptime(body.start_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or time format")
    end_t = (datetime.combine(date.today(), t) + timedelta(minutes=20)).time()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s AND is_doctor = TRUE", (body.doctor_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Doctor not found")
            day_of_week = d.weekday()
            cur.execute(
                "SELECT id FROM doctor_availability WHERE doctor_id = %s AND day_of_week = %s",
                (body.doctor_id, day_of_week),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Doctor not available on this day")
            cur.execute(
                """SELECT id FROM appointments
                   WHERE doctor_id = %s AND appointment_date = %s AND start_time = %s AND status = 'scheduled'""",
                (body.doctor_id, d, t),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="This slot is already booked")
            cur.execute(
                """INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time,
                          patient_first_name, patient_last_name, patient_phone, description)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (body.doctor_id, user["id"], d, t, end_t,
                 body.patient_first_name, body.patient_last_name,
                 body.patient_phone, body.description),
            )
            appointment_id = cur.fetchone()["id"]
        conn.commit()
    finally:
        conn.close()
    return {"id": appointment_id, "status": "scheduled"}


@app.get("/appointments/my")
def my_appointments(user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
                          a.patient_first_name, a.patient_last_name, a.patient_phone, a.description,
                          a.created_at, a.patient_id,
                          u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
                          u.specialty AS specialization, u.id AS doctor_id
                   FROM appointments a
                   JOIN users u ON u.id = a.doctor_id
                   WHERE a.patient_id = %s
                   ORDER BY a.appointment_date DESC, a.start_time DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [
        {**fmt_appointment(r),
         "doctor_first_name": r["doctor_first_name"],
         "doctor_last_name": r["doctor_last_name"],
         "specialization": r["specialization"],
         "doctor_id": r["doctor_id"]}
        for r in rows
    ]


@app.get("/appointments/doctor")
def doctor_appointments(user=Depends(require_doctor)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, appointment_date, start_time, end_time, status,
                          patient_first_name, patient_last_name, patient_phone, description,
                          created_at, patient_id
                   FROM appointments
                   WHERE doctor_id = %s
                   ORDER BY appointment_date, start_time""",
                (user["id"],),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [fmt_appointment(r) for r in rows]


@app.patch("/appointments/{appointment_id}")
def reschedule_appointment(appointment_id: int, body: RescheduleRequest, user=Depends(require_user)):
    try:
        d = datetime.strptime(body.appointment_date, "%Y-%m-%d").date()
        t = datetime.strptime(body.start_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or time format")
    end_t = (datetime.combine(date.today(), t) + timedelta(minutes=20)).time()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, doctor_id, patient_id, status FROM appointments WHERE id = %s",
                (appointment_id,),
            )
            appt = cur.fetchone()
            if not appt:
                raise HTTPException(status_code=404, detail="Appointment not found")
            if appt["patient_id"] != user["id"] and appt["doctor_id"] != user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized")
            if appt["status"] == "cancelled":
                raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled appointment")
            day_of_week = d.weekday()
            cur.execute(
                "SELECT id FROM doctor_availability WHERE doctor_id = %s AND day_of_week = %s",
                (appt["doctor_id"], day_of_week),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Doctor not available on this day")
            cur.execute(
                """SELECT id FROM appointments
                   WHERE doctor_id = %s AND appointment_date = %s AND start_time = %s
                     AND status = 'scheduled' AND id != %s""",
                (appt["doctor_id"], d, t, appointment_id),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="This slot is already booked")
            cur.execute(
                "UPDATE appointments SET appointment_date = %s, start_time = %s, end_time = %s WHERE id = %s",
                (d, t, end_t, appointment_id),
            )
        conn.commit()
    finally:
        conn.close()
    return {"status": "rescheduled"}


@app.delete("/appointments/{appointment_id}")
def cancel_appointment(appointment_id: int, user=Depends(require_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, patient_id, doctor_id, status FROM appointments WHERE id = %s",
                (appointment_id,),
            )
            appt = cur.fetchone()
            if not appt:
                raise HTTPException(status_code=404, detail="Appointment not found")
            if appt["patient_id"] != user["id"] and appt["doctor_id"] != user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized")
            cur.execute("UPDATE appointments SET status = 'cancelled' WHERE id = %s", (appointment_id,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "cancelled"}
