"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/artykuly", label: "Artykuły" },
  { href: "/self-check", label: "Self check" },
  { href: "/quizy", label: "Quizy" },
  { href: "/dla-kobiet", label: "Dla kobiet", pink: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWomen = pathname.startsWith("/dla-kobiet");

  const gradient = isWomen
    ? "linear-gradient(135deg, #F892B6 0%, #ffffff 100%)"
    : "linear-gradient(135deg, #63B4F6 0%, #81E291 100%)";

  const logoText = isWomen
    ? "/images/logo-napisy/healfish black.png"
    : "/images/logo-napisy/healfish white.png";

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/20"
      style={{ background: gradient }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/images/ujecia-ryby-hybby/ujecie2.png"
              alt="Hybba"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <Image
              src={logoText}
              alt="Healfish"
              width={100}
              height={32}
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div
            className="hidden md:flex items-center gap-1 rounded-full px-2 py-1.5 backdrop-blur-sm border"
            style={
              isWomen
                ? { backgroundColor: "rgba(248,146,182,0.15)", borderColor: "rgba(248,146,182,0.4)" }
                : { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }
            }
          >
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200",
                    active
                      ? "bg-white shadow-sm " + (link.pink ? "text-brand-pink" : "text-brand-blue")
                      : link.pink
                      ? isWomen
                        ? "text-pink-700 font-semibold hover:bg-pink-100/50"
                        : "text-pink-600 font-bold hover:bg-white/20"
                      : isWomen
                      ? "text-gray-700 hover:bg-pink-100/50"
                      : "text-white hover:bg-white/20"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/logowanie"
              className={cn(
                "text-sm font-medium px-4 py-2 rounded-full transition-colors",
                isWomen
                  ? "text-gray-700 hover:bg-pink-100/50"
                  : "text-white/90 hover:text-white hover:bg-white/20"
              )}
            >
              Zaloguj
            </Link>
            <Link
              href="/rejestracja"
              className={cn(
                "text-sm font-semibold rounded-full px-5 py-2 transition-colors shadow-sm",
                isWomen
                  ? "bg-brand-pink text-white hover:bg-pink-400"
                  : "bg-white text-brand-blue hover:bg-white/90"
              )}
            >
              Zarejestruj się
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className={cn(
              "md:hidden p-2 rounded-full transition-colors",
              isWomen ? "text-gray-700 hover:bg-pink-100/50" : "text-white hover:bg-white/20"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-white/20 px-4 py-4 space-y-2"
          style={{ background: gradient }}
        >
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center text-sm font-medium py-2.5 px-4 rounded-2xl transition-colors",
                  active
                    ? "bg-white/90 " + (link.pink ? "text-brand-pink" : "text-brand-blue")
                    : link.pink
                    ? isWomen
                      ? "text-pink-700 font-semibold hover:bg-pink-100/50"
                      : "text-pink-600 hover:bg-white/20"
                    : isWomen
                    ? "text-gray-700 hover:bg-pink-100/50"
                    : "text-white hover:bg-white/20"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
            <Link
              href="/logowanie"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "text-sm font-medium py-2.5 px-4 rounded-full transition-colors",
                isWomen ? "text-gray-700" : "text-white"
              )}
            >
              Zaloguj
            </Link>
            <Link
              href="/rejestracja"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "text-sm font-semibold text-center rounded-full px-5 py-2.5 transition-colors",
                isWomen
                  ? "bg-brand-pink text-white hover:bg-pink-400"
                  : "bg-white text-brand-blue hover:bg-white/90"
              )}
            >
              Zarejestruj się
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
