import axios from "axios";

// The judgment engine controllers return RAW JSON (not the {success,data}
// envelope used elsewhere), so this client returns the payload directly.
const BASE = "/api/judgment";

async function call<T = any>(path: string, opts: any = {}): Promise<T> {
  const res = await axios({
    url: `${BASE}${path}`,
    method: opts.method || "GET",
    data: opts.data,
    params: opts.params,
    headers: opts.headers,
    withCredentials: true,
  });
  return res.data as T;
}

export interface BPSubmission {
  _id: string;
  configId: string;
  inputData: Record<string, any>;
  files: Array<{ filename: string; fileUrl: string }>;
  status: "PENDING" | "DONE" | "ERROR";
  result?: {
    verdict: "pass" | "partial" | "fail" | "risk" | "ready" | "not_ready";
    score: number;
    confidence: number;
    severity: "low" | "medium" | "high" | "critical";
    reason: string;
    fixSuggestion: string;
    requiresHumanReview: boolean;
    provider?: string;
    model?: string;
    resultData?: Record<string, any>;
  } | null;
  error?: string | null;
  createdAt?: string;
}

export interface BPConfig {
  _id?: string;
  pluginId: string;
  name: string;
  rules?: string;
  inputSchema?: { type?: string; properties?: Record<string, any>; required?: string[] };
  outputSchema?: Record<string, any>;
  criteria?: Array<{ id: string; category?: string; name: string; passCriteria: string; severity?: string; weight?: number; autoFailIfMissing?: boolean }>;
  variables?: Record<string, any>;
}

export interface BPDashboard {
  config: BPConfig;
  labels: { unitLabel: string; workerLabel: string; managerLabel: string; issueLabel?: string; actionLabel?: string; assigneeRole?: string };
  submissions: BPSubmission[];
}

export const listConfigs = () => call<BPConfig[]>("/configs");
export const getConfig = (id: string) => call<BPConfig>(`/configs/${id}`);
export const getDashboard = (id: string) => call<BPDashboard>(`/configs/${id}/dashboard`);

export async function submitEvidence(configId: string, inputData: Record<string, any>, files: File[]) {
  const fd = new FormData();
  fd.append("inputData", JSON.stringify(inputData));
  for (const f of files) fd.append("files", f);
  return call<BPSubmission>(`/configs/${configId}/submit`, { method: "POST", data: fd });
}

export async function parseSop(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  // returns an array of generated config drafts
  return call<BPConfig[]>("/configs/parse", { method: "POST", data: fd });
}

export const createConfig = (cfg: BPConfig) =>
  call<BPConfig>("/configs/direct", { method: "POST", data: cfg, headers: { "Content-Type": "application/json" } });

export interface BPTask {
  _id: string;
  configId: string;
  issueId?: string;
  title: string;
  assigneeRole?: string;
  dueDate?: string;
  status: string;
  description?: string;
  createdAt?: string;
}
export interface BPIssue {
  _id: string;
  configId: string;
  submissionId?: string;
  severity?: string;
  status: string;
  title: string;
  description?: string;
  createdAt?: string;
}

export const listTasks = (status = "open") => call<BPTask[]>("/tasks", { params: { status } });
export const listIssues = (status = "open") => call<BPIssue[]>("/issues", { params: { status } });
export const completeTask = (taskId: string) => call(`/tasks/${taskId}/complete`, { method: "POST" });
export const resolveIssue = (issueId: string) => call(`/issues/${issueId}/resolve`, { method: "POST" });
