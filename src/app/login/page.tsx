import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "System Access — Shinka Track",
  description: "Authenticate to begin your evolution. Shinka Track discipline RPG system.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  void searchParams; // consumed by client form if needed
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black px-4">

      {/* Deep obsidian base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,229,255,0.04) 0%, rgba(2,6,23,1) 70%)",
        }}
      />

      {/* Pulsing cyan aura */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)",
          animation: "cyanaura 4s ease-in-out infinite",
        }}
      />

      {/* Scan line overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.5) 3px, rgba(0,229,255,0.5) 4px)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner brackets — HUD aesthetic */}
      {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-8 h-8 pointer-events-none`}
          style={{
            borderTop: i < 2 ? "1px solid rgba(0,229,255,0.2)" : "none",
            borderBottom: i >= 2 ? "1px solid rgba(0,229,255,0.2)" : "none",
            borderLeft: i % 2 === 0 ? "1px solid rgba(0,229,255,0.2)" : "none",
            borderRight: i % 2 === 1 ? "1px solid rgba(0,229,255,0.2)" : "none",
          }}
        />
      ))}

      {/* Login form card */}
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>

      <style>{`
        @keyframes cyanaura {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
