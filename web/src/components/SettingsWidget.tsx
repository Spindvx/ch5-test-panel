/**
 * Settings widget — TX/RX mode + wallpaper pickers + occupancy timeout.
 * Joins from JOIN_MAP.md (Settings panel a.k.a. Sandbox):
 *  Header status: serial 41 / 42 / 43
 *  TX Mode (digital 22, enable 18) / RX Mode (digital 23, enable 18) / Sleep (digital 27)
 *  Lock-screen Wallpaper: SmartObject id 8 (9 buttons)
 *  Homescreen Wallpaper:  SmartObject id 10 (9 buttons)
 *  Occupancy Timeout:     SmartObject id 11 (5 buttons)
 *  Inline NVX action buttons: digital 30 (label serial 37), digital 29 (label serial 38)
 */
import { useCIPBool, useCIPString, pulse } from "../cip";
import { cn } from "./ui";

export function SettingsWidget() {
  const dev = useCIPString("41");
  const stream = useCIPString("42");
  const mode = useCIPString("43");

  const [tx] = useCIPBool("22");
  const [rx] = useCIPBool("23");
  const [sleep] = useCIPBool("27");
  const [enabled] = useCIPBool("18");

  return (
    <>
      <header className="flex flex-col gap-1 pb-3 border-b border-hairline">
        <span className="eyebrow">Settings</span>
        <h1 className="display-title text-[22px]">
          {dev || "NVX"} {stream || ""}
          <span className="ml-2 text-[16px] font-normal not-italic text-text-dim tnum">
            : {mode || "—"}
          </span>
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1">
        {/* Mode segmented row */}
        <Row label="Mode">
          <div className="grid grid-cols-3 gap-3">
            <SegBtn label="TX Mode" join="22" enabled={enabled} selected={tx} />
            <SegBtn label="RX Mode" join="23" enabled={enabled} selected={rx} />
            <SegBtn label="Sleep"   join="27" enabled selected={sleep} variant="danger" />
          </div>
        </Row>

        <Row label="Lock-screen Wallpaper">
          <PickerGrid prefix="MainPage.Sandbox.TPLockscreenWallpaper" count={9} />
        </Row>

        <Row label="Homescreen Wallpaper">
          <PickerGrid prefix="MainPage.Sandbox.TPHomescreenWP" count={9} />
        </Row>

        <Row label="Occupancy Timeout">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <OccBtn key={i} index={i} />
            ))}
          </div>
        </Row>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <span className="eyebrow">{label}</span>
      {children}
    </section>
  );
}

function SegBtn({
  label,
  join,
  selected,
  enabled,
  variant = "default",
}: {
  label: string;
  join: string;
  selected: boolean;
  enabled: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onPointerDown={() => enabled && pulse(join)}
      className={cn(
        "h-14 rounded-glass-sm border backdrop-blur-glass text-[15px] font-normal transition-all",
        variant === "danger"
          ? selected
            ? "border-danger bg-[rgba(255,110,110,0.16)] text-danger shadow-sel"
            : "border-[rgba(255,110,110,0.30)] bg-transparent text-danger"
          : selected
          ? "border-accent bg-accent-fill text-text shadow-sel"
          : "border-hairline bg-panel text-text",
        !enabled && "opacity-30 saturate-50 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}

function PickerGrid({ prefix, count }: { prefix: string; count: number }) {
  // Mock 9 items as labelled buttons. Real wiring uses MainPage.Sandbox.X.Button{N}Text
  // for the label and Button{N}IconClass for the icon class.
  return (
    <div className="grid grid-cols-9 gap-2.5">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <PickerBtn key={n} contractPress={`${prefix}.Button${n}ItemPress`} index={n} />
      ))}
    </div>
  );
}

function PickerBtn({ contractPress, index }: { contractPress: string; index: number }) {
  return (
    <button
      type="button"
      onPointerDown={() => pulse(contractPress)}
      className="h-16 rounded-glass-sm border border-hairline bg-panel backdrop-blur-glass text-[13px] font-normal text-text-dim hover:bg-panel-strong transition-all"
    >
      {index}
    </button>
  );
}

function OccBtn({ index }: { index: number }) {
  // OccupancyTimeout SO id 11; buttons 1..5 represent timeout durations
  const minutes = [5, 15, 30, 60, 120][index - 1];
  return (
    <button
      type="button"
      onPointerDown={() => pulse(`MainPage.Sandbox.OccupancyTimeout.Button${index}ItemPress`)}
      className="h-16 rounded-glass-sm border border-hairline bg-panel backdrop-blur-glass text-[14px] font-normal text-text hover:bg-panel-strong transition-all"
    >
      {minutes} min
    </button>
  );
}
