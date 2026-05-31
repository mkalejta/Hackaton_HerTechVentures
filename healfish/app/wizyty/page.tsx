"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Stethoscope, X, RefreshCw, AlertCircle } from "lucide-react";
import { api, ApiAppointment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AppointmentsPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/logowanie");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.getMyAppointments()
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setApptLoading(false));
  }, [isLoggedIn]);

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await api.cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
    } catch {
    } finally {
      setCancelling(null);
    }
  };

  const openReschedule = (appt: ApiAppointment) => {
    setRescheduleId(appt.id);
    setRescheduleDate(appt.appointment_date);
    setRescheduleSlot("");
    setRescheduleSlots([]);
    setRescheduleError(null);
  };

  useEffect(() => {
    if (!rescheduleId || !rescheduleDate) return;
    const appt = appointments.find((a) => a.id === rescheduleId);
    if (!appt) return;
    api.getDoctorSlots(appt.doctor_id, rescheduleDate)
      .then((d) => setRescheduleSlots(d.slots))
      .catch(() => setRescheduleSlots([]));
  }, [rescheduleId, rescheduleDate, appointments]);

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleSlot) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      await api.rescheduleAppointment(rescheduleId, {
        appointment_date: rescheduleDate,
        start_time: rescheduleSlot,
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleId
            ? { ...a, appointment_date: rescheduleDate, start_time: rescheduleSlot }
            : a
        )
      );
      setRescheduleId(null);
    } catch (err: unknown) {
      setRescheduleError(err instanceof Error ? err.message : "Błąd zmiany terminu");
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return null;

  const upcoming = appointments.filter(
    (a) => a.status === "scheduled" && a.appointment_date >= getTodayStr()
  );
  const past = appointments.filter(
    (a) => a.status !== "scheduled" || a.appointment_date < getTodayStr()
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-6 shadow-bubble mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-brand-blue font-medium tile-support border border-brand-blue/20 px-3 py-1 rounded-full mb-3">
          <CalendarDays size={14} />
          Wizyty
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Moje wizyty</h1>
        <p className="text-[color:var(--color-text-body)]">
          Zarządzaj swoimi zaplanowanymi wizytami u lekarzy.
        </p>
      </div>

      {apptLoading ? (
        <p className="text-center text-[color:var(--color-text-muted)] py-10">Ładowanie...</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-8 text-center">
          <CalendarDays size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-text-heading)] mb-1">Brak wizyt</p>
          <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
            Nie masz jeszcze żadnych zarezerwowanych wizyt.
          </p>
          <Link href="/lekarze">
            <Button className="bg-brand-blue hover:bg-blue-400 text-white rounded-full">
              Znajdź specjalistę
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 mb-6">
              <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-brand-blue" />
                Nadchodzące ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id}>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Stethoscope size={16} className="text-brand-blue" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--color-text-heading)]">
                              {a.doctor_first_name} {a.doctor_last_name}
                            </p>
                            <p className="text-xs text-[color:var(--color-text-secondary)]">{a.specialization}</p>
                            <p className="text-xs text-[color:var(--color-text-muted)] mt-1 flex items-center gap-1">
                              <Clock size={11} />
                              {a.appointment_date} · {a.start_time}–{a.end_time}
                            </p>
                            {a.description && (
                              <p className="text-xs text-[color:var(--color-text-secondary)] mt-1 italic">{a.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[a.status]}`}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openReschedule(a)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline"
                        >
                          <RefreshCw size={12} />
                          Zmień termin
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleCancel(a.id)}
                          disabled={cancelling === a.id}
                          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                        >
                          <X size={12} />
                          {cancelling === a.id ? "..." : "Odwołaj"}
                        </button>
                      </div>
                    </div>

                    {/* Reschedule panel */}
                    {rescheduleId === a.id && (
                      <div className="mt-2 p-4 bg-brand-support/30 border border-brand-blue/15 rounded-2xl">
                        <p className="text-sm font-medium text-[var(--color-text-heading)] mb-3">
                          Wybierz nowy termin
                        </p>
                        <div className="flex flex-wrap gap-3 mb-3">
                          <input
                            type="date"
                            value={rescheduleDate}
                            min={getTodayStr()}
                            onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleSlot(""); }}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                          />
                        </div>
                        {rescheduleSlots.length === 0 ? (
                          <p className="text-xs text-[color:var(--color-text-muted)]">Brak dostępnych godzin w tym dniu.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {rescheduleSlots.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRescheduleSlot(s)}
                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                                  rescheduleSlot === s
                                    ? "bg-brand-blue text-white border-brand-blue"
                                    : "bg-white border-gray-200 hover:border-brand-blue"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {rescheduleError && (
                          <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
                            <AlertCircle size={12} /> {rescheduleError}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleReschedule}
                            disabled={!rescheduleSlot || rescheduling}
                            className="bg-brand-blue hover:bg-blue-400 text-white rounded-full text-xs"
                          >
                            {rescheduling ? "Zmieniam..." : "Potwierdź"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRescheduleId(null)}
                            className="rounded-full text-xs"
                          >
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
              <h2 className="text-base font-semibold text-[var(--color-text-heading)] mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Historia wizyt
              </h2>
              <div className="space-y-3">
                {past.map((a) => (
                  <div key={a.id} className="p-4 bg-gray-50 rounded-2xl opacity-70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-[var(--color-text-heading)]">
                          {a.doctor_first_name} {a.doctor_last_name}
                        </p>
                        <p className="text-xs text-[color:var(--color-text-muted)]">
                          {a.appointment_date} · {a.start_time}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
