# Office_V2 Join Map — Reverse-Engineered

Extracted from `Office_V2.zip` Crestron Construct project, specifically from the live deployed `Office_V2.ch5z` archive (the panel's `app/project/components/` widgets) and the contract file `Office_V2.cse2j`.

The CP3 SIMPL program (`Office_V0.2`) is the source of truth for these joins and lives at IP `192.168.50.113`, IPID `0x03`. Any new CH5 panel can use the same join numbers and integrate with the existing program with **no SIMPL changes**.

---

## Architecture

The panel is a **single dashboard page** (`MainPage`) with a **static frame** (top clock, left side controls, bottom volume) and a **right pane** that swaps between widgets based on which sidebar icon is pressed.

The sidebar (`Menu` widget) sends momentary digital pulses on press. The CP3 SIMPL program latches those into a "current view" state and asserts the corresponding `receivestateshow` digital high — that's what reveals the right-pane widget.

```
Sidebar press →  Digital N momentary  →  CP3 latches  →  Drives N high  →  Widget with receivestateshow=N appears
```

| Sidebar button | Press digital | Right-pane widget shown |
|---|---|---|
| Power | 1 | (no widget — this is a system command) |
| NVX (NVXLogo) | 2 | NVXControl-widget (`MainPage.YamahaAmp` context) |
| Q-SYS | 3 | Q-SYSLevels-widget |
| Apple TV | 4 | AppleTV-widget (`MainPage.AppleTV` context) |
| Settings | 5 | Settings-widget (`MainPage.Sandbox` context) |
| (system) Initializing | 12 | Initilizing-widget (full-screen overlay) |
| AirPlay (MusicPlayer) | 25 | MusicPlayer-widget (`MainPage.MusicPlayer` context) |

The `Crestron-widget` (NVX device status — frame rates, bitrates, resolutions) does not have a `receivestateshow` and is positioned at top-left as a small overlay panel.

---

## Static Frame Joins (always-visible, outside swappable widgets)

### Top
| Element | Join | Type | Purpose |
|---|---|---|---|
| Clock widget | (Date Time component, no join) | — | Renders current time |
| Clock secondary text | 11 | serial | Status message under clock |
| Mic mute button | 40 | digital | Microphone mute toggle |
| Q-SYS Audio status text | 14 | serial | "Active" / "" — Q-SYS Core heartbeat |

### Left static column (top to bottom)

| Element | Press join | Feedback join | Type | Purpose |
|---|---|---|---|---|
| Yamaha label | — | 8 | serial | "Yamaha: " + receiver source name |
| Q-SYS button | 68 | 68 | digital | Source select: Q-SYS audio mode |
| Bluetooth button | 69 | 69 | digital | Source select: Bluetooth |
| AirPlay button | 70 | 70 | digital | Source select: AirPlay |
| 7Ch / 2Ch toggle | 50 | 50 | digital | Audio channel mode |
| Bass On / Off toggle | 47 | 47 | digital | Bass enable |
| Occ On / Off toggle | 11 | 11 | digital | Occupancy mode (also drives clock secondary) |
| PC Audio button | 45 | 45 | digital | PC audio source |
| Ducker dB readout | — | 4 | serial | Audio ducker level (e.g. "-12.5dB") |
| Browser button | 6 | 6 | digital | Launch browser source |
| Office On / Off toggle | 48 (press) | 49 (fb) | digital | Office mode (asymmetric — different press/fb) |
| Lock PC button | 7 | 7 | digital | Lock PC source |

### USB Router (4 USB drive buttons)
SmartObject contract `MainPage.USBRouter` (smartObjectId=3):

| Signal | Join inside SO | Type | Purpose |
|---|---|---|---|
| `Button1ItemPress` … `Button4ItemPress` | 1001-1004 | bool event | USB drive 1-4 press |
| `Button1ItemSelected` … `Button4ItemSelected` | 1001-1004 | bool state | USB drive 1-4 selected highlight |
| `Button1Text` … `Button4Text` | 1-4 | string state | Drive label (e.g. "Generic USB") |
| `ListNumberOfItems` | 1 | numeric state | How many drives are visible |

### Bottom (Volume widget)
| Element | Press join | Feedback join | Type | Purpose |
|---|---|---|---|---|
| Master volume slider (gauge, max=65535) | 1 (change) | 1 (value) | analog | Master output level |
| Mute button | 10 | 10 | digital | Master mute |

### Sidebar (Menu widget) — 6 button stack
Joins 1, 2, 3, 4, 5, 25 — see Architecture table above.

### MainPage ButtonList SmartObject (purpose unclear)
SmartObject `MainPage.ButtonList` (smartObjectId=2, 4 items, joins 1001-1004 + Button1Text…Button4Text). May be a reserved nav strip; not visibly placed in the rendered screenshot.

---

## NVX Control Widget (right pane, `receivestateshow=2`)

Header: `<serial 24> Output: <serial 17>` → e.g. "Display 1 Output: Streaming"

### Power button (top right)
| Press | Selected fb | Type |
|---|---|---|
| 24 | 24 | digital |

### Top row — 4 NVX Display tiles (decoders)
| # | Name (serial) | Status (serial) | Press / Sel (digital) | Enable (digital) |
|---|---|---|---|---|
| Display 1 | 35 | 17 | 80 | 15 |
| Display 2 | 36 | 20 | 81 | 15 |
| Display 3 | 37 | 21 | 82 | 17 |
| Display 4 | 38 | 22 | 83 | 21 |

### Bottom rows — 8 HDMI source tiles (encoders / sources)
| # | Icon | Name (serial) | Status (serial) | Press / Sel (digital) | Enable (digital) |
|---|---|---|---|---|---|
| HDMI 1 | windows | 50 | 18 | 90 | 15 |
| HDMI 2 | Laptop | 51 | 19 | 91 | 15 |
| HDMI 3 | HDMI | 52 | 25 | 92 | 16 |
| HDMI 4 | Apple Logo | 53 | 26 | 93 | 16 |
| HDMI 5 | HDMI | 54 | 27 | 94 | 17 |
| HDMI 6 | HDMI | 55 | 28 | 95 | 17 |
| HDMI 7 | Nintendo Switch | 56 | 29 | 96 | 17 |
| HDMI 8 | PS5 | 57 | 30 | 97 | 21 |

The `Enable` join controls whether the tile is interactive; the SIMPL program disables HDMI source tiles for displays that aren't currently selected as the routing target.

### Now Playing block (rendered inside NVX widget — likely overlapped layout)
| Element | Receive serial |
|---|---|
| Album text | 11 |
| Artist text | 12 |
| Song text | 13 |

### Music transport buttons
| Element | Press / Sel digital |
|---|---|
| Reverse | 75 |
| Play | 76 |
| Pause | 77 |
| Stop | 78 |
| Forward | 79 |

---

## Apple TV Widget (right pane, `receivestateshow=4`)

Uses CH5 native `<ch5-dpad>` and `<ch5-keypad>` — these bind via SmartObject contract `MainPage.AppleTV.Dpad` (smartObjectId=6).

| Signal | Join | Type | Purpose |
|---|---|---|---|
| `Visibility` | 1 | bool event | Show/hide d-pad |
| `Up` | 4 | bool event | Up nav |
| `Down` | 5 | bool event | Down nav |
| `Left` | 6 | bool event | Left nav |
| `Right` | 7 | bool event | Right nav |
| `Center` | 8 | bool event | Select |
| `HideCenterButton` | 1 | bool state | Hide center button on demand |
| `DisableCenterButton` | 3 | bool state | Disable center button |

Plus Back / Home buttons (both `sendeventontouch=75` — note: same join — likely a Construct copy-paste). Keypad has 12 keys (1-9, 0, *, #) and an "extra" phone-shaped key — joins emitted via the CH5 component's default keypad protocol (no explicit join numbers in markup, handled by `<ch5-keypad>` runtime).

---

## Q-SYS Levels Widget (right pane, `receivestateshow=3`)

Header: "Core Status: " + serial 14 (Q-SYS heartbeat).

| Element | Press digital | Feedback | Type | Purpose |
|---|---|---|---|---|
| Audio Reset | 58 | 58 | digital | Reset Q-SYS audio routing |
| AV Rack mute | 55 | 55 | digital | Mute AV-rack zone |
| AV Rack fader | 25 (analog, change) | 25 (analog, value) | analog | Level (0-65535) |
| Source mute | 56 | 56 | digital | Mute Source zone |
| Source fader | 26 (analog) | 26 (analog) | analog | Level |
| Downstairs mute | 57 | 57 | digital | Mute Downstairs zone |
| Downstairs fader | 27 (analog) | 27 (analog) | analog | Level |

---

## Settings Widget (right pane, `receivestateshow=5`, context `MainPage.Sandbox`)

The Settings panel exposes four sub-tools:

### TX/RX Mode toggles
| Element | Press digital | Sel | Enable |
|---|---|---|---|
| TX Mode | 22 | 22 | 18 |
| RX Mode | 23 | 23 | 18 |
| Sleep | 27 | 27 | — |

Status header: `<serial 41>` `<serial 42>`: `<serial 43>` (e.g. "NVX Streaming X: TX Mode").

### Lock Screen Wallpaper picker — SmartObject `MainPage.Sandbox.TPLockscreenWallpaper` (id=8, 9 buttons)
Each button: `Button{N}ItemPress`/`ItemSelected` (digital, joinId 1001-1009 in SO) + `Button{N}Text` (serial 1-9) + `Button{N}IconClass` (serial 501-509).

### TX03→RX Mode/Source picker — SmartObject `MainPage.Sandbox.TX03RXModeSource` (id=9, 9 buttons)
Same shape as above. `receivestateenable="20"` gates the whole list.

### Homescreen Wallpaper picker — SmartObject `MainPage.Sandbox.TPHomescreenWP` (id=10, 9 buttons)
Same shape as above.

### Occupancy Timeout picker — SmartObject `MainPage.Sandbox.OccupancyTimeout` (id=11, 5 buttons)
Buttons 1-5; same shape, no IconClass column.

### Two extra inline buttons
| Element | Press digital | Sel | Label serial |
|---|---|---|---|
| Toggle 1 | 30 | 30 | 37 (NVX) |
| Toggle 2 | 29 | 29 | 38 (NVX) |

Plus a `<ch5-button-list>` of 2 HDMI source icons (joins 56, 57 / 29, 30) and a Stream button (no joins in markup).

Settings also has `<ch5-animation receivestateshow=19>` — animation/spinner shown when digital 19 is high (loading state).

---

## Crestron Widget (NVX device status — top-left overlay, no `receivestateshow`)

Three NVX device status blocks, each with name + frame rate + stream bitrate + resolution:

| Block | Device name (serial) | Frame Rate | Stream Bitrate | Resolution W × H |
|---|---|---|---|---|
| 1 | 24 | 11 (numeric) | 10 (numeric) | 12 × 13 (numeric) |
| 2 | 23 | 15 (numeric) | 14 (numeric) | 16 × 17 (numeric) |
| 3 | 22 | 19 (numeric) | 18 (numeric) | 20 × 21 (numeric) |

Plus "Receivers" / "Transmitters" section labels and an inline `<ch5-video>` snapshot from `https://192.168.50.164/preview/preview_540px.jpeg` (refresh every 15s).

---

## MusicPlayer Widget (right pane, `receivestateshow=25`)

Uses CH5 native `<ch5-media-player>` bound to SmartObject contract `MainPage.MusicPlayer.MediaPlayer` (id=14):

| Signal | Type | Purpose |
|---|---|---|
| `CRPC` | string event (joinId 1) | Outgoing remote-control command |
| `CRPC_FB` | string state | Inbound feedback string |
| `Player_Name` | string state | Currently-active player name |
| `Message_FB` | string state | Status message |
| `Refresh` | bool state | Refresh display |
| `Offline` | bool state | Player offline indicator |

CH5 `<ch5-media-player>` handles its own UI (transport, metadata, art) using these contract signals — we don't have to wire each control individually.

---

## Initializing Widget (`receivestateshow=12`)

Full-screen overlay, shown during boot/reload. Has an animated spinner and "Crestron Initializing ..." + status serial 1.

---

## SmartObject Summary Table

| ID | Contract path | Type | # buttons / signals |
|---|---|---|---|
| 2 | `MainPage.ButtonList` | button list | 4 |
| 3 | `MainPage.USBRouter` | button list | 4 |
| 6 | `MainPage.AppleTV.Dpad` | dpad | 5 directional |
| 8 | `MainPage.Sandbox.TPLockscreenWallpaper` | button list | 9 |
| 9 | `MainPage.Sandbox.TX03RXModeSource` | button list | 9 |
| 10 | `MainPage.Sandbox.TPHomescreenWP` | button list | 9 |
| 11 | `MainPage.Sandbox.OccupancyTimeout` | button list | 5 |
| 14 | `MainPage.MusicPlayer.MediaPlayer` | media player | (CH5 component) |
| 1 | `MainPage.Background` | background | URL only |

---

## Background image

`<ch5-background receivestateurl="MainPage.Background.Url" url="./app/project/assets/img/Wallpaper2.jpg">` — defaults to `Wallpaper2.jpg` (the dark teal liquid abstract wallpaper). The SIMPL program can swap the URL via the `MainPage.Background.Url` contract string.

---

## Notes & gotchas

1. **`receivestatevalue="11"` overlap.** Serial 11 is referenced as both the Clock secondary text and the NVX widget's "Album" label. CH5 doesn't context-isolate raw numeric joins — both elements receive the same string. The SIMPL program likely drives different content based on which page is active; the widget that's currently hidden ignores the value. Worth verifying on hardware.

2. **Press join = Selected fb join** for almost every momentary button. The pattern is "press generates a pulse, SIMPL latches into a feedback boolean of the same number, panel shows the button highlighted while the underlying state is asserted." The Office On/Off toggle is the lone exception (press=48, fb=49).

3. **Widget-level scoping.** The mainpage's seven `<ch5-template>` instances each get a `context` argument that rewrites the template's `*CONTRACT.*` paths into specific addresses (e.g. `MusicPlayerCONTRACT.MediaPlayer.CRPC` → `MainPage.MusicPlayer.MediaPlayer.CRPC`). Raw integer joins inside those templates are **not** rewritten — they're global.

4. **NVX preview snapshot is hardcoded** to the IP of NVX-350 #4 (`192.168.50.164`). If the wiring changes, this URL needs editing.

5. **Asset naming has typos** — `Initilizing` (with the missing 'a') is the panel's spelling. Preserved as-is below for compatibility.

6. **TS-1070 panel resolution is 1280×800**, which is the canvas we're laying out for.
