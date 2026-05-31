import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-logo", weight: ["700", "800"] });

export const metadata: Metadata = {
  title: "Healfish – Twoje zdrowie w zasięgu ręki",
  description:
    "Rzetelne artykuły medyczne, quizy profilaktyczne i narzędzia do self-check dla świadomych pacjentów.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${dmSans.variable} ${nunito.variable}`}>
      <body className="min-h-screen flex flex-col bg-brand-bg antialiased font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
