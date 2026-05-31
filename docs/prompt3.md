# Prompt 3 – Dokończenie backendu + podłączenie frontendu

## Stan wyjściowy

Backend FastAPI działa na porcie 8000 (Docker). Wszystkie strony frontendowe importują dane z `@/lib/mock-data` i nie komunikują się z API. Poniżej opisuję **wszystkie zmiany do wykonania** krok po kroku.

---

## 1. Poprawki backendu

### 1a. Endpoint `GET /articles` — dodaj excerpt

W `backend/main.py`, w zapytaniu SQL dla `list_articles`, dodaj kolumnę:
```sql
LEFT(a.content, 300) AS excerpt
```
Wstaw ją tuż po `a.for_women,` w SELECT.

### 1b. Endpoint `GET /quizzes` — dodaj datę z artykułu

W zapytaniu SQL dla `list_quizzes` i `get_quiz`, dołącz:
```sql
a.published_at AS date
```
Dołącz do istniejącego JOINa z `articles`.

---

## 2. Warstwa API po stronie frontendu

### Plik `healfish/lib/api.ts` — stwórz od zera

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeader(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    return req<{ access_token: string }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  },
  register: (data: { first_name: string; last_name: string; email: string; password: string; newsletter: boolean }) =>
    req<{ access_token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  me: () => req<{ id: number; first_name: string; last_name: string; email: string; points_total: number }>("/users/me"),

  // Articles
  getArticles: (params?: { specialization?: string; for_women?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.specialization) qs.set("specialization", params.specialization);
    if (params?.for_women != null) qs.set("for_women", String(params.for_women));
    return req<ApiArticle[]>(`/articles${qs.size ? "?" + qs : ""}`);
  },
  getArticle: (slug: string) => req<ApiArticleDetail>(`/articles/${slug}`),

  // Quizzes
  getQuizzes: (params?: { specialization?: string; for_women?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.specialization) qs.set("specialization", params.specialization);
    if (params?.for_women != null) qs.set("for_women", String(params.for_women));
    return req<ApiQuiz[]>(`/quizzes${qs.size ? "?" + qs : ""}`);
  },
  getQuiz: (slug: string) => req<ApiQuizDetail>(`/quizzes/${slug}`),
  submitAttempt: (quizSlug: string, answers: Record<number, string>) =>
    req<{ score_percent: number; passed: boolean; points_earned: number; correct_answers: Record<number, string> }>(
      `/quiz/${quizSlug}/attempt`,
      { method: "POST", body: JSON.stringify({ answers }) }
    ),

  // Self-check
  selfCheck: (answers: string[]) =>
    req<{ answer: string; articles: ApiArticleRef[] }>("/self-check", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

// Types matching backend responses
export type ApiArticle = {
  id: number; slug: string; title: string; specialization: string;
  published_at: string; source_url: string | null; quiz_slug: string | null;
  for_women: boolean; excerpt: string;
  author_first_name: string; author_last_name: string;
  author_specialization: string; author_location: string; znany_lekarz_url: string | null;
};

export type ApiArticleDetail = ApiArticle & { content: string; source_content: string | null; updated_at: string | null };

export type ApiQuiz = {
  id: number; slug: string; title: string; article_slug: string;
  specialization: string; for_women: boolean; date: string;
  passing_score: number; points_reward: number; is_active: boolean;
};

export type ApiQuizDetail = ApiQuiz & {
  questions: {
    id: number; question_index: number; question_text: string;
    answers: { id: number; label: string; text: string }[];
  }[];
};

export type ApiArticleRef = { title: string; slug: string; specialization: string; author: string; similarity: number };
```

---

## 3. Auth — token w localStorage

### Plik `healfish/lib/auth.ts` — stwórz od zera

```typescript
export const auth = {
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  setToken: (t: string) => localStorage.setItem("token", t),
  removeToken: () => localStorage.removeItem("token"),
  isLoggedIn: () => !!auth.getToken(),
};
```

---

## 4. Strona logowania `app/logowanie/page.tsx`

Aktualnie formularz nie ma `onSubmit`. Dołącz:

```tsx
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

// W komponencie:
const router = useRouter();
const [error, setError] = useState<string | null>(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  try {
    const { access_token } = await api.login(email, password);
    auth.setToken(access_token);
    router.push("/");
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Błąd logowania");
  }
};
```

Przebuduj `<form>` z:
- `onSubmit={handleSubmit}`
- `value={email}` + `onChange` na polu email
- `value={password}` + `onChange` na polu hasła
- Pod formularzem: `{error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}`

---

## 5. Strona rejestracji `app/rejestracja/page.tsx`

Analogicznie — podłącz stan dla `firstName`, `lastName`, `email`, `password`, `newsletter` i:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const { access_token } = await api.register({ first_name: firstName, last_name: lastName, email, password, newsletter });
    auth.setToken(access_token);
    router.push("/");
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Błąd rejestracji");
  }
};
```

---

## 6. Lista artykułów `app/artykuly/page.tsx`

Zastąp `import { articles } from "@/lib/mock-data"` wywołaniem API.

```tsx
import { useEffect, useState } from "react";
import { api, ApiArticle } from "@/lib/api";

// W komponencie zamiast const articles:
const [articles, setArticles] = useState<ApiArticle[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.getArticles().then(setArticles).finally(() => setLoading(false));
}, []);
```

### Mapowanie pól w JSX (zmień):
| Mock | API |
|------|-----|
| `article.field` | `article.specialization` |
| `article.date` | `article.published_at` |
| `article.author.name` | `` `${article.author_first_name} ${article.author_last_name}` `` |
| `article.author.id` | nie ma — usuń filtr po autorze lub zmień na filtr po nazwisku |
| `article.excerpt` | `article.excerpt` (dodany w kroku 1a) |

Filtrowanie po `author` zmień na `"all"` zawsze (lub usuń select autora z FilterBar dla tej strony) — nie mamy ID autorów w API.

---

## 7. Szczegół artykułu `app/artykuly/[slug]/page.tsx`

Zmień na **"use client"** + fetch dynamiczny. Usuń `generateStaticParams`.

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation"; // notFound nie działa w client — użyj state
import { api, ApiArticleDetail } from "@/lib/api";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    api.getArticle(slug).then(setArticle).catch(() => setNotFoundState(true));
  }, [slug]);

  if (notFoundState) return <div className="text-center py-20">Artykuł nie znaleziony.</div>;
  if (!article) return <div className="text-center py-20">Ładowanie...</div>;
  // ... reszta JSX bez zmian, tylko mapuj pola:
}
```

### Mapowanie pól w JSX:
| Mock | API |
|------|-----|
| `article.field` | `article.specialization` |
| `article.date` | `article.published_at` |
| `article.modifiedDate` | `article.updated_at` |
| `article.author.name` | `` `${article.author_first_name} ${article.author_last_name}` `` |
| `article.author.specialization` | `article.author_specialization` |
| `article.author.location` | `article.author_location` |
| `article.author.znanyLekarzUrl` | `article.znany_lekarz_url ?? "#"` |
| `article.studyUrl` | `article.source_url` |
| `article.relatedQuizSlug` | `article.quiz_slug` |
| `article.content` | `article.content` — renderowanie przez `.split("\n")` pozostaje bez zmian |

---

## 8. Lista quizów `app/quizy/page.tsx`

Zastąp `import { quizzes } from "@/lib/mock-data"`:

```tsx
const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
useEffect(() => { api.getQuizzes().then(setQuizzes); }, []);
```

### Mapowanie pól:
| Mock | API |
|------|-----|
| `quiz.field` | `quiz.specialization` |
| `quiz.date` | `quiz.date` (dodane w kroku 1b) |
| `quiz.questions.length` | **Brak w liście** — dodaj `passing_score` jako informację lub ukryj |

Usuń `quiz.questions.length` ze snippetu karty — zastąp np. `{quiz.passing_score}% próg zdawalności`.

---

## 9. Szczegół quizu `app/quizy/[slug]/page.tsx`

To największa zmiana. Zamiast `quizzes.find(...)` i `MOCK_LOGGED_IN`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiQuizDetail } from "@/lib/api";
import { auth } from "@/lib/auth";

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quiz, setQuiz] = useState<ApiQuizDetail | null>(null);
  const isLoggedIn = auth.isLoggedIn();

  useEffect(() => {
    if (isLoggedIn) api.getQuiz(slug).then(setQuiz);
  }, [slug, isLoggedIn]);

  // ...
}
```

### Mapowanie quizu:
API zwraca odpowiedzi jako `{ label: "A", text: "..." }`. Frontend oczekuje tablicy 4 stringów i `correct: number`.

Zamień logikę wyboru odpowiedzi — używaj **litery** zamiast indeksu:

```tsx
const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
const [answers, setAnswers] = useState<Record<number, string | null>>({});

// Przy handleSelect:
const handleSelect = (label: string) => {
  if (selectedLabel !== null) return;
  setSelectedLabel(label);
  setAnswers(prev => ({ ...prev, [question.question_index]: label }));
};

// W JSX zamiast idx === question.correct:
// Nie znamy poprawnej odpowiedzi do zakończenia quizu — ukryj feedback do "finished"
```

### Po zakończeniu — wyślij do API:

```tsx
const [result, setResult] = useState<{ score_percent: number; passed: boolean; points_earned: number; correct_answers: Record<number, string> } | null>(null);

const handleFinish = async () => {
  // Zamień answers (Record<number, string|null>) na Record<number, string>
  const payload: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v) payload[Number(k)] = v;
  }
  try {
    const res = await api.submitAttempt(slug, payload);
    setResult(res);
    setFinished(true);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Błąd przy zapisie");
  }
};
```

### Ekran wyników — pokaż dane z API:
```tsx
<p>Wynik: <strong>{result?.score_percent}%</strong></p>
{result?.passed && <p className="text-green-600">Zdobyto {result.points_reward} punktów!</p>}
```

---

## 10. Self-check `app/self-check/page.tsx`

Zastąp `handleSearch` wywołaniem API:

```tsx
import { api, ApiArticleRef } from "@/lib/api";

const [aiAnswer, setAiAnswer] = useState<string | null>(null);
const [apiRefs, setApiRefs] = useState<ApiArticleRef[]>([]);
const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  const filled = [...Object.values(answers).filter(Boolean), extra.trim()].filter(Boolean);
  if (!filled.length) return;
  setLoading(true);
  try {
    const res = await api.selfCheck(filled);
    setAiAnswer(res.answer);
    setApiRefs(res.articles);
  } catch (e) {
    setAiAnswer("Wystąpił błąd. Spróbuj ponownie.");
  } finally {
    setLoading(false);
  }
};
```

W JSX zastąp `results !== null` → `aiAnswer !== null || apiRefs.length > 0`:
- Pokaż `aiAnswer` w ramce przed listą artykułów:
```tsx
{aiAnswer && (
  <div className="bg-white rounded-3xl border border-brand-blue/20 shadow-bubble p-5 mb-6 prose prose-sm max-w-none">
    <p className="text-[color:var(--color-text-body)] whitespace-pre-wrap">{aiAnswer}</p>
  </div>
)}
```
- Zmień wyświetlanie artykułów — zamiast `Article` używaj `ApiArticleRef`:
  - `article.title` → `ref.title`
  - `article.slug` → `ref.slug`
  - `article.field` → `ref.specialization`
  - `article.author.name` → `ref.author`
  - Brak `excerpt` — usuń lub daj pusty string
  - Brak `date` — usuń CalendarDays

Zmień przycisk na loading state:
```tsx
<Button onClick={handleSearch} disabled={loading} ...>
  {loading ? "Analizuję..." : "Znajdź dopasowane artykuły"}
</Button>
```

---

## 11. Navbar — stan zalogowania

W `components/Navbar.tsx` dodaj przycisk "Moje konto" / "Wyloguj" gdy użytkownik jest zalogowany.

```tsx
"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { useRouter } from "next/navigation";

// W komponencie:
const [loggedIn, setLoggedIn] = useState(false);
const router = useRouter();

useEffect(() => { setLoggedIn(auth.isLoggedIn()); }, []);

const handleLogout = () => { auth.removeToken(); setLoggedIn(false); router.push("/"); };
```

W JSX:
```tsx
{loggedIn ? (
  <button onClick={handleLogout} className="...">Wyloguj</button>
) : (
  <Link href="/logowanie" className="...">Zaloguj się</Link>
)}
```

---

## Kolejność implementacji

1. `lib/api.ts` + `lib/auth.ts`
2. Backend: dodaj `excerpt` do `/articles` i `date` do `/quizzes`
3. `logowanie` + `rejestracja` — połącz z API
4. `artykuly/page.tsx` — zastąp mock
5. `artykuly/[slug]/page.tsx` — dynamiczny fetch
6. `quizy/page.tsx` — zastąp mock
7. `quizy/[slug]/page.tsx` — auth + API + submit
8. `self-check/page.tsx` — real RAG
9. `Navbar.tsx` — stan auth
