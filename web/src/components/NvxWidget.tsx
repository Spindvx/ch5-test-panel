import { useCIPBool, useCIPString, pulse } from "../cip";
import { cn } from "./ui";
import { Power } from "lucide-react";

export function NvxWidget() {
  const sourceName = useCIPString("24");
  const status = useCIPString("17");
  const [powered] = useCIPBool("24");

  return (
    <>
      <header className="flex items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Display Output</span>
          <h1 className="display-title text-[24px]">
            {sourceName || "Display"}
            <span className="ml-2 text-[16px] font-normal not-italic text-text-dim tnum">
              / {status || "—"}
            </span>
          </h1>
        </div>
        <button
          type="button"
          className={cn(
            "h-11 w-11 rounded-glass-sm border grid place-items-center transition-all",
            powered
              ? "border-danger bg-[rgba(255,110,110,0.16)] text-danger"
              : "border-[rgba(255,110,110,0.30)] bg-transparent text-danger active:bg-[rgba(255,110,110,0.18)]"
          )}
          onPointerDown={() => pulse("24")}
        >
          <Power className="h-5 w-5" />
        </button>
      </header>

      <section className="flex flex-col gap-2.5 flex-1 min-h-0">
        <span className="eyebrow">Displays</span>
        <div className="grid grid-cols-4 gap-3 flex-1 min-h-0">
          <DisplayTile name="35" status="17" press="80" enable="15" />
          <DisplayTile name="36" status="20" press="81" enable="15" />
          <DisplayTile name="37" status="21" press="82" enable="17" />
          <DisplayTile name="38" status="22" press="83" enable="21" />
        </div>
      </section>

      <section className="flex flex-col gap-2.5 flex-[2] min-h-0">
        <span className="eyebrow">Sources</span>
        <div className="grid grid-cols-4 grid-rows-2 gap-3 flex-1 min-h-0">
          <SourceTile name="50" status="18" press="90" enable="15" icon="windows logo.png" />
          <SourceTile name="51" status="19" press="91" enable="15" icon="Laptop.png" />
          <SourceTile name="52" status="25" press="92" enable="16" icon="HDMI.png" />
          <SourceTile name="53" status="26" press="93" enable="16" icon="Apple Logo.png" />
          <SourceTile name="54" status="27" press="94" enable="17" icon="HDMI.png" />
          <SourceTile name="55" status="28" press="95" enable="17" icon="HDMI.png" />
          <SourceTile name="56" status="29" press="96" enable="17" icon="Nintendo Switch.png" />
          <SourceTile name="57" status="30" press="97" enable="21" icon="PS5.png" />
        </div>
      </section>
    </>
  );
}

function DisplayTile({ name, status, press, enable }: { name: string; status: string; press: string; enable: string }) {
  const tileName = useCIPString(name);
  const tileStatus = useCIPString(status);
  const [selected] = useCIPBool(press);
  const [enabled] = useCIPBool(enable);

  return (
    <button
      type="button"
      disabled={!enabled}
      onPointerDown={() => enabled && pulse(press)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-glass border p-4 backdrop-blur-glass transition-all",
        "bg-panel-strong border-hairline-strong",
        selected && "border-accent bg-accent-fill shadow-sel",
        !enabled && "opacity-30 saturate-50 cursor-not-allowed"
      )}
    >
      <span className="absolute top-3 right-4 italic font-extralight text-[10px] tracking-[0.18em] text-text-mute">OUT</span>
      <img src="./img/NVXLogo.png" alt="" className="h-14 w-14" />
      <span className="text-[16px] font-medium tracking-[-0.005em]">{tileName || "Display"}</span>
      <span className="italic font-extralight text-[12px] text-text-dim">
        {tileStatus || "Streaming Stopped"}
      </span>
    </button>
  );
}

function SourceTile({ name, status, press, enable, icon }: { name: string; status: string; press: string; enable: string; icon: string }) {
  const tileName = useCIPString(name);
  const tileStatus = useCIPString(status);
  const [selected] = useCIPBool(press);
  const [enabled] = useCIPBool(enable);

  return (
    <button
      type="button"
      disabled={!enabled}
      onPointerDown={() => enabled && pulse(press)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-glass border p-3 backdrop-blur-glass transition-all",
        "bg-panel border-hairline",
        selected && "border-accent bg-accent-fill shadow-sel",
        !enabled && "opacity-30 saturate-50 cursor-not-allowed"
      )}
    >
      <img src={`./img/${icon}`} alt="" className="h-14 w-14" />
      <span className="text-[15px] font-medium tracking-[-0.005em]">{tileName || "HDMI"}</span>
      <span className="italic font-extralight text-[12px] text-text-dim">
        {tileStatus || "Disconnected"}
      </span>
    </button>
  );
}
