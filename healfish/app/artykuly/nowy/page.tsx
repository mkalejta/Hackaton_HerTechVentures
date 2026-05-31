"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Eye, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";

const PLACEHOLDER = `## Wstęp

Napisz kilka zdań wprowadzenia do tematu.

## Przyczyny

- Punkt pierwszy
- Punkt drugi

## Profilaktyka

Opisz zalecenia profilaktyczne.`;

export default function NewArticlePage() {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [forWomen, setForWomen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !user?.is_doctor)) {
      router.push("/artykuly");
    }
  }, [loading, isLoggedIn, user, router]);

  if (loading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { slug } = await api.createArticle({
        title,
        content,
        for_women: forWomen,
        source_url: sourceUrl.trim() || undefined,
      });
      router.push(`/artykuly/${slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd zapisu artykułu");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPreview = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <h2 key={i} className="text-xl font-bold text-[var(--color-text-heading)] mt-6 mb-2">{line.replace("## ", "")}</h2>;
      if (line.startsWith("**") && line.endsWith("**"))
        return <p key={i} className="font-semibold text-[var(--color-text-heading)] mt-3">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- "))
        return <li key={i} className="ml-5 list-disc text-[color:var(--color-text-body)]">{line.replace("- ", "")}</li>;
      if (!line.trim()) return null;
      return <p key={i} className="text-[color:var(--color-text-body)] leading-relaxed">{line}</p>;
    });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <BackButton label="Wróć do artykułów" />

      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-5 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          <PenLine size={14} />
          Nowy artykuł
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-title)]">
          Napisz artykuł
        </h1>
        <p className="text-sm text-[color:var(--color-text-secondary)] mt-1">
          Specjalizacja: <strong>{user.specialty || "nieznana"}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
              Tytuł <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl text-base"
              placeholder="np. Jak dbać o tarczycę – poradnik profilaktyczny"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
              Źródło naukowe <span className="text-[color:var(--color-text-muted)] font-normal">(opcjonalnie)</span>
            </label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="rounded-2xl"
              placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
              type="url"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={forWomen}
              onChange={(e) => setForWomen(e.target.checked)}
              className="accent-brand-pink w-4 h-4"
            />
            <span className="text-sm text-[color:var(--color-text-body)]">
              Artykuł z sekcji <strong>Dla kobiet</strong>
            </span>
          </label>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[var(--color-text-heading)]">
              Treść <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue hover:underline"
            >
              <Eye size={13} />
              {preview ? "Edytuj" : "Podgląd"}
            </button>
          </div>

          {preview ? (
            <div className="prose prose-sm max-w-none min-h-[300px] bg-gray-50 rounded-2xl p-4 space-y-2">
              {renderPreview(content)}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white font-mono leading-relaxed"
              rows={18}
              placeholder={PLACEHOLDER}
              required
            />
          )}

          <p className="text-xs text-[color:var(--color-text-muted)] mt-2">
            Obsługiwany format: <code>## Nagłówek</code>, <code>**pogrubienie**</code>, <code>- lista</code>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3 border border-red-200">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble"
          >
            {submitting ? "Publikowanie..." : "Opublikuj artykuł"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/artykuly")}
            className="rounded-full"
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
}
