"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { articles } from "@/lib/mock-data";
import Link from "next/link";
import { Search, BookOpen, CalendarDays, Sparkles } from "lucide-react";

const presetQuestions = [
  { id: "fatigue", label: "Czy odczuwasz przewlekłe zmęczenie?" },
  { id: "weight", label: "Czy masz problemy z utrzymaniem prawidłowej wagi?" },
  { id: "pain", label: "Czy odczuwasz ból kręgosłupa lub karku?" },
  { id: "mood", label: "Czy masz wahania nastroju lub problemy ze snem?" },
  { id: "digestion", label: "Czy masz problemy z trawieniem lub uczucie wzdęcia?" },
];

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-blue-100 text-blue-700 border-blue-200",
  Stomatologia: "bg-green-100 text-green-700 border-green-200",
  Fizjoterapia: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function SelfCheckPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [results, setResults] = useState<typeof articles | null>(null);

  const handleSearch = () => {
    const filled = Object.values(answers).filter(Boolean);
    if (filled.length === 0 && !extra.trim()) return;

    const hasWeight = answers.weight || extra.toLowerCase().includes("waga");
    const hasPain = answers.pain || extra.toLowerCase().includes("ból");

    let pool = [...articles];
    if (hasWeight) pool = pool.filter((a) => a.field === "Endokrynologia");
    else if (hasPain) pool = pool.filter((a) => a.field === "Fizjoterapia");

    setResults(pool.slice(0, 3));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header frame */}
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-6 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          <Search size={14} />
          Self Check – RAG
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-2">Sprawdź swoje objawy</h1>
        <p className="text-[color:var(--color-text-body)]">
          Opisz swoje objawy lub odpowiedz na pytania poniżej. Na podstawie Twoich odpowiedzi
          dobierzemy artykuły i badania profilaktyczne. Dopasowywanie odbywa się dzięki
          inteligentnej analizie treści (RAG).
        </p>
      </div>

      {/* Questions – jedno spójne niebieskie obramowanie */}
      <div className="space-y-3 mb-6">
        {presetQuestions.map((q) => (
          <div
            key={q.id}
            className="card-gradient rounded-3xl border-2 border-brand-blue/40 shadow-bubble p-5 flex gap-4"
          >
            <div className="w-1 rounded-full flex-shrink-0 bg-brand-blue" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-2">
                {q.label}
              </label>
              <textarea
                className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white/60"
                rows={2}
                placeholder="Opisz dokładniej (opcjonalnie)..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            </div>
          </div>
        ))}

        <div className="card-gradient rounded-3xl border-2 border-brand-blue/40 shadow-bubble p-5 flex gap-4">
          <div className="w-1 rounded-full flex-shrink-0 bg-brand-blue" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-2">
              Inne objawy lub uwagi
            </label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white/60"
              rows={3}
              placeholder="Opisz dowolne inne objawy..."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 mb-10 shadow-bubble"
      >
        <Search size={16} className="mr-2" />
        Znajdź dopasowane artykuły
      </Button>

      {results !== null && (
        <div>
          {/* Results header in frame */}
          <div className="tile-blend rounded-3xl px-5 py-3 mb-5 border border-white/50 shadow-sm inline-flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
              Dopasowane artykuły ({results.length})
            </h2>
          </div>

          {results.length === 0 ? (
            <p className="text-[color:var(--color-text-muted)] text-sm">
              Nie znaleziono dopasowań. Spróbuj opisać więcej objawów.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((article) => (
                <Link key={article.id} href={`/artykuly/${article.slug}`} className="group block">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble hover:shadow-bubble-hover transition-all hover:-translate-y-0.5 p-5 flex flex-col gap-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full self-start border ${fieldColors[article.field]}`}>
                      {article.field}
                    </span>
                    <h3 className="font-semibold text-[var(--color-text-heading)] group-hover:text-brand-blue transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[color:var(--color-text-body)] line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-[color:var(--color-text-muted)] mt-1">
                      <span className="flex items-center gap-1"><BookOpen size={11} /> {article.author.name}</span>
                      <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(article.date).toLocaleDateString("pl-PL")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
