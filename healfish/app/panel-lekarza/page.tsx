"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stethoscope, Save, CheckCircle2, CalendarDays, Clock, User, X } from "lucide-react";
import { api, ApiAvailabilityDay, ApiDoctorAppointment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

type DayState = {
  enabled: boolean;
  start_time: string;
  end_time: string;
};

const DEFAULT_DAYS: DayState[] = DAY_NAMES.map((_, i) => ({
  enabled: i < 5,
  start_time: "08:00",
  end_time: "16:00",
}));

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Zaplanowana",
  cancelled: "Odwołana",
  completed: "Zakończona",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function DoctorPanelPage() {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState<DayState[]>(DEFAULT_DAYS.map((d) => ({ ...d })));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<ApiDoctorAppointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !user?.is_doctor)) {
      router.push("/");
    }
  }, [loading, isLoggedIn, user, router]);

  useEffect(() => {
    if (!isLoggedIn || !user?.is_doctor) return;
    api.getMyAvailability().then((data) => {
      if (data.length === 0) return;
      const newDays = DEFAULT_DAYS.map((d) => ({ ...d, enabled: false }));
      for (const slot of data) {
        newDays[slot.day_of_week] = { enabled: true, start_time: slot.start_time, end_time: slot.end_time };
      }
      setDays(newDays);
    }).catch(() => {});
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!isLoggedIn || !user?.is_doctor) return;
    api.getDoctorAppointments()
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setApptLoading(false));
  }, [isLoggedIn, user]);

  if (loading || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const slots: ApiAvailabilityDay[] = days
        .map((d, i) => ({ day_of_week: i, start_time: d.start_time, end_time: d.end_time, enabled: d.enabled }))
        .filter((d) => d.enabled)
        .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }));
      await api.setAvailability(slots);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await api.cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch {
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = appointments.filter(
    (a) => a.status === "scheduled" && a.appointment_date >= new Date().toISOString().slice(0, 10)
  );
  const past = appointments.filter(
    (a) => a.status !== "scheduled" || a.appointment_date < new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-6 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          <Stethoscope size={14} />
          Panel Lekarza
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">
          Witaj, {user.first_name}!
        </h1>
        <p className="text-[color:var(--color-text-body)]">
          Zarządzaj swoją dostępnością i wizytami pacjentów.
        </p>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 mb-8">
        <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4 flex items-center gap-2">
          <Clock size={18} className="text-brand-blue" />
          Godziny przyjęć
        </h2>
        <div className="space-y-3">
          {days.map((day, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 w-36 cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, enabled: e.target.checked } : d))}
                  className="accent-brand-blue"
                />
                <span className={`text-sm font-medium ${day.enabled ? "text-[var(--color-text-heading)]" : "text-[color:var(--color-text-muted)]"}`}>
                  {DAY_NAMES[i]}
                </span>
              </label>
              {day.enabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, start_time: e.target.value } : d))}
                    className="text-sm border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <span className="text-[color:var(--color-text-muted)] text-sm">–</span>
                  <input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, end_time: e.target.value } : d))}
                    className="text-sm border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {saveError && <p className="text-red-500 text-sm mt-3">{saveError}</p>}

        <div className="flex items-center gap-3 mt-5">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
          >
            <Save size={15} className="mr-2" />
            {saving ? "Zapisywanie..." : "Zapisz dostępność"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 size={15} />
              Zapisano!
            </span>
          )}
        </div>
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 mb-6">
        <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-brand-blue" />
          Nadchodzące wizyty ({upcoming.length})
        </h2>
        {apptLoading ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">Ładowanie...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">Brak zaplanowanych wizyt.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[var(--color-text-heading)]">
                      {a.patient_first_name} {a.patient_last_name}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {a.appointment_date} · {a.start_time}–{a.end_time}
                    </p>
                    {a.description && (
                      <p className="text-xs text-[color:var(--color-text-secondary)] mt-0.5 italic">{a.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(a.id)}
                  disabled={cancelling === a.id}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  <X size={13} />
                  {cancelling === a.id ? "..." : "Odwołaj"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past appointments */}
      {past.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
          <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Historia wizyt
          </h2>
          <div className="space-y-3">
            {past.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl opacity-70">
                <div>
                  <p className="font-medium text-sm text-[var(--color-text-heading)]">
                    {a.patient_first_name} {a.patient_last_name}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {a.appointment_date} · {a.start_time}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
