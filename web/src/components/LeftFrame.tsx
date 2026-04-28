import { Section, Switch, Slider, Btn } from "./ui";
import { useCIPBool, useCIPString, useCIPNumber, pulse } from "../cip";
import { Globe } from "lucide-react";

export function LeftFrame() {
  return (
    <aside className="absolute left-[112px] top-[108px] bottom-[124px] w-[880px] flex flex-col overflow-hidden">
      <YamahaHeader />
      <SourceMode />
      <AudioSection />
      <ComputerActions />
      <UsbRouting />
    </aside>
  );
}

/* -------- Yamaha source headline -------- */
function YamahaHeader() {
  const source = useCIPString("8");
  return (
    <Section eyebrow="Yamaha">
      <span className="display-title">{source || "—"}</span>
    </Section>
  );
}

/* -------- Source-mode: Q-SYS / Bluetooth / AirPlay -------- */
function SourceMode() {
  return (
    <Section eyebrow="Source">
      <div className="grid grid-cols-3 gap-3">
        <SourceTile join="68" label="Q-SYS"     icon="Q-SYS White.png" />
        <SourceTile join="69" label="Bluetooth" icon="Bluetooth Icon.svg" />
        <SourceTile join="70" label="AirPlay"   icon="Airplay Icon.png" />
      </div>
    </Section>
  );
}
function SourceTile({ join, label, icon }: { join: string; label: string; icon: string }) {
  const [selected] = useCIPBool(join);
  return (
    <Btn
      selected={selected}
      iconUrl={`./img/${icon}`}
      iconPosition="top"
      onPointerDown={() => pulse(join)}
      className="h-[210px] text-[15px] font-normal"
    >
      <span>{label}</span>
    </Btn>
  );
}

/* -------- Audio: gauge + dB + 3 switch toggles -------- */
function AudioSection() {
  const [gauge, setGauge] = useCIPNumber("2");
  const db = useCIPString("4");

  const [ch7, setCh7]   = useCIPBool("50");
  const [bass, setBass] = useCIPBool("47");
  const [occ, setOcc]   = useCIPBool("11");

  const gaugePct = (gauge / 65535) * 100;

  return (
    <Section eyebrow="Audio">
      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
        <Slider value={gaugePct} onChange={(v) => setGauge((v * 65535) / 100)} height={36} />
        <span className="tnum text-[20px] font-normal min-w-[100px] text-right">{db || "—"}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 px-2 pt-1">
        <Switch checked={ch7}  onChange={setCh7}  label="7 Channel" />
        <Switch checked={bass} onChange={setBass} label="Bass Boost" />
        <Switch checked={occ}  onChange={setOcc}  label="Occupancy" />
      </div>
    </Section>
  );
}

/* -------- Computer actions: PC Audio / Browser / Office / Lock PC -------- */
function ComputerActions() {
  return (
    <Section eyebrow="Computer">
      <div className="grid grid-cols-4 gap-3">
        <ActionBtn join="45" label="PC Audio"    iconUrl="./img/windows logo.png" />
        <ActionBtn join="6"  label="Browser"     iconNode={<Globe className="h-5 w-5" />} />
        <ActionToggle join="48" fbJoin="49" label="Office Mode" />
        <ActionBtn join="7"  label="Lock PC"     iconUrl="./img/windows logo.png" />
      </div>
    </Section>
  );
}
function ActionBtn({ join, label, iconUrl, iconNode }: { join: string; label: string; iconUrl?: string; iconNode?: React.ReactNode }) {
  const [selected] = useCIPBool(join);
  return (
    <Btn
      selected={selected}
      onPointerDown={() => pulse(join)}
      className="h-[78px] text-[15px] font-normal justify-start gap-3 px-5"
    >
      {iconNode ? iconNode : iconUrl && <img src={iconUrl} alt="" className="h-5 w-5" />}
      <span>{label}</span>
    </Btn>
  );
}
function ActionToggle({ join, fbJoin, label }: { join: string; fbJoin: string; label: string }) {
  const [selected] = useCIPBool(fbJoin);
  return (
    <Btn
      selected={selected}
      onPointerDown={() => pulse(join)}
      className="h-[78px] text-[15px] font-normal"
    >
      <span>{label}</span>
    </Btn>
  );
}

/* -------- USB routing — heavily used, larger touch targets -------- */
function UsbRouting() {
  return (
    <Section eyebrow="USB Routing" className="mt-auto">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <UsbBtn key={i} index={i} />
        ))}
      </div>
    </Section>
  );
}
function UsbBtn({ index }: { index: number }) {
  // contract: MainPage.USBRouter.Button{N}ItemPress / Button{N}ItemSelected / Button{N}Text
  // For prototype, mock label and selected state.
  const labels = ["Conference", "Standing Desk", "Wall TV", "Couch"];
  const selected = index === 1;
  return (
    <Btn
      selected={selected}
      iconUrl="./img/USB.png"
      iconPosition="top"
      onPointerDown={() => pulse(`MainPage.USBRouter.Button${index}ItemPress`)}
      className="h-[124px] text-[14px] font-normal"
    >
      <span>{labels[index - 1]}</span>
    </Btn>
  );
}
