import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import SpecialistCarousel from "@/components/SpecialistCarousel";
import HomeCTA from "@/components/HomeCTA";
import { BookOpen, ClipboardCheck, Brain, Heart, Zap, Gift, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const partners = [
  { name: "LuxMed",         src: "/images/partnerzy/luxmed.png" },
  { name: "Medicover",      src: "/images/partnerzy/medicover.png" },
  { name: "Enel-Med",       src: "/images/partnerzy/enel-med.png" },
  { name: "PZU Zdrowie",    src: "/images/partnerzy/pzu-zdrowie.png" },
  { name: "Saltus",         src: "/images/partnerzy/saltus.png" },
  { name: "Signal Iduna",   src: "/images/partnerzy/signal-iduna.png" },
];

const sectionCards = [
  {
    icon: BookOpen,
    label: "Artykuły",
    href: "/artykuly",
    description: "Artykuły pisane przez lekarzy – rzetelna wiedza bez sensacji.",
    tile: "tile-green",
    iconColor: "text-green-700",
  },
  {
    icon: ClipboardCheck,
    label: "Self Check",
    href: "/self-check",
    description: "Opisz swoje objawy, a my dopasujemy artykuły i badania dla Ciebie.",
    tile: "tile-blue",
    iconColor: "text-blue-600",
  },
  {
    icon: Brain,
    label: "Quizy",
    href: "/quizy",
    description: "Sprawdź swoją wiedzę i zdobywaj punkty na rabaty u partnerów.",
    tile: "tile-blend",
    iconColor: "text-teal-600",
  },
  {
    icon: Heart,
    label: "Dla kobiet",
    href: "/dla-kobiet",
    description: "Sekcja poświęcona zdrowiu kobiet – hormony, profilaktyka, ciekawostki.",
    tile: "tile-pink",
    iconColor: "text-pink-600",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero – bubbly + gradient */}
      <section className="relative overflow-hidden">
        {/* Background gradient blob */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #63B4F6 0%, #81E291 100%)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #81E291 0%, #63B4F6 100%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">

          {/* LEFT: copy */}
          <div className="flex-1 w-full text-center md:text-left">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <ShieldCheck size={13} />
              Darmowa aplikacja profilaktyczna
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--color-text-title)] leading-tight tracking-tight mb-4">
              Zmień zdrowotne{" "}
              <span className="text-brand-blue">„chyba"</span>
              {" "}na pewność!
            </h1>

            {/* Lead */}
            <p className="text-[color:var(--color-text-body)] text-base sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 mb-6">
              Zbyt często odkładamy zdrowie na później. Healfish udowadnia, że profilaktyka
              nie musi być nudna — <strong>edukujemy, motywujemy i nagradzamy</strong> Cię
              za codzienne dbanie o siebie.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7 max-w-xl mx-auto md:mx-0">
              <div className="flex items-start gap-3 bg-white/70 border border-brand-blue/15 rounded-2xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={15} className="text-brand-blue" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[var(--color-text-heading)] mb-0.5">Szybkie quizy</p>
                  <p className="text-xs text-[color:var(--color-text-muted)] leading-snug">Wiedza o zdrowiu w kilka minut dziennie</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/70 border border-green-200/60 rounded-2xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gift size={15} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[var(--color-text-heading)] mb-0.5">Realne nagrody</p>
                  <p className="text-xs text-[color:var(--color-text-muted)] leading-snug">Punkty za zniżki na badania i kosmetyki</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/70 border border-purple-200/60 rounded-2xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={15} className="text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[var(--color-text-heading)] mb-0.5">Koniec z mitami</p>
                  <p className="text-xs text-[color:var(--color-text-muted)] leading-snug">Ryba Hybba odróżnia fakty od bzdur</p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-6">
              <Link
                href="/rejestracja"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble text-base"
                )}
              >
                Zacznij teraz – to darmowe
              </Link>
              <Link
                href="/artykuly"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full px-8 bg-white/70 text-base"
                )}
              >
                Przeglądaj artykuły
              </Link>
            </div>

            {/* Tagline */}
            <p className="text-xs text-[color:var(--color-text-muted)] italic max-w-md mx-auto md:mx-0">
              Przestań zgadywać i poczuj się we własnym ciele jak ryba w wodzie.
            </p>
          </div>

          {/* RIGHT: mascot + partners */}
          <div className="flex-shrink-0 flex flex-col items-center gap-5">
            <Image
              src="/images/ujecia-ryby-hybby/ujecie2.png"
              alt="Hybba mascot"
              width={300}
              height={300}
              className="w-44 sm:w-56 md:w-72 drop-shadow-2xl animate-bounce"
              style={{ animationDuration: "3s" }}
            />

            {/* Partners – desktop */}
            <div className="hidden md:flex flex-col items-center gap-2 w-full">
              <span className="text-xs font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wide">Partnerzy</span>
              <div className="flex flex-wrap justify-center gap-2">
                {partners.map((p) => (
                  <div key={p.name} className="bg-white/80 border border-gray-100 rounded-xl px-2 py-1 shadow-sm">
                    <Image src={p.src} alt={p.name} width={72} height={24} className="h-5 w-auto object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Partners – mobile */}
            <div className="flex md:hidden flex-col items-center gap-2 w-full">
              <span className="text-xs font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wide">Partnerzy</span>
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {partners.map((p) => (
                  <div key={p.name} className="bg-white/80 border border-gray-100 rounded-2xl px-2 py-2 shadow-sm flex items-center justify-center">
                    <Image src={p.src} alt={p.name} width={80} height={28} className="h-6 w-auto object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialist Carousel */}
      <div className="bg-white/80 border-y border-gray-100">
        <SpecialistCarousel />
      </div>

      {/* Section cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section header in a frame */}
        <div className="text-center mb-10">
          <div className="inline-block bg-white border border-gray-200 rounded-3xl px-8 py-5 shadow-bubble">
            <h2 className="text-2xl font-bold text-[var(--color-text-title)] mb-1">
              Co znajdziesz na Healfish?
            </h2>
            <p className="text-[color:var(--color-text-secondary)] text-sm">
              Wszystko, czego potrzebujesz do świadomej profilaktyki zdrowotnej.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sectionCards.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <div
                className={cn(
                  card.tile,
                  "rounded-3xl p-6 h-full border border-white/50 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-bubble-hover shadow-bubble"
                )}
              >
                <div className="w-11 h-11 rounded-2xl bg-white/60 flex items-center justify-center mb-4 shadow-sm">
                  <card.icon size={22} className={card.iconColor} />
                </div>
                <h3 className="font-semibold text-[var(--color-text-heading)] mb-2">{card.label}</h3>
                <p className="text-[color:var(--color-text-body)] text-sm">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA + Newsletter – hidden when logged in */}
      <HomeCTA />
    </>
  );
}
