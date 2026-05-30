import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <Image
              src="/images/logo-napisy/healfish white.png"
              alt="Healfish"
              width={120}
              height={40}
              className="h-8 w-auto mb-3"
            />
            <p className="text-sm max-w-xs">
              Rzetelna wiedza medyczna w jednym miejscu. Dbaj o siebie świadomie.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <div>
              <p className="text-white font-medium mb-3 text-sm">Serwis</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/artykuly" className="hover:text-white transition-colors">Artykuły</Link></li>
                <li><Link href="/quizy" className="hover:text-white transition-colors">Quizy</Link></li>
                <li><Link href="/self-check" className="hover:text-white transition-colors">Self Check</Link></li>
                <li><Link href="/dla-kobiet" className="hover:text-white transition-colors">Dla kobiet</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium mb-3 text-sm">Informacje</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/polityka-prywatnosci" className="hover:text-white transition-colors">Polityka prywatności</Link></li>
                <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-xs text-center">
          © {new Date().getFullYear()} Healfish. Partnerzy:{" "}
          <span className="text-brand-blue">LuxMed</span> &{" "}
          <span className="text-brand-blue">Medicover</span>
        </div>
      </div>
    </footer>
  );
}
