# Reverse-Engineering a Crestron CH5 Touch Panel

This guide covers how to extract and analyze an existing CH5 project from a Crestron touch panel to understand its structure and build compatible replacements.

---

## 1. Accessing Panel Files

### Panel Connection
| Item | Value |
|---|---|
| IP | 192.168.50.105 |
| User | admin |
| Password | CNZav2114 |
| SFTP Port | 22 |

### Key Directories on Panel

```
/display/           ← Main CH5 project files (live running)
/user/             ← Uploaded .ch5/.ch5z packages
/data/             ← Panel system files
```

### Pull Files Locally

```bash
# SFTP download all files
sshpass -p 'CNZav2114' sftp -oStrictHostKeyChecking=no admin@192.168.50.105 <<'EOF'
get -r /display/* local_panel_dump/
bye
EOF
```

---

## 2. File Structure Analysis

### Directory Tree

```
/display/
├── _manifest.json           # Project metadata (name, SHA, timestamp)
├── index.html              # Entry point - loads CSS/JS
├── libraries/             # CH5 runtime libraries
│   ├── cr-com-lib.*.js  # Crestron component library
│   └── component.*.js    # Core CH5 components
├── assets/
│   └── css/
│       ├── main.*.css           # Core styles
│       ├── templatecomponents.*.css  # Shell template styles
│       ├── projectcomponents.*.css   # Your custom components
│       └── customThemes.*.css       # Theme colors
├── app/
│   ├── template/          # Shell template pages
│   │   └── components/pages/
│   │       └── template-page/
│   │           └── template-page.html
│   └── project/          # Your project
│       └── components/pages/
│           ├── menu/
│           │   └── menu.html
│           ├── nvx-control/
│           │   └── nvx-control.html
│           └── ... (other pages)
└── config/
    └── project-config.json  # Signal configuration
```

---

## 3. Extracting Signal Joins

### What Are Joins?

Crestron uses **joins** to connect the SIMPL program (control logic) to the CH5 touch panel UI:

| Join Type | Range | Purpose |
|---|---|---|
| Digital | 1-N | On/off, button presses |
| Analog | 1-65535 | Slider values, levels |
| Serial | 1-N | Text strings |

### Finding Joins in HTML

Grep for join references in page files:

```bash
# All digital joins (sendEventOnClick)
grep -rh "sendEventOnClick" app/project/components/pages/ -o

# All analog joins
grep -rh "analogJoin\|receiveStateValue" app/project/components/pages/

# Navigation joins
grep -rh "receiveStateGoTo" app/project/components/pages/
```

### Common CH5 Attributes

| Attribute | Example | Meaning |
|---|---|---|
| `sendEventOnClick="1"` | Digital join 1 pulse on press |
| `sendEventOnRelease="1"` | Digital join 1 pulse on release |
| `receiveStateGoTo="menu"` | Navigate to "menu" page |
| `analogJoin="25"` | Analog join 25 for slider |
| `receiveStateValue="25"` | Display analog value from join 25 |
| `receiveStateDigital="1"` | Show digital state from join 1 |
| `sendStateDigital="true"` | Send digital pulse on state change |

### Example: Button Wiring

```html
<ch5-button
    label="POWER ON"
    sendEventOnClick="1"
    receiveStateDigital="1"
    customClass="btn-primary">
</ch5-button>
```

This button:
- Pulses digital join 1 when pressed
- Shows active state when SIMPL drives join 1 high

### Example: Slider Wiring

```html
<ch5-slider
    analogJoin="25"
    receiveStateValue="25"
    minimum="0"
    maximum="65535">
</ch5-slider>
```

This slider:
- Outputs to analog join 25 (0-65535 range)
- Shows SIMPL-driven value from join 25

---

## 4. Page Navigation (ch5-triggerview)

### How Page Switching Works

CH5 uses `ch5-triggerview` for page navigation:

```html
<!-- In each page -->
<ch5-triggerview
    id="pageNavigator"
    receiveStateGoTo="menu">
    
    <ch5-button sendEventOnClick="1" receiveStateGoTo="menu">...</ch5-button>
    <ch5-button sendEventOnClick="2" receiveStateGoTo="nvx-control">...</ch5-button>
    <ch5-button sendEventOnClick="3" receiveStateGoTo="settings">...</ch5-button>
    
</ch5-triggerview>
```

### Finding Navigation Joins

```bash
# Find all page navigation targets
grep -rh "receiveStateGoTo" app/project/components/pages/ | sort -u
```

---

## 5. Theme Extraction

### Finding Colors

```bash
# Custom theme CSS
grep -E "^--|#[0-9A-Fa-f]{6}" assets/css/customThemes*.css | head -30
```

### Example Theme Variables

```css
/* From office-v3-ui */
--noir-bg: #0A0A0B;        /* Background */
--noir-panel: #141416;      /* Card background */
--neon-magenta: #FF2E9F;   /* Primary accent */
--neon-cyan: #00F0FF;      /* Secondary accent */
--neon-mint: #4ADE80;      /* Success/online */
```

---

## 6. Project Config

### project-config.json

Located at `app/project-config.json` or `app/project/project-config.json`:

```json
{
  "projectName": "office-v3-ui",
  "customSignals": {
    "receiveStateTheme": "templateTheme",
    "sendEventTheme": "templateTheme"
  },
  "pages": [...]
}
```

### Finding All Configured Joins

```bash
# Search for all join numbers in the project
grep -rohE '"[0-9]+"' app/ --include="*.json" | sort -n | uniq
```

---

## 7. Building a Replacement

### Steps

1. **Pull existing files** — SFTP download from `/display/`
2. **Analyze structure** — Document pages, joins, theme
3. **Match joins** — Use same join numbers for compatibility
4. **Match theme** — Extract colors for visual consistency
5. **Build** — `npm run build:archive`
6. **Deploy** — Use pty-driven `ch5-cli deploy`

### Matching Original Functionality

| Original Element | Keep the Same |
|---|---|
| Button actions | Join numbers |
| Page names | `receiveStateGoTo` targets |
| Navigation flow | Page structure |
| Colors | Theme variables |

---

## 8. Quick Reference Commands

```bash
# Pull all panel files
sshpass -p 'CNZav2114' sftp -oStrictHostKeyChecking=no admin@192.168.50.105 <<'EOF'
get -r /display/* ./panel_dump/
EOF

# Find digital joins
grep -rh "sendEventOnClick\|receiveStateDigital" panel_dump/app/project/ -o

# Find analog joins
grep -rh "analogJoin\|receiveStateValue" panel_dump/app/project/ -o

# Find navigation
grep -rh "receiveStateGoTo" panel_dump/app/project/ -o | sort -u

# Find theme colors
grep -E "^--|#[0-9A-Fa-f]{6}" panel_dump/assets/css/customThemes*.css

# List all pages
ls panel_dump/app/project/components/pages/
```

---

## 9. What We Did (Real Example)

For Josh's Office_V2 replacement:

1. **Found the join map** from `crestron-demo/OFFICE_V2_JOIN_MAP.md`
2. **Identified pages** — menu (nav), nvx-control, qsys-levels, volume, clock, settings, apple-tv
3. **Extracted joins:**
   - Nav: 1-5, 25
   - NVX: TX 75-77, RX 90, Route 24
   - Q-SYS: 25-27 analog, 56-58 digital
   - Volume: 1 analog, 10 digital
4. **Built replacement** matching all original joins
5. **Deployed** via pty-driven ch5-cli

---

## Summary

| Task | Command |
|---|---|
| Get files | `sshpass ... sftp get -r /display/*` |
| Find joins | `grep -rh "sendEventOnClick"` |
| Find nav | `grep -rh "receiveStateGoTo"` |
| Find theme | `grep -E "^--"` |
| Rebuild | `npm run build:archive` |
| Deploy | Python pty script |

This methodology applies to any CH5 panel project. The key is matching the join numbers so your new UI integrates seamlessly with the existing SIMPL control system.