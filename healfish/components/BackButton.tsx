"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Wróć" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-text-secondary)] hover:text-brand-blue transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
