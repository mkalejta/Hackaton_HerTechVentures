"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { articles } from "@/lib/mock-data";
import FilterBar from "@/components/FilterBar";
import { CalendarDays, User } from "lucide-react";

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-blue-100 text-blue-700 border-blue-200",
  Stomatologia: "bg-green-100 text-green-700 border-green-200",
  Fizjoterapia: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function ArticlesPage() {
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("all");
  const [field, setField] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    return articles
      .filter((a) => {
        const matchSearch =
          !search || a.title.toLowerCase().includes(search.toLowerCase());
        const matchAuthor = author === "all" || a.author.id === author;
        const matchField = field === "all" || a.field === field;
        return matchSearch && matchAuthor && matchField;
      })
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [search, author, field, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header in frame */}
      <div className="bg-white/70 border border-gray-200 rounded-3xl px-6 py-5 shadow-bubble mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Artykuły</h1>
        <p className="text-[color:var(--color-text-secondary)]">
          Artykuły pisane przez lekarzy – rzetelna wiedza o profilaktyce zdrowotnej.
        </p>
      </div>

      {/* Filter bar in frame */}
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
          Brak artykułów spełniających kryteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article) => (
            <Link key={article.id} href={`/artykuly/${article.slug}`} className="group">
              <div className="card-gradient rounded-3xl p-6 h-full border border-green-100/60 shadow-bubble hover:shadow-bubble-hover transition-all hover:-translate-y-1 flex flex-col">
                <div className="mb-3">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${fieldColors[article.field]}`}
                  >
                    {article.field}
                  </span>
                </div>
                <h2 className="font-semibold text-[var(--color-text-heading)] mb-2 group-hover:text-brand-blue transition-colors leading-snug">
                  {article.title}
                </h2>
                <p className="text-[color:var(--color-text-body)] text-sm mb-4 flex-1 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
                    <User size={12} />
                    <span>{article.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
                    <CalendarDays size={12} />
                    <span>{new Date(article.date).toLocaleDateString("pl-PL")}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
