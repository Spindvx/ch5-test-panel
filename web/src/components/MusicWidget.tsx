/**
 * Music Player widget — Sonos transport + now playing.
 * Replaces <ch5-media-player> (which looks like 2010) with a modern
 * card showing album art, title/artist/album, and transport controls.
 *
 * Joins from JOIN_MAP.md:
 *  Album:  serial 11
 *  Artist: serial 12
 *  Song:   serial 13
 *  Transport: digital 75 (rev), 76 (play), 77 (pause), 78 (stop), 79 (fwd)
 *  Player name (contract): MainPage.MusicPlayer.MediaPlayer.Player_Name
 */
import { useCIPBool, useCIPString, pulse } from "../cip";
import { cn } from "./ui";
import { Disc3, Play, Pause, SkipBack, SkipForward, Square } from "lucide-react";

export function MusicWidget() {
  const album = useCIPString("11");
  const artist = useCIPString("12");
  const song = useCIPString("13");
  const player = useCIPString("MainPage.MusicPlayer.MediaPlayer.Player_Name");

  const [playing] = useCIPBool("76");

  return (
    <>
      <header className="flex flex-col gap-1 pb-3 border-b border-hairline">
        <span className="eyebrow">Music Player</span>
        <h1 className="display-title text-[22px]">{player || "Sonos"}</h1>
      </header>

      <section className="flex-1 min-h-0 flex gap-6 items-start">
        {/* Album art column */}
        <div className="flex-shrink-0 w-[280px] aspect-square rounded-glass border border-hairline bg-panel-strong backdrop-blur-glass grid place-items-center"
             style={{
               background: "linear-gradient(135deg, rgba(60,80,120,0.4), rgba(20,30,50,0.6))",
               boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 60px rgba(120,180,255,0.08)",
             }}>
          <Disc3 className={cn("h-24 w-24 text-text-dim", playing && "animate-spin")} style={{ animationDuration: "8s" }} />
        </div>

        {/* Now playing + transport column */}
        <div className="flex-1 min-w-0 flex flex-col h-full gap-5">
          <div className="flex flex-col gap-2 pt-2">
            <span className="eyebrow">Now Playing</span>
            <h2 className="text-[28px] font-medium tracking-[-0.01em] leading-tight text-text truncate">
              {song || "—"}
            </h2>
            <p className="text-[18px] font-normal text-text-dim truncate">
              {artist || "—"}
            </p>
            <p className="italic font-extralight text-[14px] text-text-mute truncate">
              {album || "—"}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-center gap-3">
            <TransportBtn join="75" icon={<SkipBack className="h-6 w-6" />} />
            <TransportBtn join="78" icon={<Square className="h-5 w-5" />} />
            <TransportBtn
              join="76"
              primary
              icon={
                playing
                  ? <Pause className="h-7 w-7" />
                  : <Play className="h-7 w-7 ml-0.5" />
              }
            />
            <TransportBtn join="77" icon={<Pause className="h-6 w-6" />} />
            <TransportBtn join="79" icon={<SkipForward className="h-6 w-6" />} />
          </div>
        </div>
      </section>
    </>
  );
}

function TransportBtn({
  join,
  icon,
  primary,
}: {
  join: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  const [selected] = useCIPBool(join);
  return (
    <button
      type="button"
      onPointerDown={() => pulse(join)}
      className={cn(
        "rounded-full border backdrop-blur-glass grid place-items-center transition-all duration-150",
        primary
          ? "h-20 w-20"
          : "h-14 w-14",
        selected
          ? "border-accent bg-accent-fill shadow-sel scale-[1.04]"
          : primary
          ? "border-accent-soft bg-accent-fill text-text"
          : "border-hairline bg-panel text-text-dim hover:bg-panel-strong"
      )}
    >
      {icon}
    </button>
  );
}
