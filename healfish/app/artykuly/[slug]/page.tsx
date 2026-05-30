import { articles } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CalendarDays, ExternalLink, BookOpen, Brain, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { params: { slug: string } };

export default async function ArticlePage({ params }: Props) {
  const { slug } = params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <>
      {/* Header */}
      <div className="bg-brand-gradient-soft py-10 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support px-3 py-1 rounded-full mb-4 border border-brand-blue/20">
            <BookOpen size={14} />
            {article.field}
          </div>
          {/* Title in frame */}
          <div className="bg-white/70 border border-gray-200/70 rounded-3xl px-6 py-5 shadow-bubble">
            <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-3 leading-snug">
              {article.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Opublikowano: {new Date(article.date).toLocaleDateString("pl-PL")}
              </span>
              {article.modifiedDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Aktualizacja: {new Date(article.modifiedDate).toLocaleDateString("pl-PL")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Author card */}
        <div className="tile-green rounded-3xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4 border border-white/50 shadow-bubble">
          <div>
            <p className="font-semibold text-[var(--color-text-heading)]">{article.author.name}</p>
            <p className="text-sm text-[color:var(--color-text-body)]">{article.author.specialization}</p>
            <div className="flex items-center gap-1 text-xs text-[color:var(--color-text-secondary)] mt-1">
              <MapPin size={11} />
              {article.author.location}
            </div>
          </div>
          <a
            href={article.author.znanyLekarzUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-brand-blue font-medium hover:underline"
          >
            Umów wizytę <ExternalLink size={13} />
          </a>
        </div>

        {/* Article content – ciągły tekst */}
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

        {/* Links */}
        <div className="flex flex-wrap gap-3 mb-8">
          {article.studyUrl && (
            <a
              href={article.studyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-brand-blue transition-colors shadow-sm"
            >
              <ExternalLink size={14} className="text-brand-blue" />
              Źródło naukowe
            </a>
          )}
          {article.relatedQuizSlug && (
            <Link
              href={`/quizy/${article.relatedQuizSlug}`}
              className="flex items-center gap-2 text-sm tile-support border border-brand-blue/20 rounded-full px-4 py-2 hover:bg-brand-support transition-colors shadow-sm"
            >
              <Brain size={14} className="text-brand-blue" />
              Rozwiąż powiązany quiz
            </Link>
          )}
        </div>

        {/* CTA */}
        <div className="bg-brand-gradient-soft rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-blue/10 shadow-bubble">
          <div>
            <p className="font-semibold text-[var(--color-text-heading)]">
              Chcesz skonsultować się z {article.author.name}?
            </p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Umów wizytę przez Znany Lekarz
            </p>
          </div>
          <a
            href={article.author.znanyLekarzUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-6 shadow-bubble"
            )}
          >
            Umów wizytę
          </a>
        </div>
      </div>

    </>
  );
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
