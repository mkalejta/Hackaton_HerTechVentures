"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { api, ApiArticle } from "@/lib/api";
import FilterBar from "@/components/FilterBar";
import { CalendarDays, User, PenLine } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-blue-100 text-blue-700 border-blue-200",
  Stomatologia: "bg-green-100 text-green-700 border-green-200",
  Fizjoterapia: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function ArticlesPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [field, setField] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    api.getArticles().then(setArticles).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return articles
      .filter((a) => {
        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
        const matchField = field === "all" || a.specialization === field;
        return matchSearch && matchField;
      })
      .sort((a, b) => {
        const diff = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [articles, search, field, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-5 shadow-bubble mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Artykuły</h1>
          <p className="text-[color:var(--color-text-secondary)]">
            Artykuły pisane przez lekarzy – rzetelna wiedza o profilaktyce zdrowotnej.
          </p>
        </div>
        {user?.is_doctor && (
          <Link
            href="/artykuly/nowy"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble flex items-center gap-2"
            )}
          >
            <PenLine size={16} />
            Dodaj artykuł
          </Link>
        )}
      </div>

      <div className="bg-white/60 border border-gray-200/70 rounded-2xl px-4 py-3 shadow-sm mb-8">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          author="all"
          onAuthorChange={() => {}}
          field={field}
          onFieldChange={setField}
          sortOrder={sortOrder}
          onSortToggle={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">Ładowanie...</div>
      ) : filtered.length === 0 ? (
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
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${fieldColors[article.specialization] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {article.specialization}
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
                    <span>{article.author_first_name} {article.author_last_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
                    <CalendarDays size={12} />
                    <span>{new Date(article.published_at).toLocaleDateString("pl-PL")}</span>
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
