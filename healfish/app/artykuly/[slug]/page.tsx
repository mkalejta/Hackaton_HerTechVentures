"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { CalendarDays, ExternalLink, BookOpen, Brain, MapPin, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiArticleDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getArticle(slug).then(setArticle).catch(() => setNotFoundState(true));
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm("Czy na pewno chcesz usunąć ten artykuł?")) return;
    setDeleting(true);
    try {
      await api.deleteArticle(slug);
      router.push("/artykuly");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Błąd usuwania");
      setDeleting(false);
    }
  };

  const isAuthor = user && article && user.id === article.author_id;

  if (notFoundState) return <div className="text-center py-20">Artykuł nie znaleziony.</div>;
  if (!article) return <div className="text-center py-20">Ładowanie...</div>;

  return (
    <>
      <div className="bg-brand-gradient-soft py-10 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <BackButton label="Wróć do artykułów" />
            {isAuthor && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 gap-1.5"
              >
                <Trash2 size={14} />
                {deleting ? "Usuwanie..." : "Usuń artykuł"}
              </Button>
            )}
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support px-3 py-1 rounded-full mb-4 border border-brand-blue/20">
            <BookOpen size={14} />
            {article.specialization}
          </div>
          <div className="bg-white/70 border border-gray-200/70 rounded-3xl px-6 py-5 shadow-bubble">
            <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-3 leading-snug">
              {article.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Opublikowano: {new Date(article.published_at).toLocaleDateString("pl-PL")}
              </span>
              {article.updated_at && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Aktualizacja: {new Date(article.updated_at).toLocaleDateString("pl-PL")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="tile-green rounded-3xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4 border border-white/50 shadow-bubble">
          <div>
            <p className="font-semibold text-[var(--color-text-heading)]">{article.author_first_name} {article.author_last_name}</p>
            <p className="text-sm text-[color:var(--color-text-body)]">{article.author_specialization}</p>
            <div className="flex items-center gap-1 text-xs text-[color:var(--color-text-secondary)] mt-1">
              <MapPin size={11} />
              {article.author_location}
            </div>
          </div>
          <Link
            href={`/lekarze/${article.author_id}`}
            className="flex items-center gap-1.5 text-sm text-brand-blue font-medium hover:underline"
          >
            <Calendar size={13} />
            {article.author_user_id ? "Umów wizytę" : "Zobacz profil"}
          </Link>
        </div>

        <div className="mb-10 space-y-4">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h2 key={i} className="text-xl font-bold text-[var(--color-text-heading)] mt-8 mb-2 pt-4 border-t border-gray-100">
                  {line.replace("## ", "")}
                </h2>
              );
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-semibold text-[var(--color-text-heading)] mt-4">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <li key={i} className="ml-5 list-disc text-[color:var(--color-text-body)] leading-relaxed">
                  {line.replace("- ", "")}
                </li>
              );
            }
            if (!line.trim()) return null;
            return (
              <p key={i} className="text-[color:var(--color-text-body)] leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-brand-blue transition-colors shadow-sm"
            >
              <ExternalLink size={14} className="text-brand-blue" />
              Źródło naukowe
            </a>
          )}
          {article.quiz_slug && (
            <Link
              href={`/quizy/${article.quiz_slug}`}
              className="flex items-center gap-2 text-sm tile-support border border-brand-blue/20 rounded-full px-4 py-2 hover:bg-brand-support transition-colors shadow-sm"
            >
              <Brain size={14} className="text-brand-blue" />
              Rozwiąż powiązany quiz
            </Link>
          )}
        </div>

        <div className="bg-brand-gradient-soft rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-blue/10 shadow-bubble">
          <div>
            <p className="font-semibold text-[var(--color-text-heading)]">
              Chcesz skonsultować się z {article.author_first_name} {article.author_last_name}?
            </p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {article.author_user_id ? "Umów wizytę online – wybierz termin" : "Sprawdź profil lekarza"}
            </p>
          </div>
          <Link
            href={`/lekarze/${article.author_id}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-6 shadow-bubble"
            )}
          >
            <Calendar size={15} className="mr-2" />
            {article.author_user_id ? "Umów wizytę" : "Profil lekarza"}
          </Link>
        </div>
      </div>
    </>
  );
}
