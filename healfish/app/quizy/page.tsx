"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { quizzes } from "@/lib/mock-data";
import FilterBar from "@/components/FilterBar";
import { CalendarDays, Brain } from "lucide-react";

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-blue-100 text-blue-700 border-blue-200",
  Stomatologia: "bg-green-100 text-green-700 border-green-200",
  Fizjoterapia: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function QuizzesPage() {
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("all");
  const [field, setField] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    return quizzes
      .filter((q) => {
        const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase());
        const matchField = field === "all" || q.field === field;
        return matchSearch && matchField;
      })
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [search, field, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header in frame */}
      <div className="bg-white/70 border border-gray-200 rounded-3xl px-6 py-5 shadow-bubble mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Quizy</h1>
        <p className="text-[color:var(--color-text-secondary)]">
          Sprawdź swoją wiedzę profilaktyczną i zdobywaj punkty na rabaty u partnerów.
          Dostęp do quizów wymaga zalogowania.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white/60 border border-gray-200/70 rounded-2xl px-4 py-3 shadow-sm mb-8">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          author={author}
          onAuthorChange={setAuthor}
          field={field}
          onFieldChange={setField}
          sortOrder={sortOrder}
          onSortToggle={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">
          Brak quizów spełniających kryteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => (
            <Link key={quiz.id} href={`/quizy/${quiz.slug}`} className="group">
              <div className="tile-green-light rounded-3xl p-6 h-full border border-green-200/40 shadow-bubble hover:shadow-bubble-hover transition-all hover:-translate-y-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${fieldColors[quiz.field]}`}>
                    {quiz.field}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                    <Brain size={16} className="text-green-600" />
                  </div>
                </div>
                <h2 className="font-semibold text-[var(--color-text-heading)] mb-2 group-hover:text-green-800 transition-colors leading-snug flex-1">
                  {quiz.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-secondary)] mt-4 pt-4 border-t border-green-200/30">
                  <CalendarDays size={12} />
                  <span>{new Date(quiz.date).toLocaleDateString("pl-PL")}</span>
                  <span className="ml-auto">{quiz.questions.length} pytań</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
