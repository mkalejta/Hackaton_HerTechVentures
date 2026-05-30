"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { curiosities } from "@/lib/mock-data";

export default function CuriositiesCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + curiosities.length) % curiosities.length);
  const next = () => setCurrent((c) => (c + 1) % curiosities.length);

  return (
    <>
      {/* Mobile: jedna ciekawostka + strzałki */}
      <div className="sm:hidden">
        <div className="relative">
          <div
            className="tile-pink rounded-3xl p-6 border border-pink-200/50 shadow-bubble min-h-[140px] flex flex-col justify-between"
          >
            <h3 className="font-semibold text-[var(--color-text-heading)] mb-2">
              {curiosities[current].title}
            </h3>
            <p className="text-[color:var(--color-text-body)] text-sm flex-1">
              {curiosities[current].content}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full bg-white border border-pink-200 shadow-sm flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
              aria-label="Poprzednia"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {curiosities.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-brand-pink w-4" : "bg-pink-200"
                  }`}
                  aria-label={`Ciekawostka ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-9 h-9 rounded-full bg-white border border-pink-200 shadow-sm flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
              aria-label="Następna"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: siatka 3 kolumn */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-5">
        {curiosities.map((c) => (
          <div
            key={c.id}
            className="tile-pink rounded-3xl p-6 border border-pink-200/50 shadow-bubble hover:-translate-y-1 hover:shadow-bubble-hover transition-all"
          >
            <h3 className="font-semibold text-[var(--color-text-heading)] mb-2">{c.title}</h3>
            <p className="text-[color:var(--color-text-body)] text-sm">{c.content}</p>
          </div>
        ))}
      </div>
    </>
  );
}
