# Office V3 UI

A production AV touch panel interface for Crestron TS-1070 (1280x800).

## Overview

Dark luxury command center aesthetic — deep black backgrounds with electric cyan accents, designed for premium AV environments.

### Pages

- **Menu** — Home screen with source selection grid
- **NVX Control** — Video routing TX/RX management  
- **Q-SYS Levels** — Audio fader control
- **Volume** — Master volume with mute
- **Clock** — Full-screen time display
- **Settings** — System configuration
- **Apple TV** — Media control

### Join Map

| Page | Join | Type | Description |
|------|------|------|------------|
| Menu Nav | 1-5, 25 | Digital | Page navigation (Home/NVX/Q-SYS/Volume/Clock/AppleTV) |
| NVX TX | 75-77 | Digital | Source selection (TX1-TX3) |
| NVX RX | 90 | Digital | Destination (Desk) |
| Route | 24 | Digital | Confirm routing |
| Q-SYS | 25-27 | Analog | Fader levels |
| Q-SYS | 56-58 | Digital | Channel select |
| Volume | 1 | Analog | Master volume |
| Mute | 10 | Digital | Mute toggle |
| Clock | 40 | Digital | Show/hide |
| Settings | 22-23, 27, 29-30 | Digital | Various toggles |

## Development

```bash
# Install deps
npm install --include=dev

# Dev server
npm run start

# Production build
npm run build:prod

# Create archive
npm run build:archive
```

## Deploy

```bash
# Upload to TS-1070
npm run build:deploy
# or manually:
# ch5-cli deploy -H 192.168.50.105 -t touchscreen dist/prod/office-v3-ui.ch5z
```

## Tech Stack

- CH5 (Crestron HTML5)
- Vanilla JS
- Webpack
