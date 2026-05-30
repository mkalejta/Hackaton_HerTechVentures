"use client";

import { quizzes } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import SpecialistCarousel from "@/components/SpecialistCarousel";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_LOGGED_IN = false;

type Props = { params: { slug: string } };

export default function QuizPage({ params }: Props) {
  const { slug } = params;
  const quiz = quizzes.find((q) => q.slug === slug);
  if (!quiz) notFound();

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  if (!MOCK_LOGGED_IN) {
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

  const question = quiz.questions[current];
  const score = answers.filter((a, i) => a === quiz.questions[i].correct).length;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const updated = [...answers];
    updated[current] = idx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (current < quiz.questions.length - 1) {
      setCurrent(current + 1);
      setSelected(answers[current + 1]);
    } else {
      setFinished(true);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelected(answers[current - 1]);
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
            <p className="text-[color:var(--color-text-body)] mb-6">
              Twój wynik:{" "}
              <strong className="text-brand-blue text-2xl">{score}</strong> / {quiz.questions.length}
            </p>
            <div className="tile-green rounded-3xl p-5 mb-6 border border-white/50">
              <p className="font-medium text-[var(--color-text-heading)]">
                {score === quiz.questions.length
                  ? "Doskonale! Znasz się na tym temacie."
                  : score >= quiz.questions.length / 2
                  ? "Dobry wynik! Warto doczytać artykuł powiązany z tym quizem."
                  : "Warto pogłębić wiedzę – przeczytaj powiązany artykuł."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setCurrent(0);
                  setSelected(null);
                  setAnswers(Array(quiz.questions.length).fill(null));
                  setFinished(false);
                }}
                variant="outline"
                className="rounded-full"
              >
                Spróbuj jeszcze raz
              </Button>
              {quiz.relatedArticleSlug && (
                <a
                  href={`/artykuly/${quiz.relatedArticleSlug}`}
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
        {/* Title + progress frame */}
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

        {/* Question card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 mb-6">
          <p className="font-semibold text-[var(--color-text-heading)] text-lg mb-6">
            {question.question}
          </p>
          <div className="space-y-3">
            {question.answers.map((answer, idx) => {
              let cls =
                "border border-gray-200 hover:border-brand-blue text-[color:var(--color-text-body)]";
              if (selected !== null) {
                if (idx === question.correct)
                  cls = "border-2 border-green-400 bg-green-50 text-green-700";
                else if (idx === selected && idx !== question.correct)
                  cls = "border-2 border-red-300 bg-red-50 text-red-600";
                else cls = "border border-gray-100 text-[color:var(--color-text-muted)]";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "w-full text-left rounded-2xl px-4 py-3.5 text-sm transition-all flex items-center gap-3",
                    cls
                  )}
                >
                  <span className="font-bold w-6 h-6 rounded-lg tile-support flex items-center justify-center text-xs flex-shrink-0">
                    {["A", "B", "C", "D"][idx]}
                  </span>
                  <span className="flex-1">{answer}</span>
                  {selected !== null && idx === question.correct && (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  )}
                  {selected !== null && idx === selected && idx !== question.correct && (
                    <XCircle size={16} className="text-red-400 flex-shrink-0" />
                  )}
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
            disabled={selected === null}
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
