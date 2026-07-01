import { useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, Check, ArrowRight } from "lucide-react";
import { ROLES, type RoleId } from "~/lib/bp";
import { useConfigurables } from "~/modules/configurables";

export default function LoginPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<RoleId | null>(null);
  const { config } = useConfigurables();
  const appName = (config as any)?.appName && (config as any).appName !== "My App" ? (config as any).appName : "BranchProof AI";

  function go() {
    if (!picked) return;
    try { localStorage.setItem("bp_role", picked); } catch {}
    navigate("/workspace");
  }

  return (
    <div className="flex min-h-screen bg-card">
      {/* left brand panel */}
      <div className="hidden w-[44%] max-w-xl flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></span>
          {appName}
        </div>
        <div className="max-w-sm">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Inspection-ready branches, every day.</h2>
          <p className="mt-4 text-base leading-relaxed opacity-70">
            Turn your SOPs into evidence tasks, let AI check the proof, and see which branches are at risk — before an inspection does.
          </p>
          <ul className="mt-8 space-y-3.5 text-sm opacity-90">
            {["Real-time readiness across every location",
              "AI-checked evidence with clear pass / fail reasons",
              "Corrective actions tracked through to closure"].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--chart-2)" }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs opacity-50">© 2026 {appName} · Compliance &amp; Brand Readiness</div>
      </div>

      {/* right sign-in */}
      <div className="flex flex-1 items-center justify-center p-7">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Log in to your workspace</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Welcome back. Sign in to continue.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Work email</label>
              <input readOnly value={picked ? `${ROLES[picked].user.toLowerCase().replace(/\s+/g, ".")}@branchproof.com` : ""}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Password</label>
              <input type="password" readOnly value="prototype"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Choose a workspace</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {(Object.values(ROLES)).map((r) => {
              const Icon = r.icon;
              const sel = picked === r.id;
              return (
                <button key={r.id} onClick={() => setPicked(r.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${sel ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${sel ? "border-primary bg-accent text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{r.short}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.title}</span>
                  </span>
                  <span className={`flex items-center justify-center rounded-full border-2 ${sel ? "border-primary" : "border-border"}`} style={{ width: 18, height: 18 }}>
                    {sel ? <span className="block h-2 w-2 rounded-full bg-primary" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <button onClick={go} disabled={!picked}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
            {picked ? "Log in" : "Select a workspace to continue"} {picked ? <ArrowRight className="h-4 w-4" /> : null}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Forgot password?</span>
            <span>Product prototype</span>
          </div>
        </div>
      </div>
    </div>
  );
}
