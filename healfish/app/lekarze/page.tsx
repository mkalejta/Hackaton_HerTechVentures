"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Stethoscope, Calendar, Search, ArrowUpDown } from "lucide-react";
import { api, ApiSpecialist } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LekarzeListPage() {
  const [specialists, setSpecialists] = useState<ApiSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "specialty">("name");
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    api.getSpecialists().then(setSpecialists).finally(() => setLoading(false));
    api.getSpecializations().then(setSpecialties).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return specialists
      .filter((s) => {
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.specialization?.toLowerCase().includes(search.toLowerCase());
        const matchSpecialty = specialty === "all" || s.specialization === specialty;
        return matchSearch && matchSpecialty;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "pl");
        return (a.specialization ?? "").localeCompare(b.specialization ?? "", "pl");
      });
  }, [specialists, search, specialty, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-brand-gradient-soft border border-brand-blue/15 rounded-3xl px-6 py-5 shadow-bubble mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-title)] mb-1">Lekarze</h1>
        <p className="text-[color:var(--color-text-secondary)]">
          Znajdź specjalistę w Gdańsku i Gdyni – umów wizytę online.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/60 border border-gray-200/70 rounded-2xl px-4 py-3 shadow-sm mb-8 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <Input
            placeholder="Szukaj lekarza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="text-sm border border-gray-200 rounded-2xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">Wszystkie specjalizacje</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setSortBy((prev) => prev === "name" ? "specialty" : "name")}
          className="flex items-center gap-1.5 text-sm text-[color:var(--color-text-muted)] hover:text-brand-blue px-3 py-2 rounded-2xl hover:bg-brand-support/30 transition-colors"
        >
          <ArrowUpDown size={14} />
          {sortBy === "name" ? "Sortuj wg specjalizacji" : "Sortuj wg nazwiska"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[color:var(--color-text-muted)]">
          Brak lekarzy spełniających kryteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((doc) => (
            <Link key={doc.id} href={`/lekarze/${doc.id}`} className="group">
              <div className={cn(
                "tile-green rounded-3xl p-5 h-full border border-white/50 shadow-bubble",
                "hover:shadow-bubble-hover transition-all hover:-translate-y-1 flex flex-col gap-3"
              )}>
                <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                  <Stethoscope size={20} className="text-brand-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text-heading)] text-sm leading-tight group-hover:text-brand-blue transition-colors">
                    {doc.name}
                  </p>
                  {doc.specialization && (
                    <span className="inline-block mt-1.5 text-xs bg-brand-support border border-brand-blue/15 text-brand-blue px-2 py-0.5 rounded-full">
                      {doc.specialization}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[color:var(--color-text-muted)] text-xs">
                  <MapPin size={11} />
                  <span>{doc.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-brand-blue mt-auto">
                  <Calendar size={11} />
                  {doc.user_id ? "Umów wizytę" : "Zobacz profil"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
