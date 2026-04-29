/**
 * Apple TV widget — D-pad + Home/Back + 12-key keypad.
 * Joins from JOIN_MAP.md:
 *  Dpad SmartObject (id 6):  Up=4, Down=5, Left=6, Right=7, Center=8
 *  Back: digital 75 (and Home: same — Construct copy-paste, both pulse 75)
 *  Keypad: native CH5 component used numeric event names; we reimplement
 *  with our own per-key joins. (For now wire to placeholder joins —
 *  user will tell us the real keypad joins from SIMPL.)
 */
import { useState } from "react";
import { useCIPBool, pulse } from "../cip";
import { cn } from "./ui";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, ArrowLeft } from "lucide-react";

export function AppleTVWidget() {
  return (
    <>
      <header className="flex flex-col gap-1 pb-3 border-b border-hairline">
        <span className="eyebrow">Apple TV</span>
        <h1 className="display-title text-[24px]">Remote</h1>
      </header>

      <section className="flex-1 min-h-0 grid grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* Left: D-pad + Home/Back */}
        <div className="flex flex-col items-center gap-5 pt-2">
          <DPad />
          <div className="grid grid-cols-2 gap-3 w-full max-w-[360px]">
            <DpadFlatBtn join="75" icon={<Home className="h-5 w-5" />} label="Home" />
            <DpadFlatBtn join="75" icon={<ArrowLeft className="h-5 w-5" />} label="Back" />
          </div>
        </div>

        {/* Right: 12-key keypad */}
        <Keypad />
      </section>
    </>
  );
}

/* ============================================================
   Custom 5-button D-pad — center + 4 cardinal arrows
   Uses MainPage.AppleTV.Dpad SmartObject (id=6) joins
   ============================================================ */

function DPad() {
  return (
    <div className="relative" style={{ width: 320, height: 320 }}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-hairline bg-panel backdrop-blur-glass" />

      {/* Center button */}
      <DpadBtn
        joinSO="MainPage.AppleTV.Dpad.Center"
        joinId="8"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[120px] w-[120px] rounded-full"
      >
        <span className="text-[15px] font-medium tracking-[0.04em]">OK</span>
      </DpadBtn>

      {/* Up */}
      <DpadBtn
        joinSO="MainPage.AppleTV.Dpad.Up"
        joinId="4"
        className="absolute left-1/2 top-3 -translate-x-1/2 h-[64px] w-[88px]"
      >
        <ChevronUp className="h-7 w-7" />
      </DpadBtn>

      {/* Down */}
      <DpadBtn
        joinSO="MainPage.AppleTV.Dpad.Down"
        joinId="5"
        className="absolute left-1/2 bottom-3 -translate-x-1/2 h-[64px] w-[88px]"
      >
        <ChevronDown className="h-7 w-7" />
      </DpadBtn>

      {/* Left */}
      <DpadBtn
        joinSO="MainPage.AppleTV.Dpad.Left"
        joinId="6"
        className="absolute left-3 top-1/2 -translate-y-1/2 h-[88px] w-[64px]"
      >
        <ChevronLeft className="h-7 w-7" />
      </DpadBtn>

      {/* Right */}
      <DpadBtn
        joinSO="MainPage.AppleTV.Dpad.Right"
        joinId="7"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-[88px] w-[64px]"
      >
        <ChevronRight className="h-7 w-7" />
      </DpadBtn>
    </div>
  );
}

function DpadBtn({
  joinId,
  joinSO,
  className,
  children,
}: {
  joinId: string;
  joinSO: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onPointerDown={() => {
        setPressed(true);
        // Real wiring: contract path is preferred; raw joinId is the fallback
        pulse(joinSO);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(
        "grid place-items-center rounded-glass-sm border border-hairline backdrop-blur-glass transition-all duration-100 text-text",
        pressed
          ? "bg-accent-fill border-accent shadow-sel scale-[0.97]"
          : "bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]",
        className
      )}
    >
      {children}
    </button>
  );
}

function DpadFlatBtn({ join, icon, label }: { join: string; icon: React.ReactNode; label: string }) {
  const [selected] = useCIPBool(join);
  return (
    <button
      type="button"
      onPointerDown={() => pulse(join)}
      className={cn(
        "h-16 rounded-glass-sm border flex items-center justify-center gap-2 backdrop-blur-glass transition-all text-[15px] font-normal",
        selected
          ? "border-accent bg-accent-fill shadow-sel"
          : "border-hairline bg-panel hover:bg-panel-strong"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ============================================================
   12-key phone-layout keypad
   ============================================================ */

const KEYPAD: { key: string; label: string; sub?: string }[] = [
  { key: "1", label: "1" },
  { key: "2", label: "2", sub: "ABC" },
  { key: "3", label: "3", sub: "DEF" },
  { key: "4", label: "4", sub: "GHI" },
  { key: "5", label: "5", sub: "JKL" },
  { key: "6", label: "6", sub: "MNO" },
  { key: "7", label: "7", sub: "PQRS" },
  { key: "8", label: "8", sub: "TUV" },
  { key: "9", label: "9", sub: "WXYZ" },
  { key: "*", label: "*" },
  { key: "0", label: "0", sub: "+" },
  { key: "#", label: "#" },
];

function Keypad() {
  return (
    <div className="grid grid-cols-3 gap-3 h-full min-h-[480px]">
      {KEYPAD.map((k) => (
        <KeypadBtn key={k.key} k={k.key} label={k.label} sub={k.sub} />
      ))}
    </div>
  );
}

function KeypadBtn({ k, label, sub }: { k: string; label: string; sub?: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onPointerDown={() => {
        setPressed(true);
        pulse(`AppleTV.Keypad.${k}`);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(
        "rounded-glass-sm border backdrop-blur-glass transition-all flex flex-col items-center justify-center gap-0.5",
        pressed
          ? "bg-accent-fill border-accent shadow-sel scale-[0.97]"
          : "bg-panel border-hairline hover:bg-panel-strong"
      )}
    >
      <span className="text-[28px] font-medium leading-none tnum">{label}</span>
      {sub && (
        <span className="italic font-extralight text-[11px] tracking-[0.16em] uppercase text-text-dim">
          {sub}
        </span>
      )}
    </button>
  );
}
