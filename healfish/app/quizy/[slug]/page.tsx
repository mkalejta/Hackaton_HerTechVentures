"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import SpecialistCarousel from "@/components/SpecialistCarousel";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiQuizDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quiz, setQuiz] = useState<ApiQuizDetail | null>(null);
  const [current, setCurrent] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{ score_percent: number; passed: boolean; points_earned: number; correct_answers: Record<number, string> } | null>(null);
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (isLoggedIn) api.getQuiz(slug).then(setQuiz).catch(() => {});
  }, [slug, isLoggedIn]);

  if (loading) return null;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-10">
          <div className="w-16 h-16 rounded-3xl tile-blue flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock size={28} className="text-brand-blue" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-title)] mb-3">
            Quiz tylko dla zalogowanych
          </h2>
          <p className="text-[color:var(--color-text-body)] mb-6">
            Zaloguj się lub utwórz konto, by rozwiązywać quizy i zdobywać punkty na rabaty u partnerów.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/logowanie"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
              )}
            >
              Zaloguj się
            </a>
            <a
              href="/rejestracja"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
            >
              Zarejestruj się
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <div className="text-center py-20">Ładowanie...</div>;
  }

  const question = quiz.questions[current];

  const handleSelect = (label: string) => {
    if (selectedLabel !== null) return;
    setSelectedLabel(label);
    setAnswers((prev) => ({ ...prev, [question.question_index]: label }));
  };

  const handleNext = () => {
    if (current < quiz.questions.length - 1) {
      const nextQ = quiz.questions[current + 1];
      setCurrent(current + 1);
      setSelectedLabel(answers[nextQ.question_index] ?? null);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      const prevQ = quiz.questions[current - 1];
      setCurrent(current - 1);
      setSelectedLabel(answers[prevQ.question_index] ?? null);
    }
  };

  const handleFinish = async () => {
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

  if (finished) {
    return (
      <>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-10">
            <div className="w-20 h-20 rounded-3xl tile-blend flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={36} className="text-teal-600" />
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-title)] mb-2">Quiz ukończony!</h2>
            <p className="text-[color:var(--color-text-body)] mb-2">
              Wynik: <strong className="text-brand-blue text-2xl">{result?.score_percent}%</strong>
            </p>
            {result?.passed && (
              <p className="text-green-600 font-medium mb-4">Zdobyto {result.points_earned} punktów!</p>
            )}
            <div className="tile-green rounded-3xl p-5 mb-6 border border-white/50">
              <p className="font-medium text-[var(--color-text-heading)]">
                {result?.passed
                  ? "Doskonale! Znasz się na tym temacie."
                  : "Warto pogłębić wiedzę – przeczytaj powiązany artykuł."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setCurrent(0);
                  setSelectedLabel(null);
                  setAnswers({});
                  setFinished(false);
                  setResult(null);
                }}
                variant="outline"
                className="rounded-full"
              >
                Spróbuj jeszcze raz
              </Button>
              {quiz.article_slug && (
                <a
                  href={`/artykuly/${quiz.article_slug}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
                  )}
                >
                  Czytaj artykuł
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white border-t border-gray-100">
          <SpecialistCarousel />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white/70 border border-gray-200 rounded-3xl px-5 py-4 shadow-bubble mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-[var(--color-text-heading)]">{quiz.title}</h1>
            <span className="text-sm text-[color:var(--color-text-muted)] tile-support px-2.5 py-0.5 rounded-full text-xs">
              {current + 1} / {quiz.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all"
              style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 mb-6">
          <p className="font-semibold text-[var(--color-text-heading)] text-lg mb-6">
            {question.question_text}
          </p>
          <div className="space-y-3">
            {question.answers.map((answer) => {
              let cls = "border border-gray-200 hover:border-brand-blue text-[color:var(--color-text-body)]";
              if (selectedLabel !== null) {
                if (answer.label === selectedLabel) {
                  cls = "border-2 border-brand-blue bg-blue-50 text-brand-blue";
                } else {
                  cls = "border border-gray-100 text-[color:var(--color-text-muted)]";
                }
              }
              return (
                <button
                  key={answer.id}
                  onClick={() => handleSelect(answer.label)}
                  className={cn(
                    "w-full text-left rounded-2xl px-4 py-3.5 text-sm transition-all flex items-center gap-3",
                    cls
                  )}
                >
                  <span className="font-bold w-6 h-6 rounded-lg tile-support flex items-center justify-center text-xs flex-shrink-0">
                    {answer.label}
                  </span>
                  <span className="flex-1">{answer.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={current === 0}
            className="rounded-full"
          >
            <ChevronLeft size={16} className="mr-1" /> Poprzednie
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedLabel === null}
            className="bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
          >
            {current < quiz.questions.length - 1 ? (
              <>Następne <ChevronRight size={16} className="ml-1" /></>
            ) : (
              "Zakończ quiz"
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100">
        <SpecialistCarousel />
      </div>
    </>
  );
}
