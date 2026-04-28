/**
 * Base glass UI primitives. These replace the CH5 component DOM that
 * caused all the layering issues (double-rectangles, locked structure).
 * Here we own every element and Tailwind classes are the only source
 * of truth for visuals.
 */
import { type ReactNode, type ButtonHTMLAttributes } from "react";

function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ============================================================
   Button — single-layer, finger-friendly, glass aesthetic
   ============================================================ */

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  variant?: "default" | "accent" | "danger" | "ghost";
  iconUrl?: string;
  iconPosition?: "left" | "top" | "right";
  className?: string;
  children?: ReactNode;
}

export function Btn({
  selected,
  variant = "default",
  iconUrl,
  iconPosition = "left",
  className,
  children,
  ...rest
}: BtnProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-glass-sm px-4 backdrop-blur-glass transition-all duration-150 active:scale-[0.98] outline-none";

  const variants: Record<string, string> = {
    default: cn(
      "border bg-[rgba(255,255,255,0.03)] text-text",
      selected
        ? "border-accent shadow-sel bg-accent-fill"
        : "border-hairline shadow-rest"
    ),
    accent: cn(
      "border bg-accent-fill text-text shadow-rest",
      selected ? "border-accent shadow-sel" : "border-accent-soft"
    ),
    danger: cn(
      "border text-danger",
      selected
        ? "border-danger bg-[rgba(255,110,110,0.18)]"
        : "border-[rgba(255,110,110,0.30)] bg-transparent"
    ),
    ghost: cn(
      "border-transparent bg-transparent text-text hover:bg-[rgba(255,255,255,0.04)]"
    ),
  };

  const isStack = iconPosition === "top";

  return (
    <button
      type="button"
      {...rest}
      className={cn(
        base,
        variants[variant],
        isStack && "flex-col gap-3 py-4",
        className
      )}
    >
      {iconUrl && (iconPosition === "left" || iconPosition === "top") && (
        <img src={iconUrl} alt="" className={cn(isStack ? "h-14 w-14" : "h-6 w-6")} />
      )}
      {children}
      {iconUrl && iconPosition === "right" && (
        <img src={iconUrl} alt="" className="h-6 w-6" />
      )}
    </button>
  );
}

/* ============================================================
   Switch — iOS-style track + thumb
   ============================================================ */

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3.5 cursor-pointer select-none",
        className
      )}
      onClick={() => onChange(!checked)}
    >
      <span
        className={cn(
          "relative inline-flex h-8 w-14 rounded-full border transition-all duration-200",
          checked
            ? "border-accent bg-[rgba(120,180,255,0.35)] shadow-[0_0_18px_rgba(120,180,255,0.25)]"
            : "border-hairline bg-[rgba(255,255,255,0.06)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-text transition-all duration-200 shadow-md",
            checked ? "left-[26px]" : "left-1"
          )}
        />
      </span>
      {label && <span className="text-[16px] tracking-[-0.005em] text-text">{label}</span>}
    </label>
  );
}

/* ============================================================
   Slider — full-width fader with cool-cyan fill
   ============================================================ */

interface SliderProps {
  value: number; // 0..100
  onChange: (v: number) => void;
  className?: string;
  height?: number;
}

export function Slider({ value, onChange: _onChange, className, height = 50 }: SliderProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full border border-hairline bg-[rgba(255,255,255,0.05)] backdrop-blur-glass",
        className
      )}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, rgba(140,190,240,0.55), rgba(190,220,250,0.92))",
          boxShadow: "0 0 22px rgba(120, 180, 255, 0.22)",
        }}
      />
    </div>
  );
}

/* ============================================================
   Section — eyebrow + content with hairline divider
   ============================================================ */

interface SectionProps {
  eyebrow: string;
  className?: string;
  children: ReactNode;
}

export function Section({ eyebrow, className, children }: SectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 border-b border-hairline py-5 px-1 last:border-b-0",
        className
      )}
    >
      <span className="eyebrow">{eyebrow}</span>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export { cn };
