"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div
        className="fixed -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #63B4F6, #81E291)" }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #81E291, #63B4F6)" }}
      />

      <div className="w-full max-w-md relative">
        {/* Header frame */}
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
            <h1 className="text-2xl font-bold text-[var(--color-text-title)]">Zaloguj się</h1>
            <p className="text-[color:var(--color-text-secondary)] text-sm mt-1">
              Witaj z powrotem!
            </p>
          </div>
        </div>

        {/* Form in frame */}
        <div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
                Adres email
              </label>
              <Input
                type="email"
                placeholder="jan.kowalski@email.pl"
                className="w-full rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
                Hasło
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pr-10 rounded-2xl"
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

            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
            >
              Zaloguj się
            </Button>
          </form>

          <p className="text-center text-sm text-[color:var(--color-text-secondary)] mt-6">
            Nie masz konta?{" "}
            <Link href="/rejestracja" className="text-brand-blue font-medium hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
