/**
 * Mock CIP signal hooks for the prototype.
 *
 * In production this file would import @crestron/ch5-crcomlib and use:
 *
 *   CrComLib.subscribeState('boolean' | 'numeric' | 'string', joinName, callback)
 *   CrComLib.publishEvent('boolean' | 'numeric' | 'string', joinName, value)
 *
 * For prototype/screenshot purposes we provide a static mock that returns
 * realistic sample values (matching what SIMPL would push).
 */
import { useState } from "react";

const mockBool: Record<string, boolean> = {
  "2": true, // NVX is the active sidebar selection
  "11": true, // Occupancy on
  "15": true,
  "16": true,
  "17": true,
  "21": true,
  "24": true, // NVX power on
  "47": false, // Bass off
  "50": false, // 2 Channel
  "68": true, // Q-SYS source mode
  "80": true, // Display 1 selected
  "93": true, // HDMI 4 (Apple) selected
};

const mockNumber: Record<string, number> = {
  "1": 45000, // Master volume
  "2": 38000, // Q-SYS audio gauge
};

const mockString: Record<string, string> = {
  "4": "−12.5 dB",
  "8": "HDMI 4 In",
  "11": "Boardroom",
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
  "50": "Conference PC",
  "51": "Laptop Cable",
  "52": "HDMI 3",
  "53": "Apple TV",
  "54": "HDMI 5",
  "55": "HDMI 6",
  "56": "Switch",
  "57": "PS5",
};

export function useCIPBool(join: string): readonly [boolean, (v: boolean) => void] {
  const [v, setV] = useState<boolean>(mockBool[join] ?? false);
  return [v, setV] as const;
}

export function useCIPNumber(join: string): readonly [number, (v: number) => void] {
  const [v, setV] = useState<number>(mockNumber[join] ?? 0);
  return [v, setV] as const;
}

export function useCIPString(join: string): string {
  return mockString[join] ?? "";
}

/** Momentary press: pulse digital join true on press, false on release. */
export function pulse(join: string) {
  // In production: CrComLib.publishEvent('boolean', join, true);
  // Then on release: CrComLib.publishEvent('boolean', join, false);
  console.log("[CIP press]", join);
}
