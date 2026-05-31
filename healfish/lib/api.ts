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
  registerDoctor: (data: { first_name: string; last_name: string; email: string; password: string; specialty: string; street_address: string; pwz_number: string; title?: string; bio?: string; newsletter: boolean }) =>
    req<{ access_token: string }>("/auth/register/doctor", { method: "POST", body: JSON.stringify(data) }),
  me: () => req<ApiUser>("/users/me"),
  updateProfile: (data: Partial<{ first_name: string; last_name: string; age: number; gender: string; weight: number; height: number; specialty: string; street_address: string; bio: string }>) =>
    req<ApiUser>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),

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
  getQuizStatus: (slug: string) => req<ApiQuizStatus>(`/quiz/${slug}/status`),
  submitAttempt: (quizSlug: string, answers: Record<number, string>) =>
    req<ApiQuizResult>(`/quiz/${quizSlug}/attempt`, { method: "POST", body: JSON.stringify({ answers }) }),

  // Specialists
  getSpecialists: (params?: { for_women?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.for_women != null) qs.set("for_women", String(params.for_women));
    return req<ApiSpecialist[]>(`/specialists${qs.size ? "?" + qs : ""}`);
  },
  getSpecializations: () => req<string[]>("/specializations"),

  // Discounts
  getDiscounts: () => req<ApiDiscount[]>("/discounts"),
  redeemDiscount: (id: number) =>
    req<{ code: string }>(`/discounts/${id}/redeem`, { method: "POST" }),

  // Articles (delete)
  deleteArticle: (slug: string) =>
    req<{ status: string }>(`/articles/${slug}`, { method: "DELETE" }),

  // Doctors
  getDoctorProfile: (authorId: number | string) => req<ApiDoctorProfile>(`/doctors/${authorId}`),
  getDoctorSlots: (authorId: number | string, date: string) =>
    req<{ slots: string[] }>(`/doctors/${authorId}/slots?date=${date}`),
  getMyAvailability: () => req<ApiAvailabilityDay[]>("/doctors/me/availability"),
  setAvailability: (slots: ApiAvailabilityDay[]) =>
    req<{ status: string }>("/doctors/me/availability", { method: "PUT", body: JSON.stringify({ slots }) }),

  // Appointments
  bookAppointment: (data: {
    doctor_id: number; appointment_date: string; start_time: string;
    patient_first_name: string; patient_last_name: string;
    patient_phone?: string; description?: string;
  }) => req<{ id: number; status: string }>("/appointments", { method: "POST", body: JSON.stringify(data) }),
  getMyAppointments: () => req<ApiAppointment[]>("/appointments/my"),
  getDoctorAppointments: () => req<ApiDoctorAppointment[]>("/appointments/doctor"),
  cancelAppointment: (id: number) => req<{ status: string }>(`/appointments/${id}`, { method: "DELETE" }),
  rescheduleAppointment: (id: number, data: { appointment_date: string; start_time: string }) =>
    req<{ status: string }>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Articles (create)
  createArticle: (data: { title: string; content: string; for_women?: boolean; source_url?: string }) =>
    req<{ id: number; slug: string }>("/articles", { method: "POST", body: JSON.stringify(data) }),

  // Self-check
  selfCheck: (answers: Record<string, string>, userProfile?: Record<string, unknown>) =>
    req<{ answer: string; articles: ApiArticleRef[]; specialists: ApiSpecialist[] }>("/self-check", {
      method: "POST",
      body: JSON.stringify({ answers, ...(userProfile ? { user_profile: userProfile } : {}) }),
    }),
};

export type ApiUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  points_total: number;
  is_doctor: boolean;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  specialty?: string | null;
  street_address?: string | null;
  bio?: string | null;
};

export type ApiArticle = {
  id: number; slug: string; title: string; specialization: string;
  published_at: string; source_url: string | null; quiz_slug: string | null;
  for_women: boolean; excerpt: string;
  author_first_name: string; author_last_name: string;
  author_specialization: string; author_location: string; znany_lekarz_url: string | null;
  author_user_id: number | null;
};

export type ApiArticleDetail = ApiArticle & {
  content: string; source_content: string | null; updated_at: string | null;
  author_id: number; author_user_id: number | null;
};

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

export type ApiQuizStatus = {
  attempts_today: number;
  max_attempts: number;
  can_retry: boolean;
  ever_passed?: boolean;
};

export type ApiQuizResult = {
  score_percent: number;
  passed: boolean;
  points_earned: number;
  correct_answers: Record<number, string>;
  attempts_today: number;
  max_attempts: number;
  can_retry: boolean;
  ever_passed?: boolean;
};

export type ApiArticleRef = { title: string; slug: string; specialization: string; author: string; similarity: number };

export type ApiDiscount = {
  id: number;
  description: string;
  points_cost: number;
  discount_percent: number;
  valid_until: string | null;
  author_first_name: string;
  author_last_name: string;
  specialization: string;
  location: string;
};

export type ApiSpecialist = {
  id: number;
  name: string;
  specialization: string;
  location: string;
  street_address: string | null;
  user_id: number | null;
  znany_lekarz_url: string | null;
};

export type ApiDoctorProfile = {
  id: number;
  name: string;
  specialization: string;
  location: string;
  street_address: string | null;
  user_id: number | null;
  bio: string | null;
  is_bookable: boolean;
  schedule: { day_of_week: number; start_time: string; end_time: string }[];
};

export type ApiAvailabilityDay = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type ApiAppointment = {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  description: string | null;
  created_at: string;
  doctor_first_name: string;
  doctor_last_name: string;
  specialization: string;
  doctor_id: number;
};

export type ApiDoctorAppointment = {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  description: string | null;
  created_at: string;
  patient_id: number | null;
};
