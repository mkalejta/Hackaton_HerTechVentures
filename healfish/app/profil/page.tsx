"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Save, CheckCircle2, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const GENDER_OPTIONS = [
  { value: "Kobieta", label: "Kobieta" },
  { value: "Mężczyzna", label: "Mężczyzna" },
  { value: "Inna", label: "Inna" },
];

export default function ProfilePage() {
  const { user, isLoggedIn, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  // Doctor-specific
  const [specialty, setSpecialty] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [bio, setBio] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/logowanie");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setAge(user.age != null ? String(user.age) : "");
      setGender(user.gender ?? "");
      setWeight(user.weight != null ? String(user.weight) : "");
      setHeight(user.height != null ? String(user.height) : "");
      setSpecialty(user.specialty ?? "");
      setStreetAddress(user.street_address ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  if (loading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateProfile({
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        ...(user.is_doctor && {
          specialty: specialty || undefined,
          street_address: streetAddress || undefined,
          bio: bio || undefined,
        }),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-6 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          {user.is_doctor ? <Stethoscope size={14} /> : <User size={14} />}
          {user.is_doctor ? "Profil lekarza" : "Mój profil"}
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">
          Profil użytkownika
        </h1>
        <p className="text-[color:var(--color-text-body)]">
          {user.is_doctor
            ? "Dane wyświetlane pacjentom i synchronizowane z kartami specjalisty."
            : "Uzupełnij swoje dane zdrowotne, aby otrzymywać jeszcze lepiej dopasowane wyniki w Self Check."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
          <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4">
            Dane podstawowe
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Imię</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-2xl" placeholder="Jan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Nazwisko</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-2xl" placeholder="Kowalski" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Adres email</label>
            <Input value={user.email} disabled className="rounded-2xl bg-gray-50 text-[color:var(--color-text-muted)]" />
          </div>
        </div>

        {/* Doctor-specific fields */}
        {user.is_doctor && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
            <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-1">
              Dane gabinetu
            </h2>
            <p className="text-xs text-[color:var(--color-text-muted)] mb-4">
              Synchronizowane z kartą lekarza widoczną dla pacjentów.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Specjalizacja</label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="rounded-2xl" placeholder="np. Kardiologia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Adres gabinetu</label>
                <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="rounded-2xl" placeholder="ul. Długa 1/2, 80-001 Gdańsk" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Opis</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white"
                  rows={3}
                  placeholder="Kilka słów o doświadczeniu..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Health params — only for patients */}
        {!user.is_doctor && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
            <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-1">
              Parametry zdrowotne
            </h2>
            <p className="text-xs text-[color:var(--color-text-muted)] mb-4">
              Opcjonalne — używane w Self Check gdy włączysz „Uwzględniaj moje parametry".
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Wiek</label>
                <Input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="rounded-2xl" placeholder="np. 30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Płeć</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-[color:var(--color-text-body)]"
                >
                  <option value="">Wybierz...</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Waga (kg)</label>
                <Input type="number" min={1} max={300} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} className="rounded-2xl" placeholder="np. 70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">Wzrost (cm)</label>
                <Input type="number" min={50} max={250} step={0.1} value={height} onChange={(e) => setHeight(e.target.value)} className="rounded-2xl" placeholder="np. 175" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble">
            <Save size={16} className="mr-2" />
            {saving ? "Zapisywanie..." : "Zapisz profil"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 size={16} />
              Zapisano!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
