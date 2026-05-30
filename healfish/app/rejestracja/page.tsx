"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div
        className="fixed -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #63B4F6, #81E291)" }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="bg-white/70 border border-gray-200 rounded-3xl px-6 py-5 shadow-bubble inline-block">
            <Image
              src="/images/ujecia-ryby-hybby/ujecie2.png"
              alt="Healfish"
              width={72}
              height={72}
              className="w-16 h-16 mx-auto mb-2 rounded-2xl object-cover"
            />
            <Image
              src="/images/logo-napisy/healfish morski.png"
              alt="Healfish"
              width={130}
              height={44}
              className="h-8 w-auto mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-[var(--color-text-title)]">Utwórz konto</h1>
            <p className="text-[color:var(--color-text-secondary)] text-sm mt-1">
              Dołącz do Healfish – za darmo, bez zobowiązań.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8">
          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Imię</label>
                <Input placeholder="Jan" className="rounded-2xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Nazwisko</label>
                <Input placeholder="Kowalski" className="rounded-2xl" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Adres email</label>
              <Input type="email" placeholder="jan.kowalski@email.pl" className="rounded-2xl" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Hasło</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 znaków"
                  className="pr-10 rounded-2xl"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)] hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Newsletter in a soft frame */}
            <label className="flex items-start gap-3 cursor-pointer bg-brand-support/30 border border-brand-blue/15 rounded-2xl p-3">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 accent-brand-blue"
              />
              <span className="text-sm text-[color:var(--color-text-body)]">
                Chcę otrzymywać newsletter z artykułami i poradami zdrowotnymi.
              </span>
            </label>

            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
            >
              Zarejestruj się
            </Button>
          </form>

          <p className="text-center text-sm text-[color:var(--color-text-secondary)] mt-6">
            Masz już konto?{" "}
            <Link href="/logowanie" className="text-brand-blue font-medium hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
