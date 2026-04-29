/**
 * Right-pane router. Picks the widget to show based on which
 * receivestateshow signal is currently true (driven by SIMPL on the
 * CP3 — the sidebar press latches into one of these joins). NVX is
 * the default if none is asserted, so the panel never shows an empty
 * pane on cold start.
 *
 * Joins (digital):  2=NVX  3=Q-SYS  4=AppleTV  5=Settings  12=Init  25=Music
 */
import { type ReactNode } from "react";
import { useCIPBool } from "../cip";
import { NvxWidget } from "./NvxWidget";
import { QSysWidget } from "./QSysWidget";
import { AppleTVWidget } from "./AppleTVWidget";
import { SettingsWidget } from "./SettingsWidget";
import { MusicWidget } from "./MusicWidget";

export function RightPane() {
  const [showNvx] = useCIPBool("2");
  const [showQsys] = useCIPBool("3");
  const [showApple] = useCIPBool("4");
  const [showSettings] = useCIPBool("5");
  const [showMusic] = useCIPBool("25");

  let body: ReactNode;
  if (showQsys) body = <QSysWidget />;
  else if (showApple) body = <AppleTVWidget />;
  else if (showSettings) body = <SettingsWidget />;
  else if (showMusic) body = <MusicWidget />;
  else body = <NvxWidget />; // NVX is the default (and the priority view)

  return (
    <div
      className="absolute left-[1016px] right-6 top-[108px] bottom-[124px] flex flex-col gap-5 rounded-glass border border-hairline bg-panel backdrop-blur-glass p-6"
      style={{
        boxShadow:
          "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 22px rgba(0, 0, 0, 0.35), inset 0 0 24px rgba(120, 180, 255, 0.05)",
      }}
    >
      {body}
    </div>
  );
}
