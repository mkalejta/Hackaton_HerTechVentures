"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, User, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function RegisterForm() {
  const [tab, setTab] = useState<"patient" | "doctor">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pwzNumber, setPwzNumber] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { login } = useAuth();

  useEffect(() => {
    api.getSpecializations().then(setSpecializations).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (tab === "patient") {
        const { access_token } = await api.register({ first_name: firstName, last_name: lastName, email, password, newsletter });
        await login(access_token);
      } else {
        const { access_token } = await api.registerDoctor({
          first_name: firstName, last_name: lastName, email, password,
          specialty, street_address: streetAddress, pwz_number: pwzNumber,
          title: title || undefined, bio: bio || undefined, newsletter,
        });
        await login(access_token);
      }
      router.push(callbackUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd rejestracji");
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("patient")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
            tab === "patient"
              ? "bg-white text-brand-blue shadow-sm"
              : "text-[color:var(--color-text-muted)] hover:text-brand-blue"
          )}
        >
          <User size={15} />
          Pacjent
        </button>
        <button
          type="button"
          onClick={() => setTab("doctor")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
            tab === "doctor"
              ? "bg-white text-brand-blue shadow-sm"
              : "text-[color:var(--color-text-muted)] hover:text-brand-blue"
          )}
        >
          <Stethoscope size={15} />
          Lekarz
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Imię</label>
              <Input
                placeholder="Jan"
                className="rounded-2xl"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Nazwisko</label>
              <Input
                placeholder="Kowalski"
                className="rounded-2xl"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Adres email</label>
            <Input
              type="email"
              placeholder="jan.kowalski@email.pl"
              className="rounded-2xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Hasło</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 znaków"
                className="pr-10 rounded-2xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          {tab === "doctor" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Tytuł naukowy</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                >
                  <option value="">Brak tytułu</option>
                  <option value="lek.">lek.</option>
                  <option value="lek. dent.">lek. dent.</option>
                  <option value="mgr">mgr</option>
                  <option value="dr">dr</option>
                  <option value="dr n. med.">dr n. med.</option>
                  <option value="dr hab.">dr hab.</option>
                  <option value="dr hab. n. med.">dr hab. n. med.</option>
                  <option value="prof. dr hab.">prof. dr hab.</option>
                  <option value="prof.">prof.</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Numer PWZ</label>
                <Input
                  placeholder="np. 1234567"
                  className="rounded-2xl"
                  value={pwzNumber}
                  onChange={(e) => setPwzNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Specjalizacja</label>
                {specializations.length > 0 ? (
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                  >
                    <option value="">Wybierz specjalizację...</option>
                    {specializations.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="np. Kardiologia"
                    className="rounded-2xl"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Adres gabinetu</label>
                <Input
                  placeholder="ul. Długa 1/2, 80-001 Gdańsk"
                  className="rounded-2xl"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
                  Krótki opis <span className="text-[color:var(--color-text-muted)] font-normal">(opcjonalnie)</span>
                </label>
                <textarea
                  placeholder="Kilka słów o sobie i swoim doświadczeniu..."
                  className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

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
            {tab === "doctor" ? "Zarejestruj się jako lekarz" : "Zarejestruj się"}
          </Button>

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </form>

        <p className="text-center text-sm text-[color:var(--color-text-secondary)] mt-6">
          Masz już konto?{" "}
          <Link
            href={`/logowanie${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="text-brand-blue font-medium hover:underline"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        className="fixed -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #63B4F6, #81E291)" }}
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
          <h1 className="text-2xl font-bold text-[var(--color-text-title)]">Utwórz konto</h1>
          <p className="text-[color:var(--color-text-secondary)] text-sm mt-1">
            Dołącz do Healfish – za darmo, bez zobowiązań.
          </p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-3xl shadow-bubble border border-gray-100 p-8 text-center text-sm text-[color:var(--color-text-muted)]">Ładowanie...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
