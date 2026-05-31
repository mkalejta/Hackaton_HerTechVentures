"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { access_token } = await api.login(email, password);
      await login(access_token);
      router.push(callbackUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd logowania");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
            Adres email
          </label>
          <Input
            type="email"
            placeholder="jan.kowalski@email.pl"
            className="w-full rounded-2xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
      </form>

      <p className="text-center text-sm text-[color:var(--color-text-secondary)] mt-6">
        Nie masz konta?{" "}
        <Link
          href={`/rejestracja${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-brand-blue font-medium hover:underline"
        >
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        className="fixed -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #63B4F6, #81E291)" }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #81E291, #63B4F6)" }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-4">
          <Image
            src="/images/logo.png"
            alt="Healfish"
            width={128}
            height={128}
            className="w-32 h-32 mx-auto rounded-3xl shadow-bubble object-cover"
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-title)]">Zaloguj się</h1>
          <p className="text-[color:var(--color-text-secondary)] text-sm mt-1">
            Witaj z powrotem!
          </p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8 text-center text-sm text-[color:var(--color-text-muted)]">Ładowanie...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
