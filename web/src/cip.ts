/**
 * CIP signal hooks. Single file, two modes:
 *
 *   import.meta.env.VITE_CIP_MODE === "live"  → real @crestron/ch5-crcomlib
 *   anything else (default in dev/screenshots) → mock with sample data
 *
 * Switch modes with a build-time env:
 *   VITE_CIP_MODE=live npm run build      ← production, real CP3
 *   npm run build                         ← screenshots / mock data
 *
 * In live mode the app calls WebXPanel.initialize() once on bootstrap
 * (see main.tsx) and every hook subscribes to / publishes via CrComLib.
 *
 * Joins are identical to the CH5 build's JOIN_MAP.md — the SIMPL
 * program at IPID 0x03 doesn't know or care which client framework
 * rendered the button.
 */
import { useEffect, useState } from "react";

const LIVE = import.meta.env.VITE_CIP_MODE === "live";

/* ============================================================
   Live-mode lazy import wrapper. We only pull the Crestron lib in
   when we actually need it so dev/screenshot builds stay tiny.
   ============================================================ */

let CrComLib: any = null;
async function ensureLive() {
  if (!LIVE) return null;
  if (!CrComLib) {
    const mod = await import("@crestron/ch5-crcomlib");
    CrComLib = (mod as any).CrComLib ?? mod;
  }
  return CrComLib;
}

/* ============================================================
   Mock data (used in dev / screenshots; ignored in live mode)
   ============================================================ */

const mockBool: Record<string, boolean> = {
  "2": true,
  "11": true,
  "15": true,
  "16": true,
  "17": true,
  "18": true,
  "21": true,
  "22": true,
  "24": true,
  "47": false,
  "50": false,
  "55": false,
  "56": true,
  "57": false,
  "68": true,
  "76": true,
  "80": true,
  "93": true,
};

const mockNumber: Record<string, number> = {
  "1": 45000,
  "2": 38000,
  "25": 48000,
  "26": 32000,
  "27": 25000,
};

const mockString: Record<string, string> = {
  "4": "−12.5 dB",
  "8": "HDMI 4 In",
  "11": "Visions",
  "12": "Mort Garson",
  "13": "Plantasia",
  "14": "Active",
  "17": "Streaming",
  "18": "Connected",
  "19": "Connected",
  "20": "Streaming",
  "21": "Streaming Stopped",
  "22": "Streaming Stopped",
  "24": "Boardroom Display",
  "25": "Disconnected",
  "26": "Connected",
  "27": "Disconnected",
  "28": "Disconnected",
  "29": "Connected",
  "30": "Connected",
  "35": "Boardroom",
  "36": "Side Wall",
  "37": "Lobby",
  "38": "Lounge",
  "41": "NVX",
  "42": "Streaming 1",
  "43": "TX Mode",
  "50": "Conference PC",
  "51": "Laptop Cable",
  "52": "HDMI 3",
  "53": "Apple TV",
  "54": "HDMI 5",
  "55": "HDMI 6",
  "56": "Switch",
  "57": "PS5",
  "MainPage.MusicPlayer.MediaPlayer.Player_Name": "Sonos · Office",
};

/* ============================================================
   Hooks
   ============================================================ */

export function useCIPBool(join: string): readonly [boolean, (v: boolean) => void] {
  // Screenshot rigging: ?view=qsys (etc.) flips which sidebar widget shows.
  const view =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view")
      : null;
  const showOverride: Record<string, Record<string, boolean>> = {
    nvx:      { "2": true,  "3": false, "4": false, "5": false, "25": false },
    qsys:     { "2": false, "3": true,  "4": false, "5": false, "25": false },
    appletv:  { "2": false, "3": false, "4": true,  "5": false, "25": false },
    settings: { "2": false, "3": false, "4": false, "5": true,  "25": false },
    music:    { "2": false, "3": false, "4": false, "5": false, "25": true  },
  };
  const initial =
    (view && showOverride[view]?.[join]) ??
    mockBool[join] ??
    false;
  const [v, setV] = useState<boolean>(initial);

  useEffect(() => {
    if (!LIVE) return;
    let id: any;
    let cancelled = false;
    (async () => {
      const lib = await ensureLive();
      if (cancelled) return;
      id = lib.subscribeState("boolean", join, (val: boolean) => setV(!!val));
    })();
    return () => {
      cancelled = true;
      if (id && CrComLib) CrComLib.unsubscribeState("boolean", join, id);
    };
  }, [join]);

  const publish = (val: boolean) => {
    setV(val);
    if (LIVE && CrComLib) CrComLib.publishEvent("boolean", join, val);
  };
  return [v, publish] as const;
}

export function useCIPNumber(join: string): readonly [number, (v: number) => void] {
  const [v, setV] = useState<number>(mockNumber[join] ?? 0);

  useEffect(() => {
    if (!LIVE) return;
    let id: any;
    let cancelled = false;
    (async () => {
      const lib = await ensureLive();
      if (cancelled) return;
      id = lib.subscribeState("numeric", join, (val: number) => setV(val));
    })();
    return () => {
      cancelled = true;
      if (id && CrComLib) CrComLib.unsubscribeState("numeric", join, id);
    };
  }, [join]);

  const publish = (val: number) => {
    setV(val);
    if (LIVE && CrComLib) CrComLib.publishEvent("numeric", join, val);
  };
  return [v, publish] as const;
}

export function useCIPString(join: string): string {
  const [v, setV] = useState<string>(mockString[join] ?? "");

  useEffect(() => {
    if (!LIVE) return;
    let id: any;
    let cancelled = false;
    (async () => {
      const lib = await ensureLive();
      if (cancelled) return;
      id = lib.subscribeState("string", join, (val: string) => setV(val ?? ""));
    })();
    return () => {
      cancelled = true;
      if (id && CrComLib) CrComLib.unsubscribeState("string", join, id);
    };
  }, [join]);

  return v;
}

/** Momentary press: pulse digital join high on press, low on release. */
export function pulse(join: string) {
  if (LIVE && CrComLib) {
    CrComLib.publishEvent("boolean", join, true);
    setTimeout(() => CrComLib.publishEvent("boolean", join, false), 60);
  } else {
    // eslint-disable-next-line no-console
    console.log("[CIP press]", join);
  }
}
