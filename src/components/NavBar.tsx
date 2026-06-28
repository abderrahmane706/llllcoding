"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",            label: "Home",   icon: "⌂" },
  { href: "/quests",      label: "Quests", icon: "⚔" },
  { href: "/status",      label: "Status", icon: "◈" },
  { href: "/leaderboard", label: "Ranks",  icon: "⬡" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:top-0 md:bottom-auto">
      <div className="mx-auto max-w-2xl px-4">
        <div
          className="flex items-center justify-around md:justify-center md:gap-8 px-4 py-3 rounded-t-2xl md:rounded-b-2xl md:rounded-t-none border border-cyan-500/10 border-b-0 md:border-b md:border-t-0"
          style={{
            background: "rgba(2, 6, 23, 0.92)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.6), 0 0 1px rgba(0,229,255,0.1) inset",
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-1.5 rounded-lg text-xs font-bold font-orbitron uppercase tracking-widest transition-all duration-300 hover-pulse-glow ${
                  isActive
                    ? "text-neon-blue"
                    : "text-gray-600 hover:text-gray-300"
                }`}
                style={
                  isActive
                    ? { textShadow: "0 0 10px rgba(0,229,255,0.6)" }
                    : {}
                }
              >
                <span className="text-base md:text-sm">{icon}</span>
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden text-[10px]">{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-blue md:hidden"
                    style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
