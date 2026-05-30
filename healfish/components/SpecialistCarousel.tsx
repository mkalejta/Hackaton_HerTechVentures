"use client";

import { doctors, Doctor } from "@/lib/mock-data";
import { ExternalLink, MapPin, Stethoscope } from "lucide-react";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  items?: Doctor[];
  pink?: boolean;
};

export default function SpecialistCarousel({
  title = "Nasi specjaliści",
  items = doctors,
  pink = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  const tileCls = pink ? "tile-pink border-pink-200/50" : "tile-green border-white/50";
  const iconBg = pink ? "bg-brand-pink/20" : "bg-white/70";
  const iconColor = pink ? "text-pink-500" : "text-brand-blue";
  const linkColor = pink ? "text-pink-500" : "text-brand-blue";

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">{title}</h2>
          <div className="flex gap-2">
            <button
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full h-8 w-8 p-0 flex items-center justify-center"
              )}
              onClick={() => scroll("left")}
              aria-label="Poprzedni"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full h-8 w-8 p-0 flex items-center justify-center"
              )}
              onClick={() => scroll("right")}
              aria-label="Następny"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "flex-none w-56 rounded-3xl p-5 flex flex-col gap-3 border shadow-bubble transition-all hover:-translate-y-1 hover:shadow-bubble-hover",
                tileCls
              )}
            >
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm", iconBg)}>
                <Stethoscope size={20} className={iconColor} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-heading)] text-sm leading-tight">
                  {doc.name}
                </p>
                <p className="text-[color:var(--color-text-secondary)] text-xs mt-1">{doc.specialization}</p>
              </div>
              <div className="flex items-center gap-1 text-[color:var(--color-text-muted)] text-xs">
                <MapPin size={11} />
                <span>{doc.location}</span>
              </div>
              <a
                href={doc.znanyLekarzUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("mt-auto flex items-center gap-1 text-xs font-medium hover:underline", linkColor)}
              >
                Umów wizytę <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
