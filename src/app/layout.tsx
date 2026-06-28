import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { DailyTimerProvider } from "@/lib/DailyTimerContext";
import UrgencyController from "@/components/UrgencyController";

const inter    = Inter({ variable: "--font-inter",    subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shinka Track — Evolve Every Day",
  description: "The Shinka System: a discipline-driven RPG tracker for real-life evolution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-200 font-sans antialiased">
        {/* Subtle grid overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <DailyTimerProvider>
          {/* UrgencyController: heartbeat audio + ShadowZone lockdown */}
          <UrgencyController />
          <NavBar />
          {/* pb-24 to avoid content hiding behind bottom nav on mobile */}
          <main className="relative z-10 pb-24 md:pt-16 md:pb-0">{children}</main>
        </DailyTimerProvider>
      </body>
    </html>
  );
}

