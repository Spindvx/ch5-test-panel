import { Sidebar } from "./components/Sidebar";
import { LeftFrame } from "./components/LeftFrame";
import { NvxWidget } from "./components/NvxWidget";
import { Slider, cn } from "./components/ui";
import { useCIPNumber, useCIPString, useCIPBool, pulse } from "./cip";
import { MicOff } from "lucide-react";

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden text-text">
      {/* Wallpaper layer */}
      <img
        src="./img/Wallpaper2.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover brightness-[0.55] saturate-[0.85] z-0"
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(0,30,50,0.35), transparent 70%), linear-gradient(180deg, rgba(7,9,12,0.55), rgba(7,9,12,0.85))",
        }}
      />

      <div className="relative z-10 h-full w-full">
        <TopBar />
        <Sidebar />
        <LeftFrame />
        <NvxWidget />
        <BottomBar />
      </div>
    </div>
  );
}

function TopBar() {
  const heartbeat = useCIPString("14");
  return (
    <header className="absolute top-0 left-0 right-0 h-[88px] grid grid-cols-[1fr_auto_1fr] items-center px-8 pl-[120px] border-b border-hairline">
      <div className="flex items-baseline gap-4">
        <Clock />
        <span className="eyebrow">Boardroom</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="eyebrow">Q-SYS Core</span>
        <span className="text-[16px] tnum text-text-dim">{heartbeat || "—"}</span>
      </div>
      <div className="flex justify-end items-center">
        <MicButton />
      </div>
    </header>
  );
}

function Clock() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return <span className="italic font-extralight text-[36px] tracking-[-0.01em] tnum">{time}</span>;
}

function MicButton() {
  const [muted] = useCIPBool("40");
  return (
    <button
      type="button"
      onPointerDown={() => pulse("40")}
      className={cn(
        "h-16 w-16 rounded-glass-sm border grid place-items-center transition-all backdrop-blur-glass",
        muted
          ? "border-danger bg-[rgba(255,110,110,0.16)]"
          : "border-hairline bg-panel"
      )}
    >
      <MicOff className="h-7 w-7 text-text" />
    </button>
  );
}

function BottomBar() {
  const [vol, setVol] = useCIPNumber("1");
  const [muted] = useCIPBool("10");
  const volPct = (vol / 65535) * 100;
  return (
    <footer
      className="absolute bottom-5 left-[112px] right-6 h-[84px] flex items-center gap-5 px-6 rounded-glass border border-hairline-strong bg-panel-strong backdrop-blur-glass-strong"
      style={{ boxShadow: "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 22px rgba(0, 0, 0, 0.35)" }}
    >
      <button
        type="button"
        onPointerDown={() => pulse("10")}
        className={cn(
          "h-14 w-16 rounded-glass-sm border grid place-items-center backdrop-blur-glass transition-all flex-shrink-0",
          muted ? "border-danger bg-[rgba(255,110,110,0.16)] text-danger" : "border-hairline bg-panel"
        )}
      >
        <img src="./img/Mute Icon.png" alt="" className="h-6 w-6" />
      </button>
      <Slider value={volPct} onChange={(v) => setVol((v * 65535) / 100)} height={56} />
    </footer>
  );
}
