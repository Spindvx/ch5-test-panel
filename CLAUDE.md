# CLAUDE.md — Living context for this repo

This file captures everything Claude has learned about this project. Update it whenever a non-obvious fact is discovered. Read it before doing any work.

---

## Project goal

Build a CH5 touch-panel UI for the **TS-1070** in the user's office, faithful to the existing **Office_V2** Crestron Construct project but with a new **Glass Dark** aesthetic (frosted panels, hairline borders, subtle accent glow — no neon, no cyberpunk). The new build must drop into the existing **Office_V0.2** SIMPL program on the CP3 with **zero SIMPL changes** — same join numbers, same SmartObject contract.

The previous agent built a "neo-noir / cyberpunk" UI under `app/` with magenta+cyan neon, kana labels, and **invented** join numbers. We are replacing both the look *and* the join wiring with the real ones.

---

## Hardware / network

| Device | IP | Notes |
|---|---|---|
| TS-1070 (touch panel, target) | 192.168.50.105 | admin / `CNZav2114`, SFTP user same. Cert CN `TS-1070-C442680F1403.crestron`. Resolution **1280×800**. |
| CP3 (control processor, runs SIMPL) | 192.168.50.113 | IPID `0x03` for the panel's WebXPanel CIP. Office_V0.2 SIMPL program lives here. |
| DM-NVX-350 #1 | 192.168.50.38 | Encoder/decoder. Web UI uses AngularJS — needs headless browser to fully script. |
| DM-NVX-350 #2 | 192.168.50.81 | |
| DM-NVX-350 #3 | 192.168.50.133 | Different admin password from TS-1070 (unknown). |
| DM-NVX-350 #4 | 192.168.50.164 | NVX preview snapshot URL is hardcoded into the panel's `<ch5-video>` element. |
| Yamaha RX-V673 receiver | (no IP — controlled via CP3) | Drives the "Yamaha:" source label and the Q-SYS/Bluetooth/AirPlay source-mode buttons. |
| Q-SYS Core | (no IP captured) | Heartbeat string "Active" on serial join 14 every ~30s. |
| Sonos | (no IP captured) | Drives Now Playing (album/artist/song) on serial joins 11/12/13 inside the NVX widget. |

Credentials and IPs are also documented in `DEPLOY.md` and `learning-log.md`.

---

## Repo structure

This is a **CH5 v3 shell-template** project (`@crestron/ch5-shell-template-v3` / `@crestron/ch5-shell-cli`).

```
.
├── app/
│   ├── template/        # Shell-template framework (header/footer/nav/widgets) — keep mostly intact
│   └── project/         # OUR custom project content
│       ├── components/
│       │   ├── pages/   # Currently 7 placeholder pages (menu, nvx-control, qsys-levels, volume, clock, settings, apple-tv) — to be replaced
│       │   ├── widgets/ # Empty in current build
│       │   └── ...
│       └── assets/scss/custom-themes/
│           └── office-v3-theme.css   # The single 587-line file that holds ALL the previous agent's neon styling. Rewrite this for glass.
├── config/              # Will hold contract.cse2j (currently empty)
├── reference/
│   └── construct/       # Crestron Construct reverse-engineering artifacts (gitignored binaries; markdown tracked)
│       ├── README.md            # Where to drop Construct files
│       ├── JOIN_MAP.md          # ★ The full join map extracted from Office_V2
│       ├── Office_V2.cse2j      # ★ The authoritative contract file
│       └── Office_V2_extracted/ # ★ Live deployed Office_V2.ch5z unpacked (HTML widgets, CSS, JS)
├── DEPLOY.md            # Detailed deploy procedure (pty driver, REST diagnostics, gotchas)
├── REVERSE_ENGINEERING.md # General Crestron CH5 RE methodology
├── end-to-end-test.md   # Last deploy attempt log
├── learning-log.md      # Previous agent's 32 iterations of research
├── webpack.{common,dev,prod}.js
├── package.json
├── project-config.json   # In `app/project-config.json` actually — Crestron's project descriptor
└── CLAUDE.md            # ← this file
```

### Files / directories to know

- `app/project-config.json`: Crestron project descriptor. Has `controlSystem.host` (panel IP), `selectedTheme`, `header`/`footer`/`menuOrientation`/`pages` configuration.
- `app/project/assets/scss/custom-themes/office-v3-theme.css`: Single CSS file holding **all** of the cyberpunk styling. The classes (`.v3-eyebrow`, `.v3-title`, `.v3-kana`, `.btn-noir`, `.accent-magenta`, `.accent-cyan`, `.fader-strip`, `.volume-gauge-container`, `.clock-display`) are defined only here — Explore agent confirmed nothing in `.scss` defines them. Repurpose by rewriting this file with glass tokens; class names stay the same so HTML doesn't need to change.
- `webpack.common.js`: Glob-copies `app/**/components/**/*.html`. New `views/` subfolders are picked up automatically.
- `app/template/libraries/project-config.js`: Reads `project-config.json` via `getNavigationPages()`, `defaultActiveViewIndex()`. Has built-in support for `menuOrientation: "none"` (template-page.html line 108).
- `app/template/components/pages/template-page/template-page.html`: The shell template page. Renders header + ch5-list nav + ch5-triggerview content area + footer. Drives layout via `menuOrientation`.

---

## What the original Office_V2 panel does

Documented in detail in **`reference/construct/JOIN_MAP.md`**. Quick summary:

- **Single dashboard page** (`MainPage`) with static frame:
  - Top: clock + mic-mute + Q-SYS heartbeat status
  - Left static column: Yamaha source label + 3 source-mode buttons (Q-SYS/BT/AirPlay) + 6 toggle/action buttons + Ducker dB readout + 4 USB drives (SmartObject)
  - Bottom: master volume gauge slider + mute button
  - Sidebar (left edge): 6 stacked icons (NVX/Q-SYS/Power/Apple/Settings/AirPlay) — momentary press digital joins 1, 2, 3, 4, 5, 25
- **Right pane** swaps between widgets, gated by `receivestateshow` digital joins:
  - Digital 2 → NVX Control (4 NVX displays + 8 HDMI sources + Now-Playing block + transport buttons)
  - Digital 3 → Q-SYS Levels (3 zones with mute + fader)
  - Digital 4 → Apple TV (Dpad + 12-key keypad + Home/Back)
  - Digital 5 → Settings/Sandbox (TX/RX mode + 3 button-list pickers + Occupancy timeout)
  - Digital 25 → MusicPlayer (`<ch5-media-player>` for Sonos)
  - Digital 12 → Initializing (full-screen overlay during boot)

The CP3's `Office_V0.2` SIMPL program latches sidebar press events into a "current view" state and asserts the matching `receivestateshow` digital high. The new panel does not need its own page-switching logic — SIMPL drives it.

---

## Joins are NOT invented — use the real ones

Every join in **`reference/construct/JOIN_MAP.md`** was extracted from the live deployed `Office_V2.ch5z` archive (the panel's actual HTML markup). The Construct contract `Office_V2.cse2j` adds the SmartObject definitions on top.

Critical specifics often missed:
- Vol slider: **analog 1** (master) + **analog 2** (gauge inside left column)
- Mute: **digital 10**
- Q-SYS heartbeat: **serial 14** (string "Active" when up)
- Yamaha receiver source label: **serial 8**
- Ducker dB readout: **serial 4**
- Office On/Off toggle has **asymmetric press/fb**: press=48, fb=49 (only one in the project that does)
- NVX power button: **digital 24** (also drives the header text)
- 4 NVX display tiles: press 80/81/82/83, names serial 35/36/37/38, status serial 17/20/21/22, enables 15/15/17/21
- 8 HDMI source tiles: press 90-97, names serial 50-57, status serial 18,19,25,26,27,28,29,30, enables 15/15/16/16/17/17/17/21
- Music transport: digital 75/76/77/78/79 (rev/play/pause/stop/fwd)
- Now Playing: serial 11 (Album), 12 (Artist), 13 (Song)

---

## Build / deploy

```bash
# Develop
npm install
npm run start            # dev server at http://localhost:8081/

# Build .ch5z
npm run build:archive    # → dist/prod/office-v3-ui.ch5z (~9 MB)

# Deploy (interactive prompts — needs PTY, see DEPLOY.md Method 1)
python3 /tmp/panel/drive_deploy.py        # Python pty driver wrapping ch5-cli deploy -p
# OR (no key/no prompt — needs SSH key registered):
npm run build:deploy
# OR (last resort, password embedded):
npm run build:deploywithpassword
```

`ch5-cli deploy -p` uses inquirer for prompts → **piping stdin fails with `ERR_USE_AFTER_CLOSE`**. Always use the Python pty driver from DEPLOY.md if no SSH key is registered.

Success signal in deploy output: `Device output: Success. Restarting UI...`. The REST API has no CH5-project introspection, so this string is the canonical confirmation.

---

## Sandbox capabilities (this Claude session)

- **Network**: GitHub MCP allowed. Direct `curl` to `github.com` works for **public** repos only (or release assets on public repos). Dropbox, generic web hosts blocked. Private repo content needs to come via git fetch (which is auth'd through a local proxy at `127.0.0.1:39171`) or via the GitHub MCP.
- **Browser**: `playwright` v1.56 + chromium installed globally and confirmed working. Can render the dev server's pages and capture screenshots at 1280×800 to verify the UI before deploying.
- **Git**: Configured with signing key. Branch `claude/create-tsw-panel-QXRcn` is the active dev branch (per the system prompt). All work commits to that branch.

---

## Conventions

- **Don't invent join numbers.** Use only joins from `reference/construct/JOIN_MAP.md`. If something needs a join we haven't documented, flag it as a TODO comment and ask before inventing.
- **Glass theme tokens** (in `app/project/assets/scss/custom-themes/office-v3-theme.css`):
  - `--bg`, `--panel`, `--panel-strong`, `--hairline`, `--text`, `--text-dim`, `--accent`, `--danger`, `--mint`, `--radius`
  - One subtle accent (cool white-cyan), no magenta, no kana, Inter typeface
- **Static frame** (top, left column, bottom) is always-rendered HTML in `mainpage`. Right pane uses CH5 templates with `receivestateshow` for swapping — same pattern as Office_V2.
- **Asset spelling preserved** — `Initilizing` (with missing 'a') is the original Construct typo. Don't fix it; SIMPL references that exact name.
- **Screenshots before deploy** — render the dev server with Playwright and visually verify against the user's screenshot before pushing to the panel. The TS-1070 viewport is 1280×800.

---

## Open questions / unknowns

1. The `MainPage.ButtonList` SmartObject (id=2, 4 items) is in the contract but I haven't located where it renders in the screenshot. Could be a hidden list or repurposed for something else. Worth grep-checking the projectcomponents CSS for its position.
2. NVX widget's "Now Playing" block (serial 11/12/13) and the main page's Clock secondary (serial 11) both consume the **same** raw join 11. CH5 doesn't context-isolate raw numeric joins. Confirm on hardware: does SIMPL multiplex this, or are they actually showing the same content?
3. The 3rd DM-NVX (.133) admin password is unknown. The current panel's NVX preview is hardcoded to .164 — if/when network changes, this URL needs editing.
4. Apple TV widget Back & Home buttons both have `sendeventontouch="75"` in markup — same join. Likely a Construct copy-paste bug. Verify and either fix or document.

---

## Last status (most recent first)

- 2026-04-28: Reverse-engineered Office_V2 from the user's published GitHub release. Extracted contract + live HTML widgets into `reference/construct/`. Wrote JOIN_MAP.md. Folder `reference/construct/` committed to branch `claude/create-tsw-panel-QXRcn`.
- 2026-04-28: User flipped repo public to allow Claude to fetch the release asset; reminded to flip back to private after verification.
- 2026-04-28: Plan approved (the `i-want-you-to-whimsical-aho.md` plan). Folder + gitignore + README scaffolding committed.
- 2026-04-23: Previous agent's 32-iteration learning loop (see `learning-log.md`) — built `crestron-ref.ch5z`, deployed it, ran into SSH lockouts, mapped the system architecture.
