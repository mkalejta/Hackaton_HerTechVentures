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
  selfCheck: (answers: Record<string, string>) =>
    req<{ answer: string; articles: ApiArticleRef[]; specialists: ApiSpecialist[] }>("/self-check", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

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

export type ApiSpecialist = {
  id: number;
  name: string;
  specialization: string;
  location: string;
  znany_lekarz_url: string | null;
};
