# Prompt – Skrypt budowania bazy wiedzy + Docker Compose

## Kontekst projektu

Edukacyjno-informacyjna strona o profilaktyce zdrowotnej. Backend w **FastAPI (Python)**.
Potrzebuję skryptu do jednorazowego (lub powtarzalnego) zbudowania bazy wiedzy na potrzeby systemu RAG oraz bazy relacyjnej do wyświetlania artykułów i quizów na frontendzie.

RAG jest wywoływany **bezpośrednio z endpointów backendu FastAPI** (brak osobnego serwisu AI) — endpoint `/self-check` pobiera podobne chunki z pgvector i wysyła je jako kontekst do OpenAI API.

---

## Architektura danych

Używamy **jednej bazy — PostgreSQL z rozszerzeniem `pgvector`**.

---

## Struktura katalogów

```
project/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── rag.py
├── scripts/
│   ├── build_knowledge_base.py
│   └── run_indexing.sh
├── frontend/
│   └── Dockerfile
└── data/
    ├── articles/           ← pliki .txt z artykułami
    ├── sources/            ← pliki .txt z treścią badań naukowych
    └── quizzes/            ← pliki .txt z pytaniami i odpowiedziami
```

Konwencja nazewnictwa plików:
- artykuły: `{slug}.txt`
- źródła: `{slug}-source.txt`
- quizy: dowolna nazwa, jeden plik może zawierać wiele quizów rozdzielonych separatorem `---`

---

## Schemat bazy danych (PostgreSQL + pgvector)

### Tabela `authors`
```sql
id                SERIAL PRIMARY KEY
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
specialization    VARCHAR(100)
znany_lekarz_url  TEXT
location          VARCHAR(200)
```

### Tabela `articles`
```sql
id                SERIAL PRIMARY KEY
slug              VARCHAR(200) UNIQUE NOT NULL
title             VARCHAR(500) NOT NULL
author_id         INTEGER REFERENCES authors(id)
published_at      DATE
updated_at        DATE
specialization    VARCHAR(100)          -- Endokrynologia / Stomatologia / Fizjoterapia
content           TEXT NOT NULL
source_content    TEXT
source_url        TEXT
quiz_slug         VARCHAR(200)          -- slug powiązanego quizu (FK logiczny, może być NULL)
for_women         BOOLEAN DEFAULT FALSE
```

### Tabela `article_chunks`
```sql
id                SERIAL PRIMARY KEY
article_id        INTEGER REFERENCES articles(id) ON DELETE CASCADE
chunk_index       INTEGER NOT NULL
chunk_text        TEXT NOT NULL
embedding         vector(384)           -- all-MiniLM-L6-v2
source            VARCHAR(20) DEFAULT 'article'   -- 'article' lub 'source'
```

### Tabela `quizzes`
```sql
id                SERIAL PRIMARY KEY
slug              VARCHAR(200) UNIQUE NOT NULL
title             VARCHAR(500) NOT NULL
article_id        INTEGER REFERENCES articles(id)
passing_score     INTEGER DEFAULT 70    -- próg zdawalności w procentach
points_reward     INTEGER DEFAULT 100   -- punkty za zaliczenie quizu
is_active         BOOLEAN DEFAULT TRUE
```

### Tabela `quiz_questions`
```sql
id                SERIAL PRIMARY KEY
quiz_id           INTEGER REFERENCES quizzes(id) ON DELETE CASCADE
question_index    INTEGER NOT NULL      -- kolejność pytania w quizie (1, 2, 3...)
question_text     TEXT NOT NULL
```

### Tabela `quiz_answers`
```sql
id                SERIAL PRIMARY KEY
question_id       INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE
answer_label      CHAR(1) NOT NULL      -- 'A', 'B', 'C', 'D'
answer_text       TEXT NOT NULL
is_correct        BOOLEAN NOT NULL DEFAULT FALSE
```

### Tabela `users`
```sql
id                SERIAL PRIMARY KEY
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
email             VARCHAR(255) UNIQUE NOT NULL
password_hash     VARCHAR(255) NOT NULL
points_total      INTEGER DEFAULT 0     -- łączne punkty użytkownika
newsletter        BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP DEFAULT NOW()
```

### Tabela `user_quiz_attempts`
Śledzi podejścia użytkownika do quizów. Każdy użytkownik może podejść do quizu raz dziennie.
```sql
id                SERIAL PRIMARY KEY
user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE
quiz_id           INTEGER REFERENCES quizzes(id)
attempted_at      TIMESTAMP DEFAULT NOW()
score_percent     INTEGER NOT NULL      -- wynik w procentach (0–100)
passed            BOOLEAN NOT NULL      -- czy osiągnięto próg zdawalności
points_earned     INTEGER DEFAULT 0     -- punkty przyznane za to podejście
UNIQUE (user_id, quiz_id, attempted_at::DATE)  -- jeden attempt dziennie
```

### Tabela `user_point_transactions`
Historia transakcji punktowych (zdobywanie i wymiana na rabaty).
```sql
id                SERIAL PRIMARY KEY
user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE
amount            INTEGER NOT NULL      -- dodatnia = zdobyte, ujemna = wydane
reason            VARCHAR(255)          -- np. 'quiz_completion', 'discount_redemption'
reference_id      INTEGER               -- np. id quizu lub id rabatu
created_at        TIMESTAMP DEFAULT NOW()
```

### Tabela `discounts`
Rabaty dostępne do wymiany za punkty.
```sql
id                SERIAL PRIMARY KEY
author_id         INTEGER REFERENCES authors(id)   -- lekarz oferujący rabat
description       TEXT NOT NULL         -- opis oferty rabatowej
points_cost       INTEGER DEFAULT 300   -- koszt w punktach (300 = zniżka na wizytę profilaktyczną)
discount_percent  INTEGER               -- wartość rabatu w %
valid_until       DATE
is_active         BOOLEAN DEFAULT TRUE
```

---

## Format frontmattera quizów w plikach `.txt`

Jeden plik może zawierać wiele quizów. Każdy quiz zaczyna się od bloku YAML oddzielonego `---`, po którym następują pytania:

```
---
quiz_slug: quiz-przyklad
article_slug: przykladowy-artykul
title: Przykładowy quiz
passing_score: 70
points: 100
---

Pytanie 1:
Treść pytania?
A) Odpowiedź pierwsza
B) Odpowiedź druga
C) Odpowiedź trzecia
D) Odpowiedź czwarta
Odpowiedź: B

Pytanie 2:
...
```

---

## Skrypt `scripts/build_knowledge_base.py`

### Zależności
```
psycopg2-binary
sentence-transformers
pgvector
python-dotenv
tqdm
PyYAML
```

### Zmienne środowiskowe (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/healthdb
DATA_DIR=./data
CHUNK_SIZE=500
CHUNK_OVERLAP=50
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### Co ma robić skrypt (krok po kroku)

**Faza 1 – Artykuły i chunki:**
1. Połącz się z bazą, włącz pgvector, utwórz wszystkie tabele (`CREATE TABLE IF NOT EXISTS`)
2. Załaduj model embeddingowy
3. Iteruj po `data/articles/*.txt`:
   - Parsuj frontmatter YAML
   - Utwórz autora jeśli nie istnieje (`INSERT ... ON CONFLICT (first_name, last_name) DO NOTHING`)
   - Upsert artykułu (`INSERT ... ON CONFLICT (slug) DO UPDATE`)
   - Usuń stare chunki, podziel treść na chunki, wygeneruj embeddingi (batch), wstaw
   - Jeśli istnieje `data/sources/{slug}-source.txt` — podziel i zaindeksuj analogicznie z `source='source'`
4. Utwórz indeks HNSW: `CREATE INDEX IF NOT EXISTS ... USING hnsw (embedding vector_cosine_ops)`

**Faza 2 – Quizy:**
5. Iteruj po `data/quizzes/*.txt`:
   - Parsuj plik — wykryj bloki rozdzielone `---` z frontmatterem YAML
   - Dla każdego quizu:
     - Znajdź `article_id` po `article_slug` (jeśli nie istnieje — log warning, skip)
     - Upsert quizu (`INSERT ... ON CONFLICT (slug) DO UPDATE`)
     - Usuń stare pytania i odpowiedzi (`DELETE FROM quiz_questions WHERE quiz_id = ?`)
     - Dla każdego pytania: wstaw `quiz_questions`, następnie wstaw 4 rekordy `quiz_answers` z `is_correct = TRUE` dla właściwej litery
6. Wypisz podsumowanie: artykuły, chunki, quizy, pytania

---

## Moduł RAG `backend/rag.py`

```python
def search_similar_chunks(query: str, top_k: int = 5) -> list[dict]:
    """
    Przyjmuje pytanie użytkownika (Self-Check),
    zwraca top_k najbardziej podobnych chunków wraz z metadanymi artykułu.
    """
```

Kroki:
1. Embedding zapytania tym samym modelem (`all-MiniLM-L6-v2`)
2. Zapytanie SQL z operatorem `<=>` (cosine distance):
   ```sql
   SELECT
     ac.chunk_text, ac.source,
     a.id, a.title, a.slug, a.specialization,
     au.first_name, au.last_name,
     1 - (ac.embedding <=> %s::vector) AS similarity
   FROM article_chunks ac
   JOIN articles a ON ac.article_id = a.id
   JOIN authors au ON a.author_id = au.id
   ORDER BY ac.embedding <=> %s::vector
   LIMIT %s;
   ```
3. Deduplikuj po `article_id` — maksymalnie 3 unikalne artykuły
4. Zwróć listę słowników

### Endpoint `/self-check` (schemat)
```python
@app.post("/self-check")
async def self_check(answers: list[str]):
    query = " ".join(answers)
    chunks = search_similar_chunks(query, top_k=5)
    context = "\n\n".join([c["chunk_text"] for c in chunks])
    article_refs = deduplicate_by_article_id(chunks)

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Jesteś asystentem zdrowotnym. Odpowiadaj na podstawie podanego kontekstu."},
            {"role": "user", "content": f"Kontekst:\n{context}\n\nPytanie: {query}"}
        ]
    )
    return {
        "answer": response.choices[0].message.content,
        "articles": article_refs
    }
```

### Endpoint `/quiz/{quiz_slug}/attempt` (schemat)
```python
@app.post("/quiz/{quiz_slug}/attempt")
async def submit_quiz(quiz_slug: str, answers: dict[int, str], current_user: User):
    # 1. Sprawdź czy użytkownik nie podchodził dziś (user_quiz_attempts)
    # 2. Pobierz quiz z pytaniami i poprawnymi odpowiedziami
    # 3. Oblicz wynik (ile poprawnych / łączna liczba pytań * 100)
    # 4. Zapisz attempt w user_quiz_attempts
    # 5. Jeśli passed: dodaj punkty do users.points_total + wstaw transakcję do user_point_transactions
    # 6. Zwróć: score_percent, passed, points_earned, correct_answers
```

---

## docker-compose.yml

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: healthdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d healthdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/healthdb
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Uruchomienie indeksowania
```bash
# Po uruchomieniu docker-compose up -d
docker compose exec backend python /app/scripts/build_knowledge_base.py
```

---

## Wymagania skryptu

- **Idempotentny** — wielokrotne uruchomienie nie duplikuje danych
- Brakujący frontmatter lub wymagane pole → log warning i skip pliku
- Progress bar przez `tqdm`
- Podsumowanie końcowe: artykuły, chunki, quizy, pytania, czas wykonania
