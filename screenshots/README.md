# Panel screenshots

Captured from the production build (`dist/prod/Shell/index.html`) via Playwright + headless Chromium at the TS-1070's native resolution **1920×1200 WUXGA**. Sample signal data is injected so the widgets show realistic content; on the live panel the same elements are driven by the CP3 SIMPL program.

| File | View | Notes |
|---|---|---|
| `v5-static.png`   | Static frame, no widget selected | Lands here on cold start before SIMPL connects (NVX is now the default in normal use) |
| `v5-nvx.png`      | NVX routing — **the priority view** | 4 displays + 8 sources + power |
| `v5-qsys.png`     | Q-SYS Levels | 3 zone faders with mute pads + Audio Reset |
| `v5-appletv.png`  | Apple TV remote | D-pad, Home/Back, 12-key keypad |
| `v5-settings.png` | Settings | TX/RX mode, lock-screen / homescreen wallpaper pickers, occupancy timeout |
| `v5-music.png`    | Music Player | Sonos via `<ch5-media-player>` — empty without a Sonos signal |

On GitHub, click any file to view full-size. On mobile, the repo's "Code" tab → `screenshots/` folder lets you browse them inline.

Re-shoot with `node /tmp/shot.js` after rebuilding (`npm run build:prod`).
