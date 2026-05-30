import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import SpecialistCarousel from "@/components/SpecialistCarousel";
import { BookOpen, ClipboardCheck, Brain, Heart } from "lucide-react";
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            {/* Partner loga – widoczne na desktop nad nagłówkiem */}
            <div className="hidden md:flex items-center justify-start gap-3 mb-6 flex-wrap">
              <span className="text-xs font-semibold text-brand-blue">Partnerzy:</span>
              {partners.map((p) => (
                <div key={p.name} className="bg-white/80 border border-gray-100 rounded-xl px-2 py-1 shadow-sm">
                  <Image src={p.src} alt={p.name} width={72} height={24} className="h-6 w-auto object-contain" />
                </div>
              ))}
            </div>

            {/* Headline in a soft frame */}
            <div className="bg-white/60 border border-gray-200/70 rounded-3xl px-6 py-6 mb-6 shadow-bubble backdrop-blur-sm">
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-title)] leading-tight mb-3">
                Zadbaj o siebie{" "}
                <span className="text-brand-blue">zanim będziesz musiał</span>
              </h1>
              <p className="text-[color:var(--color-text-body)] text-lg max-w-lg">
                Rzetelne artykuły od lekarzy, quizy profilaktyczne i narzędzia do self-check.
                Zdobywaj punkty i wymieniaj je na rabaty na badania.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/rejestracja"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble"
                )}
              >
                Zacznij teraz – to darmowe
              </Link>
              <Link
                href="/artykuly"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full px-8 bg-white/70"
                )}
              >
                Przeglądaj artykuły
              </Link>
            </div>
          </div>

          {/* Fish + partner loga pod rybką na mobile */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <Image
              src="/images/ujecia-ryby-hybby/ujecie2.png"
              alt="Hybba mascot"
              width={300}
              height={300}
              className="w-52 md:w-72 drop-shadow-2xl animate-bounce"
              style={{ animationDuration: "3s" }}
            />

            {/* Partner loga – widoczne TYLKO na mobile, pod rybką */}
            <div className="flex md:hidden flex-col items-center gap-3 w-full">
              <span className="text-xs font-semibold text-brand-blue">Partnerzy:</span>
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {partners.map((p) => (
                  <div key={p.name} className="bg-white/80 border border-gray-100 rounded-2xl px-3 py-3 shadow-sm flex items-center justify-center">
                    <Image src={p.src} alt={p.name} width={90} height={32} className="h-8 w-auto object-contain" />
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

      {/* CTA + Newsletter */}
      <section className="py-16 bg-brand-gradient-soft">
        <div className="max-w-xl mx-auto px-4 text-center">
          {/* Frame around CTA text */}
          <div className="bg-white/70 border border-brand-blue/20 rounded-3xl px-8 py-8 shadow-bubble mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-title)] mb-3">
              Dołącz do tysięcy świadomych pacjentów
            </h2>
            <p className="text-[color:var(--color-text-body)] mb-6">
              Zarejestruj się i uzyskaj dostęp do quizów, rabatów u partnerów i personalizowanych artykułów.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/rejestracja"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-brand-blue hover:bg-blue-400 text-white rounded-full px-8 shadow-bubble"
                )}
              >
                Zarejestruj się
              </Link>
              <Link
                href="/logowanie"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full px-8 bg-white"
                )}
              >
                Zaloguj się
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-white/60 border border-gray-200 rounded-3xl px-6 py-5 shadow-sm">
            <p className="text-sm text-[color:var(--color-text-secondary)] mb-3">
              Lub zapisz się do newslettera
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Twój adres email"
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Button
                type="submit"
                className="bg-brand-blue hover:bg-blue-400 text-white rounded-full px-5"
              >
                Zapisz
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
