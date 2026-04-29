/**
 * Q-SYS Levels widget — 3 zone faders + mute pads + audio reset.
 * Joins from JOIN_MAP.md:
 *  Header heartbeat: serial 14
 *  Audio Reset: digital 58
 *  AV Rack:    fader analog 25, mute digital 55
 *  Source:     fader analog 26, mute digital 56
 *  Downstairs: fader analog 27, mute digital 57
 */
import { useCIPBool, useCIPNumber, useCIPString, pulse } from "../cip";
import { cn } from "./ui";

export function QSysWidget() {
  const heartbeat = useCIPString("14");
  const [reset] = useCIPBool("58");

  return (
    <>
      <header className="flex items-end justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Core Status</span>
          <h1 className="display-title text-[24px]">{heartbeat || "—"}</h1>
        </div>
        <button
          type="button"
          onPointerDown={() => pulse("58")}
          className={cn(
            "h-12 px-5 rounded-glass-sm border text-[15px] font-normal transition-all backdrop-blur-glass",
            reset
              ? "border-accent bg-accent-fill text-text shadow-sel"
              : "border-hairline bg-panel text-text"
          )}
        >
          Audio Reset
        </button>
      </header>

      <section className="flex-1 min-h-0 grid grid-cols-3 gap-4">
        <Zone label="AV Rack"    fader="25" mute="55" />
        <Zone label="Source"     fader="26" mute="56" />
        <Zone label="Downstairs" fader="27" mute="57" />
      </section>
    </>
  );
}

function Zone({ label, fader, mute }: { label: string; fader: string; mute: string }) {
  const [val, setVal] = useCIPNumber(fader);
  const [muted] = useCIPBool(mute);
  const pct = (val / 65535) * 100;

  return (
    <div className="glass flex flex-col items-center gap-4 rounded-glass p-5 min-h-0">
      <span className="eyebrow text-center">{label}</span>

      <VerticalFader
        value={pct}
        onChange={(p) => setVal((p * 65535) / 100)}
        muted={muted}
      />

      <button
        type="button"
        onPointerDown={() => pulse(mute)}
        className={cn(
          "h-14 w-20 rounded-glass-sm border grid place-items-center backdrop-blur-glass transition-all flex-shrink-0",
          muted
            ? "border-danger bg-[rgba(255,110,110,0.16)] text-danger shadow-sel"
            : "border-hairline bg-panel"
        )}
      >
        <img src="./img/Mute Icon.png" alt="" className="h-6 w-6" />
      </button>
    </div>
  );
}

function VerticalFader({
  value,
  onChange,
  muted,
}: {
  value: number;
  onChange: (pct: number) => void;
  muted: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex-1 w-12 rounded-full border border-hairline backdrop-blur-glass overflow-hidden cursor-ns-resize select-none transition-all",
        muted ? "opacity-50 saturate-50" : ""
      )}
      style={{ background: "rgba(255, 255, 255, 0.05)", minHeight: "200px" }}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const handle = (clientY: number) => {
          const rel = (clientY - rect.top) / rect.height;
          const pct = Math.max(0, Math.min(100, (1 - rel) * 100));
          onChange(pct);
        };
        handle(e.clientY);
        const onMove = (mv: PointerEvent) => handle(mv.clientY);
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-150"
        style={{
          height: `${value}%`,
          background:
            "linear-gradient(0deg, rgba(140,190,240,0.6), rgba(190,220,250,0.95))",
          boxShadow: "0 0 22px rgba(120, 180, 255, 0.22)",
        }}
      />
      {/* Tick marks for visual reference */}
      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex flex-col justify-between py-2 px-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="block h-px bg-text-mute opacity-30" />
        ))}
      </div>
    </div>
  );
}
