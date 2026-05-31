"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function HomeCTA() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) return null;

  return (
    <section className="py-16 bg-brand-gradient-soft">
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="bg-white/70 border border-brand-blue/20 rounded-3xl px-8 py-8 shadow-bubble mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-title)] mb-3">
            Dołącz do tysięcy świadomych pacjentów
          </h2>
          <p className="text-[color:var(--color-text-body)] mb-6">
            Zarejestruj się i uzyskaj dostęp do quizów, rabatów u partnerów i personalizowanych artykułów.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rejestracja"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble"
              )}
            >
              Zarejestruj się
            </Link>
            <Link
              href="/logowanie"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full px-8 bg-white"
              )}
            >
              Zaloguj się
            </Link>
          </div>
        </div>

        <div className="bg-white/60 border border-gray-200 rounded-3xl px-6 py-5 shadow-sm">
          <p className="text-sm text-[color:var(--color-text-secondary)] mb-3">
            Lub zapisz się do newslettera
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Twój adres email"
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <Button
              type="submit"
              className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-5"
            >
              Zapisz
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
