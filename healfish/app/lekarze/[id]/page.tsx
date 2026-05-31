"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stethoscope, MapPin, Clock, CalendarDays, CheckCircle2, AlertCircle, User } from "lucide-react";
import { api, ApiDoctorProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";

const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DoctorPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  const [doctor, setDoctor] = useState<ApiDoctorProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    api.getDoctorProfile(id).then(setDoctor).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (user) {
      setPatientFirstName(user.first_name);
      setPatientLastName(user.last_name);
    }
  }, [user]);

  useEffect(() => {
    if (!doctor?.is_bookable || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot("");
    api.getDoctorSlots(id, selectedDate)
      .then((data) => setSlots(data.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctor, id, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/logowanie"); return; }
    if (!selectedSlot) return;
    setBooking(true);
    setBookingError(null);
    try {
      await api.bookAppointment({
        doctor_id: parseInt(id),
        appointment_date: selectedDate,
        start_time: selectedSlot,
        patient_first_name: patientFirstName,
        patient_last_name: patientLastName,
        patient_phone: patientPhone || undefined,
        description: description || undefined,
      });
      setBookingSuccess(true);
      setSelectedSlot("");
      setSlots((prev) => prev.filter((s) => s !== selectedSlot));
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Błąd rezerwacji");
    } finally {
      setBooking(false);
    }
  };

  if (notFound) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-[color:var(--color-text-muted)]">Nie znaleziono lekarza.</p>
    </div>
  );

  if (!doctor) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-[color:var(--color-text-muted)]">Ładowanie...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <BackButton label="Wróć" />

      {/* Doctor card */}
      <div className="tile-green rounded-3xl p-6 shadow-bubble border border-white/50 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={26} className="text-brand-blue" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-title)]">{doctor.name}</h1>
            <p className="text-brand-blue font-medium mt-0.5">{doctor.specialization}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-[color:var(--color-text-secondary)]">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {doctor.location}
              </span>
              {doctor.street_address && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {doctor.street_address}
                </span>
              )}
            </div>
            {doctor.bio && (
              <p className="mt-3 text-sm text-[color:var(--color-text-body)] leading-relaxed">{doctor.bio}</p>
            )}
          </div>
        </div>

        {doctor.schedule.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/60">
            <p className="text-xs font-semibold text-[color:var(--color-text-muted)] mb-2 uppercase tracking-wide">
              Godziny przyjęć
            </p>
            <div className="flex flex-wrap gap-2">
              {doctor.schedule.map((s) => (
                <span key={s.day_of_week} className="text-xs bg-white/70 border border-white/60 rounded-full px-3 py-1 text-[color:var(--color-text-body)]">
                  {DAY_NAMES[s.day_of_week]}: {s.start_time}–{s.end_time}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking section */}
      {!doctor.is_bookable ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6 text-center">
          <Clock size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-text-heading)] mb-1">
            Brak kalendarza online
          </p>
          <p className="text-sm text-[color:var(--color-text-muted)]">
            Ten lekarz nie ma jeszcze kalendarza online. Skontaktuj się z gabinetem bezpośrednio.
          </p>
        </div>
      ) : bookingSuccess ? (
        <div className="bg-white rounded-3xl border border-green-200 shadow-bubble p-6 text-center">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-text-heading)] text-lg mb-1">
            Wizyta zarezerwowana!
          </p>
          <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
            Twoja wizyta została potwierdzona. Znajdziesz ją w sekcji &quot;Wizyty&quot;.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setBookingSuccess(false)}
              variant="outline"
              className="rounded-full"
            >
              Zarezerwuj kolejną
            </Button>
            <Button
              onClick={() => router.push("/wizyty")}
              className="bg-brand-blue hover:bg-blue-400 text-white rounded-full"
            >
              Moje wizyty
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bubble p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-heading)] mb-5 flex items-center gap-2">
            <CalendarDays size={20} className="text-brand-blue" />
            Zarezerwuj wizytę
          </h2>

          {/* Date picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
              Wybierz datę
            </label>
            <input
              type="date"
              value={selectedDate}
              min={getTodayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
            />
          </div>

          {/* Time slots */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--color-text-heading)] mb-1.5">
              Dostępne godziny
            </label>
            {slotsLoading ? (
              <p className="text-sm text-[color:var(--color-text-muted)]">Ładowanie slotów...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-muted)]">
                Brak dostępnych terminów w tym dniu.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedSlot === slot
                        ? "bg-brand-blue text-white border-brand-blue shadow-bubble"
                        : "bg-white border-gray-200 text-[color:var(--color-text-body)] hover:border-brand-blue hover:text-brand-blue"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <form onSubmit={handleBook} className="space-y-4">
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-[var(--color-text-heading)] mb-3 flex items-center gap-1.5">
                  <User size={15} />
                  Dane pacjenta
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[color:var(--color-text-muted)] mb-1">Imię</label>
                    <Input
                      value={patientFirstName}
                      onChange={(e) => setPatientFirstName(e.target.value)}
                      className="rounded-2xl"
                      required
                      placeholder="Jan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[color:var(--color-text-muted)] mb-1">Nazwisko</label>
                    <Input
                      value={patientLastName}
                      onChange={(e) => setPatientLastName(e.target.value)}
                      className="rounded-2xl"
                      required
                      placeholder="Kowalski"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-[color:var(--color-text-muted)] mb-1">
                    Telefon <span className="font-normal">(opcjonalnie)</span>
                  </label>
                  <Input
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="rounded-2xl"
                    placeholder="+48 500 000 000"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-[color:var(--color-text-muted)] mb-1">
                    Opis <span className="font-normal">(opcjonalnie)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-white"
                    rows={2}
                    placeholder="Powód wizyty, objawy..."
                  />
                </div>
              </div>

              <div className="bg-brand-support/40 rounded-2xl p-3 text-sm text-[color:var(--color-text-body)]">
                Wizyta: <strong>{doctor.name}</strong> · {selectedDate} o <strong>{selectedSlot}</strong> (20 min)
              </div>

              {bookingError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {bookingError}
                </div>
              )}

              {!isLoggedIn && (
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Musisz być zalogowany, aby zarezerwować wizytę.
                </p>
              )}

              <Button
                type="submit"
                disabled={booking}
                className="w-full bg-brand-blue hover:bg-blue-400 text-white rounded-full shadow-bubble"
              >
                {booking ? "Rezerwacja..." : isLoggedIn ? "Zarezerwuj wizytę" : "Zaloguj się i zarezerwuj"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
