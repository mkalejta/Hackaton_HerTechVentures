"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Stethoscope,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { api, ApiArticleRef, ApiSpecialist } from "@/lib/api";
import { selfCheckQuestions, questionsBySection } from "@/lib/self-check-questions";

const STORAGE_KEY = "self-check-state";

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-blue-100 text-blue-700 border-blue-200",
  Stomatologia: "bg-green-100 text-green-700 border-green-200",
  Fizjoterapia: "bg-orange-100 text-orange-700 border-orange-200",
};

const sectionIcons: Record<string, string> = {
  "Aspekty fizyczne i energia": "⚡",
  "Zdrowie psychiczne i emocjonalne": "🧠",
  "Codzienne nawyki i profilaktyka": "🥗",
};

type SavedState = {
  answers: Record<string, string>;
  aiAnswer: string | null;
  apiRefs: ApiArticleRef[];
  specialists: ApiSpecialist[];
};

function loadState(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: SavedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function SelfCheckPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [apiRefs, setApiRefs] = useState<ApiArticleRef[]>([]);
  const [specialists, setSpecialists] = useState<ApiSpecialist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted state after hydration
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.answers) setAnswers(saved.answers);
      if (saved.aiAnswer) setAiAnswer(saved.aiAnswer);
      if (saved.apiRefs) setApiRefs(saved.apiRefs);
      if (saved.specialists) setSpecialists(saved.specialists);
    }
    setHydrated(true);
  }, []);

  // Persist on every change (skip first render before hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveState({ answers, aiAnswer, apiRefs, specialists });
  }, [hydrated, answers, aiAnswer, apiRefs, specialists]);

  const filledCount = selfCheckQuestions.filter((q) => answers[q.id]?.trim()).length;
  const hasResults = aiAnswer !== null || apiRefs.length > 0;

  const handleSearch = async () => {
    if (filledCount === 0) return;
    setLoading(true);
    try {
      const res = await api.selfCheck(answers);
      setAiAnswer(res.answer);
      setApiRefs(res.articles);
      setSpecialists(res.specialists ?? []);
      setTimeout(() => {
        document.getElementById("self-check-results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      setAiAnswer("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setAiAnswer(null);
    setApiRefs([]);
    setSpecialists([]);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-6 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          <Search size={14} />
          Self Check
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-2">
          Sprawdź, jak się czujesz
        </h1>
        <p className="text-[color:var(--color-text-body)]">
          Opisz swoje samopoczucie w ostatnich dniach i pomóż nam dopasować dawkę wiedzy
          specjalnie pod Ciebie! Przeczytaj 3 sugerowane artykuły, rozwiąż quiz i rzuć się na
          głęboką wodę profilaktyki!
        </p>
      </div>

      {/* Questions grouped by section */}
      <div className="space-y-8 mb-8">
        {questionsBySection.map(({ section, questions }) => (
          <div key={section}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{sectionIcons[section]}</span>
              <h2 className="text-base font-semibold text-[var(--color-text-heading)]">{section}</h2>
            </div>
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="card-gradient rounded-3xl border-2 border-brand-blue/40 shadow-bubble p-5 flex gap-4"
                >
                  <div className="w-1 rounded-full flex-shrink-0 bg-brand-blue" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1">
                      {q.shortLabel}
                    </label>
                    <p className="text-xs text-[color:var(--color-text-muted)] mb-2 leading-relaxed">
                      {q.fullLabel}
                    </p>
                    <textarea
                      className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white/60"
                      rows={2}
                      placeholder={q.placeholder}
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit + Reset */}
      <div className="flex items-center gap-3 mb-10 flex-wrap">
        <Button
          onClick={handleSearch}
          disabled={loading || filledCount === 0}
          className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble"
        >
          <Search size={16} className="mr-2" />
          {loading ? "Analizuję..." : "Znajdź artykuły i specjalistów"}
        </Button>
        {(filledCount > 0 || hasResults) && !loading && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-full px-5 text-[color:var(--color-text-muted)] border-gray-200 hover:text-red-500 hover:border-red-200"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Wyczyść
          </Button>
        )}
        {filledCount > 0 && !loading && (
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {filledCount}/{selfCheckQuestions.length} odpowiedzi
          </span>
        )}
      </div>

      {/* Results */}
      {hasResults && (
        <div id="self-check-results" className="space-y-8">
          {/* Summary */}
          {aiAnswer && (
            <div>
              <div className="tile-blend rounded-3xl px-5 py-3 mb-4 border border-white/50 shadow-sm inline-flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
                  Twoje podsumowanie
                </h2>
              </div>
              <div className="bg-white rounded-3xl border border-brand-blue/20 shadow-bubble p-5">
                <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    To nie jest diagnoza medyczna — poniższe podsumowanie opiera się wyłącznie na
                    Twoich subiektywnych odczuciach. Wszelkie decyzje zdrowotne skonsultuj z
                    lekarzem.
                  </p>
                </div>
                <p className="text-sm text-[color:var(--color-text-body)] whitespace-pre-wrap leading-relaxed">
                  {aiAnswer}
                </p>
              </div>
            </div>
          )}

          {/* Articles */}
          <div>
            <div className="tile-blend rounded-3xl px-5 py-3 mb-4 border border-white/50 shadow-sm inline-flex items-center gap-2">
              <BookOpen size={16} className="text-brand-blue" />
              <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
                Dopasowane artykuły ({apiRefs.length})
              </h2>
            </div>

            {apiRefs.length === 0 ? (
              <p className="text-[color:var(--color-text-muted)] text-sm">
                Nie znaleziono dopasowań. Spróbuj opisać więcej szczegółów.
              </p>
            ) : (
              <div className="space-y-4">
                {apiRefs.map((ref) => (
                  <Link key={ref.slug} href={`/artykuly/${ref.slug}`} className="group block">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble hover:shadow-bubble-hover transition-all hover:-translate-y-0.5 p-5 flex flex-col gap-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full self-start border ${
                          fieldColors[ref.specialization] ??
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {ref.specialization}
                      </span>
                      <h3 className="font-semibold text-[var(--color-text-heading)] group-hover:text-brand-blue transition-colors">
                        {ref.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[color:var(--color-text-muted)] mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} /> {ref.author}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Specialist tiles */}
          {specialists.length > 0 && (
            <div>
              <div className="tile-blend rounded-3xl px-5 py-3 mb-4 border border-white/50 shadow-sm inline-flex items-center gap-2">
                <Stethoscope size={16} className="text-brand-blue" />
                <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
                  Specjaliści w Twoim rejonie
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialists.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-4 flex flex-col gap-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                      <Stethoscope size={18} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text-heading)] text-sm leading-snug">
                        {s.name}
                      </p>
                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                          fieldColors[s.specialization] ??
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {s.specialization}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[color:var(--color-text-muted)]">
                      <MapPin size={11} />
                      {s.location}
                    </div>
                    <a
                      href={s.znany_lekarz_url ?? "https://www.znany-lekarz.pl"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline"
                    >
                      Umów wizytę <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
