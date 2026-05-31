"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { Lock, Stethoscope, Tag, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { api, ApiDiscount } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<number, string> = {
  500: "bg-blue-50 border-blue-200",
  700: "bg-purple-50 border-purple-200",
  1000: "bg-amber-50 border-amber-200",
};

const TIER_BADGE: Record<number, string> = {
  500: "bg-blue-100 text-blue-700 border-blue-200",
  700: "bg-purple-100 text-purple-700 border-purple-200",
  1000: "bg-amber-100 text-amber-700 border-amber-200",
};

const STORAGE_KEY = "hf_active_discount";

type ActiveDiscount = {
  discount: ApiDiscount;
  code: string;
  expiresAt: number;
};

function saveActive(a: ActiveDiscount) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

function loadActive(): ActiveDiscount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: ActiveDiscount = JSON.parse(raw);
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearActive() {
  localStorage.removeItem(STORAGE_KEY);
}

function CountdownTimer({ expiresAt, onExpired }: { expiresAt: number; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
      if (left === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onExpired();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="font-mono font-bold text-orange-600">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

function getTierKey(cost: number): number {
  if (cost <= 500) return 500;
  if (cost <= 700) return 700;
  return 1000;
}

export default function ZnizkiPage() {
  const { user, isLoggedIn, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<ApiDiscount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [active, setActive] = useState<ActiveDiscount | null>(null);
  const [activating, setActivating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDiscounts().then(setDiscounts).finally(() => setLoadingDiscounts(false));
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const saved = loadActive();
      if (saved) setActive(saved);
    }
  }, [isLoggedIn]);

  if (loading) return null;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-10">
          <div className="w-16 h-16 rounded-3xl tile-blue flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock size={28} className="text-brand-blue" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-title)] mb-3">Zniżki tylko dla zalogowanych</h2>
          <p className="text-[color:var(--color-text-body)] mb-6">
            Zaloguj się, by aktywować zniżki i korzystać z rabatów u partnerów.
          </p>
          <Button onClick={() => router.push("/logowanie?callbackUrl=/znizki")}
            className="w-full bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble">
            Zaloguj się
          </Button>
        </div>
      </div>
    );
  }

  if (user?.is_doctor) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-10">
          <p className="text-[color:var(--color-text-muted)]">Ta sekcja jest dostępna tylko dla pacjentów.</p>
        </div>
      </div>
    );
  }

  const handleActivate = async (discount: ApiDiscount) => {
    if (!user) return;
    if (user.points_total < discount.points_cost) {
      setError(`Potrzebujesz ${discount.points_cost} rybbsów. Masz tylko ${user.points_total}.`);
      return;
    }
    setError(null);
    setActivating(discount.id);
    try {
      const { code } = await api.redeemDiscount(discount.id);
      await refreshUser();
      const newActive: ActiveDiscount = { discount, code, expiresAt: Date.now() + 20 * 60 * 1000 };
      saveActive(newActive);
      setActive(newActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd aktywacji zniżki");
    } finally {
      setActivating(null);
    }
  };

  if (active) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-bubble p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
            <CheckCircle2 size={14} />
            Zniżka aktywna
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-title)] mb-1">
            {active.discount.discount_percent}% zniżki
          </h2>
          <p className="text-sm text-[color:var(--color-text-secondary)] mb-5">
            {active.discount.description}
          </p>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <QRCodeSVG value="https://www.youtube.com/watch?v=dQw4w9WgXcQ" size={200} />
            </div>
          </div>

          <p className="text-xs text-[color:var(--color-text-muted)] mb-2 font-mono tracking-widest">
            {active.code}
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-[color:var(--color-text-secondary)]">
            <Clock size={14} />
            Ważny przez:{" "}
            <CountdownTimer
              expiresAt={active.expiresAt}
              onExpired={() => { clearActive(); setActive(null); }}
            />
          </div>

          <Button
            variant="outline"
            className="rounded-full w-full"
            onClick={() => { clearActive(); setActive(null); }}
          >
            Wróć do zniżek
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-5 shadow-bubble mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Zniżki</h1>
            <p className="text-[color:var(--color-text-secondary)]">
              Wymień zebrane rybki na rabaty u lekarzy partnerów.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-blue/20 rounded-2xl px-4 py-2 shadow-sm">
            <span className="font-bold text-brand-blue text-xl">{user?.points_total ?? 0}</span>
            <Image src="/images/rybbs.png" alt="rybki" width={48} height={20} className="h-5 w-auto" />
            <span className="text-sm text-[color:var(--color-text-secondary)]">Twoje rybki</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingDiscounts ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">Ładowanie...</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">
          Brak dostępnych zniżek.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {discounts.map((d) => {
            const tier = getTierKey(d.points_cost);
            const canAfford = (user?.points_total ?? 0) >= d.points_cost;
            return (
              <div
                key={d.id}
                className={cn(
                  "rounded-3xl p-6 border shadow-bubble flex flex-col gap-4",
                  TIER_COLORS[tier] ?? "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                    TIER_BADGE[tier] ?? "bg-gray-100 text-gray-700 border-gray-200"
                  )}>
                    <Image src="/images/rybbs.png" alt="rybki" width={32} height={14} className="h-3.5 w-auto" />
                    {d.points_cost} rybbsów
                  </span>
                  <div className="flex items-center gap-1 text-2xl font-bold text-[var(--color-text-title)]">
                    <Tag size={18} />
                    -{d.discount_percent}%
                  </div>
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text-heading)] mb-1">{d.description}</p>
                  <div className="flex items-center gap-1.5 text-sm text-[color:var(--color-text-secondary)] mt-1">
                    <Stethoscope size={13} />
                    {[d.author_title, d.author_first_name, d.author_last_name].filter(Boolean).join(" ")} · {d.specialization}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-muted)] mt-1">
                    <MapPin size={11} />
                    {d.location}
                  </div>
                  {d.valid_until && (
                    <p className="text-xs text-[color:var(--color-text-muted)] mt-1">
                      Ważna do: {new Date(d.valid_until).toLocaleDateString("pl-PL")}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleActivate(d)}
                  disabled={!canAfford || activating === d.id}
                  className={cn(
                    "w-full rounded-full shadow-sm",
                    canAfford
                      ? "bg-brand-blue hover:bg-blue-400 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {activating === d.id
                    ? "Aktywowanie..."
                    : canAfford
                    ? "Aktywuj zniżkę"
                    : `Brakuje ${d.points_cost - (user?.points_total ?? 0)} rybbsów`}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
