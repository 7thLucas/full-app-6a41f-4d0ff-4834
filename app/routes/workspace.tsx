import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, LogOut, Bell, Search, Store } from "lucide-react";
import {
  ROLES, VIEWS, BRANCHES, type RoleId, type ViewKey,
} from "~/lib/bp";
import { useConfigurables } from "~/modules/configurables";
import {
  listConfigs, getDashboard, listTasks, completeTask,
  type BPConfig, type BPDashboard, type BPSubmission, type BPTask,
} from "~/lib/judgment.client";
import {
  CommandCenter, EvidenceReview, SopLibrary, SubmitEvidence, CorrectiveActions, MySubmissions, type Ctx,
} from "~/components/bp/screens";

export default function Workspace() {
  const navigate = useNavigate();
  const { config } = useConfigurables();
  const appName = (config as any)?.appName && (config as any).appName !== "My App" ? (config as any).appName : "BranchProof AI";

  const [role, setRole] = useState<RoleId | null>(null);
  const [view, setView] = useState<ViewKey>("command");
  const [branch, setBranch] = useState<string>("Store 18");
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  const [configs, setConfigs] = useState<BPConfig[]>([]);
  const [dashboards, setDashboards] = useState<Record<string, BPDashboard>>({});
  const [tasks, setTasks] = useState<BPTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // resolve role from localStorage
  useEffect(() => {
    let r: string | null = null;
    try { r = localStorage.getItem("bp_role"); } catch {}
    if (!r || !(r in ROLES)) { navigate("/"); return; }
    const rid = r as RoleId;
    setRole(rid);
    setView(ROLES[rid].home);
    try { const b = localStorage.getItem("bp_branch"); if (b) setBranch(b); } catch {}
  }, [navigate]);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const cfgs = await listConfigs();
      const list = Array.isArray(cfgs) ? cfgs : [];
      setConfigs(list);
      const entries = await Promise.all(list.map(async (c) => {
        try { return [c.pluginId, await getDashboard(c.pluginId)] as const; }
        catch { return [c.pluginId, { config: c, labels: {} as any, submissions: [] }] as const; }
      }));
      const map: Record<string, BPDashboard> = {};
      for (const [id, d] of entries) map[id] = d as BPDashboard;
      setDashboards(map);
      try { const t = await listTasks("open"); setTasks(Array.isArray(t) ? t : []); } catch { setTasks([]); }
    } catch (e: any) {
      setError(e?.message || "Failed to load configs");
    } finally { setLoading(false); }
  }, []);

  const completeTaskAction = useCallback(async (id: string) => {
    try { await completeTask(id); setToastMsg("Corrective action completed"); refresh(); }
    catch { setToastMsg("Couldn't complete the task"); }
  }, [refresh]);

  useEffect(() => { if (role) refresh(); }, [role, refresh]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    window.clearTimeout((toast as any)._t);
    (toast as any)._t = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const allSubs = useMemo(() => {
    const out: Array<BPSubmission & { _configName: string }> = [];
    for (const c of configs) {
      const d = dashboards[c.pluginId];
      if (!d) continue;
      for (const s of d.submissions || []) out.push({ ...s, _configName: c.name });
    }
    return out.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
  }, [configs, dashboards]);

  // branch list derived from real submissions, with sensible fallback
  const branches = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSubs) { const b = s.inputData?.branch || s.inputData?.unit || s.inputData?.store; if (b) set.add(String(b)); }
    const arr = Array.from(set).sort();
    return arr.length ? arr : BRANCHES;
  }, [allSubs]);

  function changeBranch(b: string) { setBranch(b); try { localStorage.setItem("bp_branch", b); } catch {} }
  function switchRole() { try { localStorage.removeItem("bp_role"); } catch {} navigate("/"); }

  if (!role) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  const ctx: Ctx = { role, branch, branches, loading, error, configs, dashboards, allSubs, tasks, refresh, completeTaskAction, toast, setView, activeConfig, setActiveConfig };
  const nav = ROLES[role].nav;

  function renderScreen() {
    switch (view) {
      case "command": return <CommandCenter {...ctx} />;
      case "review": return <EvidenceReview {...ctx} />;
      case "sop": return <SopLibrary {...ctx} />;
      case "submit": return <SubmitEvidence {...ctx} />;
      case "actions": return <CorrectiveActions {...ctx} />;
      case "mine": return <MySubmissions {...ctx} />;
      default: return <CommandCenter {...ctx} />;
    }
  }

  const showBranchPicker = role === "branch" || role === "area";

  return (
    <div className="h-screen overflow-hidden bg-background p-3.5 text-foreground">
      <div className="flex h-full overflow-hidden rounded-[28px] p-3.5 shadow-[0_24px_60px_rgba(10,15,30,.12)]" style={{ background: "var(--shell)" }}>
        {/* sidebar */}
        <aside className="flex w-[230px] shrink-0 flex-col rounded-[22px] border border-sidebar-border bg-sidebar p-3.5">
          <div className="mb-2 flex items-center gap-2.5 border-b border-sidebar-border px-2 pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></span>
            <div><div className="text-[15px] font-extrabold tracking-tight text-foreground">{appName}</div><div className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">Readiness OS</div></div>
          </div>
          <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Workspace</div>
          <nav className="space-y-1">
            {nav.map((v) => {
              const Icon = VIEWS[v].icon;
              const active = view === v;
              return (
                <button key={v} onClick={() => setView(v)}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13.5px] font-medium transition active:translate-y-px ${active ? "bg-card font-bold text-foreground shadow-[0_6px_16px_rgba(10,15,30,.08)]" : "text-sidebar-foreground hover:bg-black/[.035] hover:text-foreground"}`}>
                  <Icon style={{ width: 18, height: 18 }} /> {VIEWS[v].label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-sidebar-border pt-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{ROLES[role].initials}</span>
              <div className="min-w-0"><div className="truncate text-[13px] font-bold text-foreground">{ROLES[role].user}</div><div className="truncate text-[11px] text-muted-foreground">{ROLES[role].title}</div></div>
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden pl-3.5">
          <header className="flex h-14 shrink-0 items-center gap-3 px-2">
            <div className="flex w-[210px] items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-2 text-muted-foreground shadow-sm">
              <Search className="h-4 w-4" /><span className="text-[13px]">Search…</span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              {showBranchPicker ? (
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-sm">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <select value={branch} onChange={(e) => changeBranch(e.target.value)} className="bg-transparent text-[13px] font-semibold text-foreground outline-none">
                    {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              ) : null}
              <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted"><Bell className="h-[18px] w-[18px]" /></button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-sm"><span className="h-2 w-2 rounded-full" style={{ background: "var(--ring)" }} /><span className="text-xs font-bold text-foreground">{ROLES[role].short}</span></div>
              <button onClick={switchRole} className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"><LogOut className="h-3.5 w-3.5" />Switch role</button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-2 pb-10 pt-2">
            <div className="mx-auto max-w-6xl">{renderScreen()}</div>
          </div>
        </div>
      </div>

      {toastMsg ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg">{toastMsg}</div>
      ) : null}
    </div>
  );
}
