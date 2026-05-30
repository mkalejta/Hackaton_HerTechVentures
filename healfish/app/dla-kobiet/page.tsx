"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { articles, quizzes } from "@/lib/mock-data";
import FilterBar from "@/components/FilterBar";
import SpecialistCarousel from "@/components/SpecialistCarousel";
import CuriositiesCarousel from "@/components/CuriositiesCarousel";
import { CalendarDays, User, Brain, Sparkles, Heart } from "lucide-react";

const fieldColors: Record<string, string> = {
  Endokrynologia: "bg-pink-100 text-pink-700 border-pink-200",
  Stomatologia: "bg-rose-100 text-rose-700 border-rose-200",
  Fizjoterapia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const womenArticles = articles.filter((a) => a.forWomen);
const womenQuizzes = quizzes.filter((q) => q.forWomen);

export default function ForWomenPage() {
  const [articleSearch, setArticleSearch] = useState("");
  const [articleAuthor, setArticleAuthor] = useState("all");
  const [articleField, setArticleField] = useState("all");
  const [articleSort, setArticleSort] = useState<"asc" | "desc">("desc");

  const [quizSearch, setQuizSearch] = useState("");
  const [quizField, setQuizField] = useState("all");
  const [quizSort, setQuizSort] = useState<"asc" | "desc">("desc");

  const filteredArticles = useMemo(() => {
    return womenArticles
      .filter((a) => {
        const matchSearch = !articleSearch || a.title.toLowerCase().includes(articleSearch.toLowerCase());
        const matchAuthor = articleAuthor === "all" || a.author.id === articleAuthor;
        const matchField = articleField === "all" || a.field === articleField;
        return matchSearch && matchAuthor && matchField;
      })
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return articleSort === "desc" ? -diff : diff;
      });
  }, [articleSearch, articleAuthor, articleField, articleSort]);

  const filteredQuizzes = useMemo(() => {
    return womenQuizzes
      .filter((q) => {
        const matchSearch = !quizSearch || q.title.toLowerCase().includes(quizSearch.toLowerCase());
        const matchField = quizField === "all" || q.field === quizField;
        return matchSearch && matchField;
      })
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return quizSort === "desc" ? -diff : diff;
      });
  }, [quizSearch, quizField, quizSort]);

  return (
    <>
      {/* Header – pink gradient */}
      <div className="relative overflow-hidden bg-pink-gradient py-12 border-b border-pink-100">
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #F892B6 0%, #FDDDE8 100%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 border border-pink-200/60 rounded-3xl px-6 py-6 shadow-bubble max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm text-pink-600 font-medium bg-pink-100 border border-pink-200 px-3 py-1 rounded-full mb-3">
              <Heart size={14} />
              Sekcja dla kobiet
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-2">Dla kobiet</h1>
            <p className="text-[color:var(--color-text-secondary)] max-w-xl">
              Wiedza o zdrowiu kobiety – hormony, profilaktyka, ciąża i nie tylko.
              Artykuły pisane przez specjalistów, quizy i ciekawostki.
            </p>
          </div>
        </div>
      </div>

      {/* Curiosities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={18} className="text-pink-500" />
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Ciekawostki</h2>
        </div>
        <CuriositiesCarousel />
      </section>

      {/* Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-pink-100">
        <h2 className="text-xl font-semibold text-[var(--color-text-heading)] mb-5">Artykuły dla kobiet</h2>
        <div className="bg-white/60 border border-pink-100 rounded-2xl px-4 py-3 shadow-sm mb-6">
          <FilterBar
            search={articleSearch}
            onSearchChange={setArticleSearch}
            author={articleAuthor}
            onAuthorChange={setArticleAuthor}
            field={articleField}
            onFieldChange={setArticleField}
            sortOrder={articleSort}
            onSortToggle={() => setArticleSort((s) => (s === "desc" ? "asc" : "desc"))}
          />
        </div>

        {filteredArticles.length === 0 ? (
          <p className="text-[color:var(--color-text-muted)] text-sm py-8 text-center">
            Brak artykułów spełniających kryteria.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.map((article) => (
              <Link key={article.id} href={`/artykuly/${article.slug}`} className="group">
                <div className="bg-white rounded-3xl p-5 h-full border border-pink-100 shadow-bubble hover:shadow-bubble-hover transition-all hover:-translate-y-1 flex flex-col">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full self-start mb-3 border ${fieldColors[article.field]}`}>
                    {article.field}
                  </span>
                  <h3 className="font-semibold text-[var(--color-text-heading)] mb-2 group-hover:text-brand-pink transition-colors leading-snug flex-1">
                    {article.title}
                  </h3>
                  <p className="text-[color:var(--color-text-body)] text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                  <div className="flex gap-4 text-xs text-[color:var(--color-text-muted)] mt-auto pt-3 border-t border-pink-100">
                    <span className="flex items-center gap-1"><User size={11} /> {article.author.name}</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(article.date).toLocaleDateString("pl-PL")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quizzes */}
      {filteredQuizzes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-pink-100">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)] mb-5">Quizy dla kobiet</h2>
          <div className="bg-white/60 border border-pink-100 rounded-2xl px-4 py-3 shadow-sm mb-6">
            <FilterBar
              search={quizSearch}
              onSearchChange={setQuizSearch}
              author="all"
              onAuthorChange={() => {}}
              field={quizField}
              onFieldChange={setQuizField}
              sortOrder={quizSort}
              onSortToggle={() => setQuizSort((s) => (s === "desc" ? "asc" : "desc"))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQuizzes.map((quiz) => (
              <Link key={quiz.id} href={`/quizy/${quiz.slug}`} className="group">
                <div className="tile-pink rounded-3xl p-5 h-full border border-pink-200/50 shadow-bubble hover:-translate-y-1 hover:shadow-bubble-hover transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${fieldColors[quiz.field]}`}>
                      {quiz.field}
                    </span>
                    <Brain size={16} className="text-pink-500" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-heading)] group-hover:text-pink-600 transition-colors flex-1">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)] mt-4 pt-3 border-t border-pink-200/30">
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(quiz.date).toLocaleDateString("pl-PL")}</span>
                    <span>{quiz.questions.length} pytań</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="bg-brand-pink-bg border-t border-pink-100">
        <SpecialistCarousel title="Nasze specjalistki" pink />
      </div>
    </>
  );
}
