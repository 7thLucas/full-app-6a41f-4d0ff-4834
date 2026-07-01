import * as React from "react";
import { useState } from "react";
import {
  Sparkles, AlertTriangle, CheckCircle2, Clock, FileText, Image as ImageIcon,
  Upload, ChevronRight, RefreshCw, ShieldCheck, Store, Wrench, BookText, Send,
} from "lucide-react";
import {
  Card, Badge, Btn, Stat, Spinner, Ring, Bar, PageHead, FocusBanner,
  verdictVar, verdictLabel, severityVar, tone, type RoleId, type ViewKey,
} from "~/lib/bp";
import {
  type BPConfig, type BPDashboard, type BPSubmission, type BPTask,
  submitEvidence, parseSop, createConfig,
} from "~/lib/judgment.client";

export interface Ctx {
  role: RoleId;
  branch: string;
  branches: string[];
  loading: boolean;
  error: string | null;
  configs: BPConfig[];
  dashboards: Record<string, BPDashboard>;
  allSubs: Array<BPSubmission & { _configName: string }>;
  tasks: BPTask[];
  refresh: () => void;
  completeTaskAction: (id: string) => void;
  toast: (m: string) => void;
  setView: (v: ViewKey) => void;
  setActiveConfig: (id: string) => void;
  activeConfig: string | null;
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
const subBranch = (s: BPSubmission) => s.inputData?.branch || s.inputData?.unit || s.inputData?.store || "Unassigned";

function Empty({ icon: Icon, title, sub, action }: { icon: any; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <div className="mt-3 font-semibold text-foreground">{title}</div>
      {sub ? <div className="mt-1 max-w-sm text-sm text-muted-foreground">{sub}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

function Loading() {
  return <div className="flex items-center gap-3 p-10 text-muted-foreground"><Spinner /> Loading from the Judgment Engine…</div>;
}
function ErrorState({ error, refresh }: { error: string; refresh: () => void }) {
  return (
    <Card className="p-8 text-center">
      <AlertTriangle className="mx-auto h-7 w-7 text-destructive" />
      <div className="mt-3 font-semibold text-foreground">Couldn't reach the API</div>
      <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{error}</div>
      <div className="mt-2 text-xs text-muted-foreground">Make sure the dev server and MongoDB are running.</div>
      <div className="mt-4"><Btn variant="ghost" icon={RefreshCw} onClick={refresh}>Retry</Btn></div>
    </Card>
  );
}

/* ===================================================== COMMAND CENTER (HQ/Area) */
export function CommandCenter(ctx: Ctx) {
  if (ctx.loading) return <Loading />;
  if (ctx.error) return <ErrorState error={ctx.error} refresh={ctx.refresh} />;

  const scope = ctx.role === "area" ? ctx.allSubs.filter((s) => subBranch(s) === ctx.branch) : ctx.allSubs;
  const total = scope.length;
  const passes = scope.filter((s) => ["pass", "ready"].includes(s.result?.verdict || "")).length;
  const fails = scope.filter((s) => s.result?.verdict === "fail").length;
  const needsHuman = scope.filter((s) => s.result?.requiresHumanReview).length;
  const readiness = total ? Math.round((passes / total) * 100) : 100;

  // branch grouping
  const byBranch: Record<string, { total: number; pass: number }> = {};
  for (const s of ctx.allSubs) {
    const b = subBranch(s);
    byBranch[b] = byBranch[b] || { total: 0, pass: 0 };
    byBranch[b].total++;
    if (["pass", "ready"].includes(s.result?.verdict || "")) byBranch[b].pass++;
  }
  const branchRows = Object.entries(byBranch).map(([b, v]) => ({ b, pct: Math.round((v.pass / v.total) * 100), total: v.total }))
    .sort((a, b) => a.pct - b.pct);

  const recentFails = scope.filter((s) => s.result && s.result.verdict !== "pass" && s.result.verdict !== "ready").slice(0, 6);

  return (
    <>
      <PageHead title="Branch Readiness Command Center"
        sub={`Live compliance across ${ctx.configs.length} evidence programs${ctx.role === "area" ? ` · ${ctx.branch}` : ""}`}
        right={<Btn variant="ghost" icon={RefreshCw} onClick={ctx.refresh}>Refresh</Btn>} />

      <FocusBanner
        eyebrow={fails > 0 ? "Needs your attention" : "Network status"}
        dotVar={fails > 0 ? "--destructive" : "--chart-2"}
        title={fails > 0 ? `${fails} submission${fails === 1 ? "" : "s"} failed AI review` : total ? `${readiness}% of evidence is passing` : "No evidence submitted yet"}
        sub={total ? `${passes} of ${total} submissions passed${needsHuman ? `, ${needsHuman} need human review` : ""}. Work the review queue to keep branches inspection-ready before the next audit.` : "Publish an SOP and have branches submit evidence — readiness appears here."}
        actions={<>
          <Btn variant="invert" icon={CheckCircle2} onClick={() => ctx.setView("review")}>Review evidence</Btn>
          <Btn variant="ghostd" icon={RefreshCw} onClick={ctx.refresh}>Refresh</Btn>
        </>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ShieldCheck} label={`Inspection Readiness · ${passes}/${total || 0} passing`} value={`${readiness}%`} hero />
        <Stat icon={AlertTriangle} label="Failed Evidence" value={fails} />
        <Stat icon={BookText} label="Evidence Programs" value={ctx.configs.length} />
        <Stat icon={Clock} label="Awaiting Human Review" value={needsHuman} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-3 text-sm font-semibold text-foreground">Branches by readiness</div>
          {branchRows.length === 0 ? <Empty icon={Store} title="No submissions yet" sub="Branch readiness appears here once evidence is submitted." /> : (
            <Card className="divide-y divide-border">
              {branchRows.map((r) => (
                <div key={r.b} className="flex items-center gap-3 p-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Store className="h-4 w-4" /></span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{r.b}</div>
                    <div className="mt-1.5"><Bar pct={r.pct} /></div>
                  </div>
                  <Badge varName={r.pct >= 85 ? "--chart-2" : r.pct >= 70 ? "--chart-3" : "--destructive"}>{r.pct}%</Badge>
                </div>
              ))}
            </Card>
          )}
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-foreground">Recent issues</div>
          {recentFails.length === 0 ? <Empty icon={ShieldCheck} title="No open issues" sub="Failing evidence will surface here with the AI reason." /> : (
            <div className="space-y-2.5">
              {recentFails.map((s) => (
                <Card key={s._id} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">{s._configName}</div>
                    <Badge varName={verdictVar(s.result?.verdict)}>{verdictLabel(s.result?.verdict)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{subBranch(s)} · {fmtDate(s.createdAt)}</div>
                  <div className="mt-2 text-sm text-foreground">{s.result?.reason}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ===================================================== EVIDENCE REVIEW (QA/HQ) */
export function EvidenceReview(ctx: Ctx) {
  const [sel, setSel] = useState(0);
  if (ctx.loading) return <Loading />;
  if (ctx.error) return <ErrorState error={ctx.error} refresh={ctx.refresh} />;

  const queue = ctx.allSubs.filter((s) => s.status !== "PENDING");
  if (queue.length === 0) return (<><PageHead title="Evidence Review" sub="Validate AI judgments and keep the audit trail defensible." /><Empty icon={CheckCircle2} title="Nothing to review yet" sub="Submitted evidence and its AI judgment will appear here." /></>);
  const e = queue[Math.min(sel, queue.length - 1)];
  const r = e.result;
  const img = e.files?.find((f) => /\.(png|jpe?g|webp|gif)$/i.test(f.filename));

  const critCount = queue.filter((s) => s.result?.severity === "critical").length;
  return (
    <>
      <PageHead title="Evidence Review" sub="Validate AI judgments and keep the audit trail defensible."
        right={<Btn variant="ghost" icon={RefreshCw} onClick={ctx.refresh}>Refresh</Btn>} />
      <FocusBanner
        eyebrow="Awaiting your review"
        dotVar={critCount > 0 ? "--destructive" : "--chart-3"}
        title={`${queue.length} submission${queue.length === 1 ? "" : "s"} need a decision`}
        sub={`${critCount} critical. Start with the oldest to keep the audit trail current and defensible.`}
        actions={<Btn variant="invert" icon={CheckCircle2} onClick={() => setSel(0)}>Start review</Btn>}
      />
      <div className="grid gap-5" style={{ gridTemplateColumns: "360px 1fr" }}>
        <div className="space-y-2.5">
          {queue.map((s, i) => (
            <button key={s._id} onClick={() => setSel(i)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${i === Math.min(sel, queue.length - 1) ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={tone(verdictVar(s.result?.verdict))}><Sparkles className="h-4 w-4" /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">{s._configName}</span>
                <span className="block text-[11px] text-muted-foreground">{subBranch(s)} · {fmtDate(s.createdAt)}</span>
                <span className="mt-1.5 flex gap-1.5">
                  <Badge varName={verdictVar(s.result?.verdict)}>{verdictLabel(s.result?.verdict)}</Badge>
                  {s.result?.requiresHumanReview ? <Badge varName="--chart-3">Human review</Badge> : null}
                </span>
              </span>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-foreground">{e._configName}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{subBranch(e)} · submitted {fmtDate(e.createdAt)}</div>
            </div>
            <Badge varName={verdictVar(r?.verdict)}>{verdictLabel(r?.verdict)}</Badge>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
            <div>
              {img ? (
                <img src={img.fileUrl} alt="" className="mb-3 h-48 w-full rounded-lg border border-border object-cover" />
              ) : (
                <div className="mb-3 flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                  <FileText className="h-7 w-7" /><span className="mt-1.5 text-xs">{e.files?.length ? `${e.files.length} file(s) attached` : "No file attached"}</span>
                </div>
              )}
              <Card className="bg-muted p-3 text-sm">
                {Object.entries(e.inputData || {}).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border py-1.5 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="max-w-[60%] truncate font-medium text-foreground">{String(v)}</span>
                  </div>
                ))}
              </Card>
            </div>

            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={tone("--primary")}><Sparkles className="h-4 w-4" /></span>
                <div><div className="text-sm font-semibold text-foreground">AI Judgment</div><div className="text-[11px] text-muted-foreground">{r?.provider || "engine"} · {r?.model || "llm"}</div></div>
              </div>
              <div className="mb-3 flex gap-2.5">
                <div className="flex-1 rounded-lg border border-border bg-card p-2.5"><div className="text-[10px] font-bold uppercase text-muted-foreground">Score</div><div className="mt-0.5 text-sm font-bold text-foreground">{r?.score ?? "—"}/100</div></div>
                <div className="flex-1 rounded-lg border border-border bg-card p-2.5"><div className="text-[10px] font-bold uppercase text-muted-foreground">Confidence</div><div className="mt-0.5 text-sm font-bold text-foreground">{r ? Math.round((r.confidence || 0) * 100) : 0}%</div></div>
                <div className="flex-1 rounded-lg border border-border bg-card p-2.5"><div className="text-[10px] font-bold uppercase text-muted-foreground">Severity</div><div className="mt-0.5 text-sm font-bold" style={{ color: `var(${severityVar(r?.severity)})` }}>{r?.severity || "—"}</div></div>
              </div>
              <div className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">Reason</div>
              <div className="rounded-lg border border-l-2 border-border bg-card p-2.5 text-sm text-foreground" style={{ borderLeftColor: "var(--primary)" }}>{r?.reason || "—"}</div>
              <div className="mb-1 mt-3 text-[11px] font-bold uppercase" style={{ color: "var(--primary)" }}>Recommended fix</div>
              <div className="text-sm text-foreground">{r?.fixSuggestion || "—"}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-border pt-4">
            <Btn variant="primary" icon={Sparkles} onClick={() => ctx.toast("AI judgment approved · logged to audit trail")}>Approve judgment</Btn>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => { ctx.setActiveConfig(e.configId); ctx.setView("submit"); }}>Request re-submission</Btn>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ===================================================== SOP LIBRARY */
export function SopLibrary(ctx: Ctx) {
  const [drafts, setDrafts] = useState<BPConfig[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const res = await parseSop(file);
      setDrafts(Array.isArray(res) ? res : []);
      ctx.toast(`AI extracted ${Array.isArray(res) ? res.length : 0} draft config(s)`);
    } catch (e: any) {
      ctx.toast(e?.response?.data?.error || "Parse failed — the LLM adapter needs QB_SCAFFOLDER_KEY");
    } finally { setBusy(false); }
  }
  async function publish(d: BPConfig) {
    try { await createConfig(d); ctx.toast(`Published "${d.name}"`); setDrafts((x) => (x || []).filter((c) => c.pluginId !== d.pluginId)); ctx.refresh(); }
    catch (e: any) { ctx.toast(e?.response?.data?.error || "Publish failed"); }
  }

  return (
    <>
      <PageHead title="SOP Library" sub="Convert standards into evidence programs branches can complete."
        right={<Btn icon={Upload} onClick={() => inputRef.current?.click()}>Upload SOP</Btn>} />
      <input ref={inputRef} type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />

      {busy ? <Card className="mb-5 flex items-center gap-3 p-4"><Spinner /><div><div className="text-sm font-semibold text-foreground">Parsing your SOP…</div><div className="text-xs text-muted-foreground">Forwarding to the LLM adapter to draft evidence requirements</div></div></Card> : null}

      {drafts && drafts.length > 0 ? (
        <Card className="mb-6 p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} /><div className="text-sm font-semibold text-foreground">AI-drafted configs — review &amp; publish</div></div>
          <div className="space-y-2.5">
            {drafts.map((d) => (
              <div key={d.pluginId} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{(d.criteria?.length || 0)} criteria · {Object.keys(d.inputSchema?.properties || {}).length} fields</div>
                </div>
                <Btn variant="primary" icon={CheckCircle2} onClick={() => publish(d)}>Publish</Btn>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {ctx.loading ? <Loading /> : ctx.configs.length === 0 ? (
        <Empty icon={BookText} title="No evidence programs yet" sub="Upload an SOP to auto-generate configs, or seed them on server start." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ctx.configs.map((c) => (
            <Card key={c.pluginId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={tone("--primary")}><FileText className="h-4 w-4" /></span>
                  <div><div className="text-sm font-semibold text-foreground">{c.name}</div><div className="text-[11px] text-muted-foreground">{c.pluginId}</div></div>
                </div>
                <Badge varName="--chart-2">Published</Badge>
              </div>
              <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.rules}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(c.criteria || []).slice(0, 4).map((cr) => (
                  <Badge key={cr.id} varName={severityVar(cr.severity)}>{cr.name}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ===================================================== SUBMIT EVIDENCE (Branch) */
export function SubmitEvidence(ctx: Ctx) {
  const configs = ctx.configs;
  const [cfgId, setCfgId] = useState<string>(ctx.activeConfig || configs[0]?.pluginId || "");
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BPSubmission | null>(null);

  React.useEffect(() => { if (ctx.activeConfig) setCfgId(ctx.activeConfig); }, [ctx.activeConfig]);

  if (ctx.loading) return <Loading />;
  if (ctx.error) return <ErrorState error={ctx.error} refresh={ctx.refresh} />;
  if (configs.length === 0) return (<><PageHead title="Submit Evidence" /><Empty icon={Upload} title="No evidence programs to submit to" sub="HQ needs to publish at least one SOP config first." /></>);

  const cfg = configs.find((c) => c.pluginId === cfgId) || configs[0];
  const props = cfg.inputSchema?.properties || {};
  const required = new Set(cfg.inputSchema?.required || []);

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const inputData: Record<string, any> = { branch: ctx.branch, ...values };
      const allFiles: File[] = [];
      for (const [k, arr] of Object.entries(files)) { if (arr?.length) { inputData[k] = arr.map((f) => f.name).join(", "); allFiles.push(...arr); } }
      const sub = await submitEvidence(cfg.pluginId, inputData, allFiles);
      setResult(sub);
      ctx.toast(`Judged: ${verdictLabel(sub.result?.verdict)}`);
      ctx.refresh();
    } catch (e: any) {
      ctx.toast(e?.response?.data?.error || "Submission failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Submit Evidence" sub={`${ctx.branch} · choose a program and upload the required proof`} />
      <div className="grid gap-5" style={{ gridTemplateColumns: "260px 1fr" }}>
        <div className="space-y-2">
          {configs.map((c) => (
            <button key={c.pluginId} onClick={() => { setCfgId(c.pluginId); setResult(null); setValues({}); setFiles({}); }}
              className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${c.pluginId === cfgId ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="h-4 w-4" /></span>
              <span className="text-sm font-semibold text-foreground">{c.name}</span>
            </button>
          ))}
        </div>

        <div>
          <Card className="p-5">
            <div className="mb-1 text-base font-semibold text-foreground">{cfg.name}</div>
            <div className="mb-4 text-sm text-muted-foreground">{cfg.rules}</div>
            <div className="space-y-4">
              {Object.entries(props).map(([key, prop]: [string, any]) => {
                const isFile = prop?.["x-ui"]?.widget === "file";
                const label = prop.title || key;
                const req = required.has(key);
                return (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}{req ? <span className="text-destructive"> *</span> : null}</label>
                    {prop.description ? <div className="mb-1.5 text-[11px] text-muted-foreground">{prop.description}</div> : null}
                    {isFile ? (
                      <input type="file" multiple={prop.type === "array"}
                        onChange={(e) => setFiles((f) => ({ ...f, [key]: Array.from(e.target.files || []) }))}
                        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-foreground" />
                    ) : Array.isArray(prop.enum) ? (
                      <select value={values[key] || ""} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                        <option value="">Select…</option>
                        {prop.enum.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : prop.type === "boolean" ? (
                      <input type="checkbox" checked={!!values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))} className="h-4 w-4" />
                    ) : (prop.type === "number" || prop.type === "integer") ? (
                      <input type="number" value={values[key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                    ) : (
                      <textarea rows={key.toLowerCase().includes("note") || key.toLowerCase().includes("evidence") ? 3 : 1}
                        value={values[key] || ""} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-5">
              <Btn icon={busy ? undefined : Send} onClick={submit} disabled={busy} className="w-full justify-center py-3">
                {busy ? <><Spinner className="h-4 w-4" /> Submitting for AI judgment…</> : "Submit for AI judgment"}
              </Btn>
            </div>
          </Card>

          {result?.result ? (
            <Card className="mt-4 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg" style={tone(verdictVar(result.result.verdict))}><Sparkles className="h-4 w-4" /></span><div className="text-sm font-semibold text-foreground">AI judgment</div></div>
                <Badge varName={verdictVar(result.result.verdict)}>{verdictLabel(result.result.verdict)} · {result.result.score}/100</Badge>
              </div>
              <div className="rounded-lg border border-l-2 border-border bg-muted p-3 text-sm text-foreground" style={{ borderLeftColor: `var(${verdictVar(result.result.verdict)})` }}>{result.result.reason}</div>
              {result.result.verdict !== "pass" && result.result.verdict !== "ready" ? (
                <div className="mt-3"><div className="text-[11px] font-bold uppercase" style={{ color: "var(--primary)" }}>How to fix</div><div className="mt-1 text-sm text-foreground">{result.result.fixSuggestion}</div></div>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ===================================================== CORRECTIVE ACTIONS */
export function CorrectiveActions(ctx: Ctx) {
  if (ctx.loading) return <Loading />;
  if (ctx.error) return <ErrorState error={ctx.error} refresh={ctx.refresh} />;
  const cfgName = (id: string) => ctx.configs.find((c) => c.pluginId === id)?.name || id;
  const open = ctx.tasks || [];

  return (
    <>
      <PageHead title="Corrective Actions" sub="Failed evidence turned into follow-up tasks — tracked to closure."
        right={<Btn variant="ghost" icon={RefreshCw} onClick={ctx.refresh}>Refresh</Btn>} />
      <FocusBanner
        eyebrow="Open corrective actions"
        dotVar={open.length ? "--chart-3" : "--chart-2"}
        title={open.length ? `${open.length} corrective action${open.length === 1 ? "" : "s"} open` : "No open corrective actions"}
        sub={open.length ? "Each one was auto-created from a failed AI judgment. Complete them to close the loop and lift branch readiness." : "Everything that's been judged is currently passing — nothing to action."}
      />
      {open.length === 0 ? (
        <Empty icon={CheckCircle2} title="All clear" sub="No open corrective actions right now." />
      ) : (
        <div className="space-y-3">
          {open.map((t) => (
            <Card key={t._id} className="flex items-start gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={tone("--chart-3")}><Wrench style={{ width: 18, height: 18 }} /></span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{cfgName(t.configId)}</span>
                  <Badge varName="--chart-3">{t.status}</Badge>
                  {t.assigneeRole ? <Badge>{t.assigneeRole}</Badge> : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t.dueDate ? `Due ${fmtDate(t.dueDate)}` : "No due date"}{t.createdAt ? ` · opened ${fmtDate(t.createdAt)}` : ""}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{t.title}</div>
                {t.description ? <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t.description}</div> : null}
              </div>
              <Btn variant="primary" icon={CheckCircle2} onClick={() => ctx.completeTaskAction(t._id)}>Complete</Btn>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ===================================================== MY SUBMISSIONS (Branch) */
export function MySubmissions(ctx: Ctx) {
  if (ctx.loading) return <Loading />;
  if (ctx.error) return <ErrorState error={ctx.error} refresh={ctx.refresh} />;
  const mine = ctx.allSubs.filter((s) => subBranch(s) === ctx.branch);
  return (
    <>
      <PageHead title="My Submissions" sub={`Every evidence upload from ${ctx.branch}, with its AI result.`}
        right={<Btn variant="ghost" icon={RefreshCw} onClick={ctx.refresh}>Refresh</Btn>} />
      {mine.length === 0 ? <Empty icon={Upload} title="No submissions yet" sub="Head to Submit Evidence to upload your first proof." action={<Btn icon={Upload} onClick={() => ctx.setView("submit")}>Submit evidence</Btn>} /> : (
        <Card className="divide-y divide-border">
          {mine.map((s) => (
            <div key={s._id} className="flex items-center gap-4 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={tone(verdictVar(s.result?.verdict))}>
                {["pass", "ready"].includes(s.result?.verdict || "") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <div className="flex-1"><div className="text-sm font-semibold text-foreground">{s._configName}</div><div className="text-xs text-muted-foreground">{fmtDate(s.createdAt)}</div></div>
              <Badge varName={verdictVar(s.result?.verdict)}>{verdictLabel(s.result?.verdict)}</Badge>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
