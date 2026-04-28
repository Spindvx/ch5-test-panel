import { useCIPBool, pulse } from "../cip";
import { cn } from "./ui";

const NAV = [
  { id: "nvx", join: "2", icon: "NVXLogo.png" },
  { id: "qsys", join: "3", icon: "Q-SYS White.png" },
  { id: "apple", join: "4", icon: "Apple Logo.png" },
  { id: "music", join: "25", icon: "Airplay Icon.png" },
  { id: "settings", join: "5", icon: "Settings.png" },
] as const;

export function Sidebar() {
  return (
    <nav
      className="absolute inset-y-0 left-0 w-[88px] z-30 flex flex-col items-center gap-1.5 py-5 backdrop-blur-glass border-r border-hairline bg-panel-soft"
      aria-label="Main navigation"
    >
      {NAV.map((item) => (
        <NavItem key={item.id} join={item.join} icon={item.icon} />
      ))}
      <div className="flex-1" />
      <PowerNavItem />
    </nav>
  );
}

function NavItem({ join, icon }: { join: string; icon: string }) {
  const [selected] = useCIPBool(join);
  return (
    <button
      type="button"
      className={cn(
        "relative h-[60px] w-[76px] rounded-glass-sm transition-all duration-150 grid place-items-center",
        selected ? "bg-accent-fill" : "bg-transparent hover:bg-[rgba(255,255,255,0.04)]"
      )}
      onPointerDown={() => pulse(join)}
    >
      <img
        src={`./img/${icon}`}
        alt=""
        className={cn("h-9 w-9 transition-opacity", selected ? "opacity-100" : "opacity-75")}
      />
      {selected && (
        <span
          className="absolute right-[-1px] top-3 bottom-3 w-[2px] rounded-full bg-accent"
          style={{ boxShadow: "0 0 12px rgba(120, 180, 255, 0.5)" }}
        />
      )}
    </button>
  );
}

function PowerNavItem() {
  return (
    <button
      type="button"
      className="h-[60px] w-[76px] rounded-glass-sm grid place-items-center transition-all duration-150 hover:bg-[rgba(255,110,110,0.10)] active:bg-[rgba(255,110,110,0.18)]"
      onPointerDown={() => pulse("1")}
    >
      <img src="./img/Power.png" alt="" className="h-9 w-9 opacity-75" />
    </button>
  );
}
