# Office Panel — React Prototype

Parallel rebuild as a regular SPA, side-by-side with the CH5 version on the same branch tree. Same TS-1070 target, same CP3, same `Office_V2.cse2j` contract, same join numbers — different rendering layer.

Why this exists: see the conversation thread that spawned this branch, but tl;dr — CH5 component DOM is locked, defaults fight modern aesthetics, dev loop is build+screenshot. A regular React SPA gives full UI control and full Chrome devtools.

## Stack

- **Vite + React 18 + TypeScript** — fast dev loop, modern DX
- **Tailwind v3** — design tokens straight from `tailwind.config.js`, no CSS-in-JS noise
- **lucide-react** — icon set
- **`@crestron/ch5-crcomlib`** (added when wiring real CIP) — same library CH5 uses internally; we just consume it from React hooks instead of declarative attributes

## Files

```
web/
├── index.html              ← single root mount, loads Plus Jakarta Sans from Google Fonts
├── src/
│   ├── main.tsx            ← React entry
│   ├── index.css           ← @tailwind base/components/utilities + glass utility classes
│   ├── App.tsx             ← Top bar, sidebar, LH frame, NVX widget, bottom bar
│   ├── cip.ts              ← useCIPBool / useCIPNumber / useCIPString / pulse — currently mocked
│   └── components/
│       ├── ui.tsx          ← Btn / Switch / Slider / Section primitives
│       ├── Sidebar.tsx     ← left rail with 5 nav icons + power
│       ├── LeftFrame.tsx   ← Yamaha / Source / Audio / Computer / USB Routing
│       └── NvxWidget.tsx   ← right pane: 4 displays + 8 sources + power
├── public/img/             ← copied from app/project/assets/img (same icon set)
├── tailwind.config.js      ← design tokens (panel, hairline, accent, text-dim, etc.)
├── postcss.config.js
├── vite.config.ts          ← base: "./" so file:// rendering works for screenshotting
└── tsconfig.json
```

## Running

```bash
cd web
npm install
npm run dev               # Vite dev server at http://localhost:5173 (hot reload)
npm run build             # → dist/ (single-page bundle, ~207 KB JS / ~16 KB CSS)
```

## Wiring real CIP (when ready to swap from mocks)

Replace `web/src/cip.ts` with the real impl:

```ts
import { useEffect, useState } from "react";
import { CrComLib } from "@crestron/ch5-crcomlib";

export function useCIPBool(join: string) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const id = CrComLib.subscribeState("boolean", join, setV as any);
    return () => CrComLib.unsubscribeState("boolean", join, id);
  }, [join]);
  return [v, (val: boolean) => CrComLib.publishEvent("boolean", join, val)] as const;
}
// (same shape for useCIPString / useCIPNumber)
```

Plus call `WebXPanel.initialize({...})` once on app mount with the panel host / IPID. Everything else (every join number, every contract path, every signal direction) stays identical.

## Deploying to the panel

Two routes:

1. **Hosted URL** — host `dist/` on the CP3's web server (`/data/web/...`) or any LAN-reachable host, configure the TS-1070 to display that URL. Native panel runs Chromium; it loads the SPA and runs CIP from the client.
2. **Bundle inside `.ch5z`** — replace the `<ch5-*>` markup in the existing CH5 project with this SPA's `dist/index.html`. Deploy via the same `npm run build:onestepwithpassword` flow as the CH5 build.

Either route uses the existing CP3 program, the existing IPID `0x03`, and every join in `reference/construct/JOIN_MAP.md` unchanged.

## What's mocked right now

`web/src/cip.ts` ships static sample values matching what SIMPL would push (NVX powered on, Boardroom display selected, Apple TV source selected, occupancy on, master volume at ~70%, dB at −12.5, etc.) so the static screenshots show realistic content. Pulse calls go to `console.log` instead of CIP. Swap the file when wiring to CP3.

## Status

- ✅ NVX widget (priority view) — 4 displays + 8 sources + power, all join numbers from JOIN_MAP.md plumbed through mock hooks
- ✅ LH static frame — Yamaha / Source / Audio (with iOS switches) / Computer / USB Routing
- ✅ Top bar — clock + Q-SYS heartbeat + mic mute
- ✅ Bottom bar — mute + full-width slider, accent gradient fill
- ⏳ Q-SYS Levels widget — not yet ported
- ⏳ Apple TV widget — not yet ported (D-pad + keypad would be a hand-rolled component)
- ⏳ Settings widget — not yet ported
- ⏳ Music Player widget — would need a Sonos transport component (a few hundred LOC, but would look much better than `<ch5-media-player>`)
- ⏳ Real CIP wiring (currently mocked)
