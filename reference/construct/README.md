# Construct Reference

Drop your Crestron Construct project file(s) for the existing Office panel here. I'll reverse-engineer the join map and use it to wire the new CH5 panel.

## What to drop

The more of these you can provide, the faster and more accurate the wiring will be.

### Best (gives me everything in one shot)

- **`Office.smw`** / **`Office.smwx`** — SIMPL Windows program file (XML inside; I can grep joins, IPIDs, and SmartObject IDs).
- **`Office.vtz`** / **`Office.vt5`** / **`Office.vtp`** — VTPro panel project (zipped XML; gives me UI controls and their joins).
- **`Office_V0.2.cpz`** — compiled program archive (zipped DLLs + ProgramInfo.config; less readable than .smw but contains the running join map).

### Also useful

- **A join-list export** — any `.txt` / `.csv` / `.md` listing joins by number. Format I love:
  ```
  Digital
    1   Power Toggle
    10  Mute
    24  NVX Route Confirm
    75  TX1 Source Select
    ...
  Analog
    1   Master Volume
    25  QSYS CH1 Fader
    ...
  Serial
    14  QSYS Heartbeat (value: "Active")
    100 Yamaha Source Label
    28500 Sonos Song
    28501 Sonos Artist
    ...
  ```
- **Screenshots of the Construct UI** — page-by-page captures with each control's join visible (right-click → Properties in Construct usually shows the join number).
- **`crestron-demo/OFFICE_V2_JOIN_MAP.md`** — the doc your previous agent referenced. If it exists on your zima box, drop a copy here.
- **`kb/crestron-simplsharp-reference.md`** — the same agent's reference doc with the partial Office_V0.2 join map.

### Less useful but won't hurt

- The `.cpz` extracted contents (just `unzip` it) — gives `ProgramInfo.config` showing IPID/slot.
- VTPro `.vtp` exports of individual SmartObjects — joins are in there as XML.

## What I'll do with it

1. `unzip` / parse XML to extract every digital, analog, and serial join + the control it's wired to.
2. Build a join-map markdown file in the repo root for traceability.
3. Wire each `ch5-button` / `ch5-slider` / `ch5-jointotext-*` in the new panel to the **same** join numbers — so it drops into your existing CP3 program at IPID `0x03` with zero SIMPL changes.
4. Pay special attention to **serial** joins driving label text (e.g. "HDMI X — Connected/Disconnected") and **analog** joins driving readouts (e.g. dB values, fader positions) — those are easy to miss but are what makes the panel feel alive.

## Privacy / `.gitignore`

This folder is **tracked**, but binary Construct files (`.smw`, `.smwx`, `.vtz`, `.vtp`, `.vt5`, `.cpz`) are **gitignored** — they often contain customer-specific config you may not want in a public repo. Markdown / JSON / CSV / TXT join-list exports **will** be tracked. Override per-file with `git add -f` if you want to commit a binary anyway.

## After you drop files

Push them, then ping me and I'll do the reverse-engineering pass. No need to format the join list — I'll handle whatever shape you give me.
