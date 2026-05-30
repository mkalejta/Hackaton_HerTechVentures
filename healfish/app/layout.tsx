import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Healfish – Twoje zdrowie w zasięgu ręki",
  description:
    "Rzetelne artykuły medyczne, quizy profilaktyczne i narzędzia do self-check dla świadomych pacjentów.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={dmSans.variable}>
      <body className="min-h-screen flex flex-col bg-brand-bg antialiased font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
