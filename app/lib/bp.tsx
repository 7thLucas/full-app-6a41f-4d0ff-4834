import * as React from "react";
import { cn } from "~/lib/utils";
import {
  LayoutGrid, ClipboardCheck, BookText, Wrench, Upload, History,
  Store, Sparkles, ChevronRight, type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ roles */
export type RoleId = "hq" | "qa" | "area" | "branch";
export type ViewKey = "command" | "review" | "sop" | "actions" | "submit" | "mine";

export interface RoleDef {
  id: RoleId;
  short: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  user: string;
  initials: string;
  home: ViewKey;
  nav: ViewKey[];
}

export const VIEWS: Record<ViewKey, { label: string; icon: LucideIcon }> = {
  command: { label: "Command Center", icon: LayoutGrid },
  review: { label: "Evidence Review", icon: ClipboardCheck },
  sop: { label: "SOP Library", icon: BookText },
  actions: { label: "Corrective Actions", icon: Wrench },
  submit: { label: "Submit Evidence", icon: Upload },
  mine: { label: "My Submissions", icon: History },
};

export const ROLES: Record<RoleId, RoleDef> = {
  hq: {
    id: "hq", short: "HQ Command Center", title: "Operations Head / HQ", user: "Sarah Mitchell", initials: "SM",
    desc: "See compliance risk, branch readiness, recurring issues and reports across all locations.",
    icon: LayoutGrid, home: "command", nav: ["command", "review", "sop", "actions"],
  },
  qa: {
    id: "qa", short: "QA Review Workspace", title: "Compliance / QA Manager", user: "Emily Carter", initials: "EC",
    desc: "Upload SOPs, review AI judgments, approve evidence tasks and validate failed evidence.",
    icon: ClipboardCheck, home: "review", nav: ["review", "sop", "actions"],
  },
  area: {
    id: "area", short: "Area Manager View", title: "Area / Regional Manager", user: "David Reynolds", initials: "DR",
    desc: "Track assigned branches, prioritize high-risk stores and follow up on corrective actions.",
    icon: Store, home: "command", nav: ["command", "actions", "review"],
  },
  branch: {
    id: "branch", short: "Branch Submission App", title: "Branch / Store Manager", user: "Jessica Parker", initials: "JP",
    desc: "Upload required evidence, view AI feedback, fix failed items and resubmit proof.",
    icon: Upload, home: "submit", nav: ["submit", "mine", "actions"],
  },
};

export const BRANCHES = ["Store 18", "Store 04", "Store 11", "Store 07", "Store 02", "Store 15"];

/* ------------------------------------------------------------- tone helpers */
// Map semantic states to CSS-variable tokens (no hardcoded hex — R10 safe).
export function verdictVar(v?: string): string {
  switch (v) {
    case "pass": case "ready": return "--chart-2";       // teal
    case "partial": case "risk": case "not_ready": return "--chart-3"; // amber
    case "fail": return "--destructive";                 // red
    default: return "--muted-foreground";
  }
}
export function severityVar(s?: string): string {
  switch (s) {
    case "critical": return "--destructive";
    case "high": return "--chart-3";
    case "medium": return "--chart-3";
    default: return "--muted-foreground";
  }
}
export function verdictLabel(v?: string): string {
  const map: Record<string, string> = {
    pass: "Pass", ready: "Ready", partial: "Partial", risk: "At Risk",
    not_ready: "Not Ready", fail: "Fail",
  };
  return v ? map[v] || v : "Pending";
}
// pastel status chip: soft tint bg + colored text (no border)
export function tone(varName: string): React.CSSProperties {
  return {
    color: `var(${varName})`,
    background: `color-mix(in srgb, var(${varName}) 14%, white)`,
  };
}

/* ----------------------------------------------------------------- UI atoms */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-[0_10px_30px_rgba(10,15,30,.06)]", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ varName, children, className }: { varName?: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap", !varName && "bg-muted text-muted-foreground", className)}
      style={varName ? tone(varName) : undefined}
    >
      {children}
    </span>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" | "danger" | "invert" | "ghostd"; icon?: LucideIcon };
export function Btn({ variant = "primary", icon: Icon, className, children, ...rest }: BtnProps) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-[#1b2435]",
    ghost: "bg-card border border-border text-foreground shadow-sm hover:bg-muted",
    soft: "bg-accent text-accent-foreground hover:brightness-[.97]",
    danger: "bg-destructive text-destructive-foreground hover:brightness-95",
    invert: "bg-white text-primary hover:bg-white/90",
    ghostd: "bg-white/10 text-white hover:bg-white/20",
  };
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none", styles[variant], className)}
      {...rest}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function Stat({ icon: Icon, label, value, hero }: { icon: LucideIcon; label: string; value: React.ReactNode; hero?: boolean; varName?: string }) {
  return (
    <Card className={cn("p-5 transition hover:-translate-y-0.5", hero && "border-transparent bg-primary text-primary-foreground")}>
      <span className={cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full", hero ? "bg-white/[.12] text-white" : "border border-border bg-muted text-foreground")}>
        <Icon style={{ width: 18, height: 18 }} />
      </span>
      <div className={cn("text-[26px] font-extrabold tracking-tight tabular-nums", hero ? "text-white" : "text-foreground")}>{value}</div>
      <div className={cn("mt-1.5 text-xs font-medium", hero ? "text-white/65" : "text-muted-foreground")}>{label}</div>
    </Card>
  );
}

export function FocusBanner({ eyebrow, dotVar, title, sub, actions }: { eyebrow: string; dotVar: string; title: string; sub: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-6 rounded-2xl bg-primary p-6 text-primary-foreground">
      <div className="min-w-[240px] flex-1">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white/55">
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: `var(${dotVar})` }} />{eyebrow}
        </div>
        <div className="mb-1.5 text-[22px] font-extrabold leading-tight tracking-tight">{title}</div>
        <div className="max-w-xl text-[13.5px] leading-relaxed text-white/70">{sub}</div>
      </div>
      {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted", className)} style={{ borderTopColor: "var(--ring)" }} />
  );
}

export function Ring({ pct, size = 132 }: { pct: number; size?: number }) {
  const r = 46, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const color = pct >= 85 ? "var(--chart-2)" : pct >= 70 ? "var(--chart-3)" : "var(--destructive)";
  return (
    <svg viewBox="0 0 120 120" style={{ width: size, height: size }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--foreground)">{Math.round(pct)}%</text>
      <text x="60" y="78" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted-foreground)">Ready</text>
    </svg>
  );
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export { ChevronRight, Sparkles };
