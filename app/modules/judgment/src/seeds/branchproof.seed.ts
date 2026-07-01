import { createLogger } from "~/lib/logger";
import { JudgmentConfigModel } from "../models/config.model";
import { normalizeGeneratedConfigPayload, validateConfigPayload } from "../lib/judgment.utils";

const logger = createLogger("BranchProofSeed");

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    evidenceSubmissionId: { type: "string" },
    criterionId: { type: "string" },
    verdict: { type: "string", enum: ["pass", "partial", "fail", "risk", "ready", "not_ready"] },
    score: { type: "number", minimum: 0, maximum: 100 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    reason: { type: "string" },
    fixSuggestion: { type: "string" },
    requiresHumanReview: { type: "boolean" },
  },
  required: ["id", "evidenceSubmissionId", "criterionId", "verdict", "score", "confidence", "severity", "reason", "fixSuggestion", "requiresHumanReview"],
};

function variables(unit: string, worker: string, manager: string, title: string) {
  return {
    labels: { unitLabel: unit, workerLabel: worker, managerLabel: manager },
    actions: { defaultTaskDueHours: 8, assigneeRole: "Branch Manager" },
    dashboard: { title, company: "BranchProof AI" },
  };
}

const photoField = (title: string, description: string) => ({ type: "string", title, description, "x-ui": { widget: "file" } });

const SEED_CONFIGS: Record<string, any>[] = [
  {
    pluginId: "handwashing_station_readiness",
    name: "Handwashing Station Readiness",
    rules: "Review the uploaded photo of the handwashing station taken before opening. The station passes only if soap, hand sanitizer, paper tissue and a visibly clean sink are ALL present in the photo. Fail if any required item is missing, the sink is dirty, or the photo is too blurry/dark to verify.",
    inputSchema: {
      type: "object",
      properties: {
        stationPhoto: photoField("Handwashing Station Photo", "One clear photo showing soap, sanitizer, tissue and a clean sink before opening."),
        evidenceText: { type: "string", title: "Notes", description: "Any notes for the reviewer (optional)." },
      },
      required: ["stationPhoto"],
    },
    outputSchema: OUTPUT_SCHEMA,
    criteria: [
      { id: "criterion_supplies_stocked", category: "Hygiene", name: "Supplies Stocked", passCriteria: "Soap, sanitizer and tissue are all clearly visible.", severity: "critical", weight: 60, autoFailIfMissing: true },
      { id: "criterion_sink_clean", category: "Hygiene", name: "Sink Clean", passCriteria: "Sink area is visibly clean and unobstructed.", severity: "high", weight: 40, autoFailIfMissing: false },
    ],
    variables: variables("Branch", "Branch Manager", "Area Manager", "Hygiene Readiness"),
  },
  {
    pluginId: "fridge_temperature_log",
    name: "Fridge Temperature Log",
    rules: "Review the uploaded temperature log photo. It must show the temperature value, the recording timestamp, staff initials AND a manager verification signature. Fail if the manager signature is missing or cut off, or if the temperature is outside the safe cold-storage range.",
    inputSchema: {
      type: "object",
      properties: {
        logPhoto: photoField("Temperature Log Photo", "A clear photo of the full log sheet including the manager signature column."),
        recordedTemp: { type: "number", title: "Recorded Temperature (°C)", description: "The most recent temperature reading." },
        evidenceText: { type: "string", title: "Notes", description: "Optional notes." },
      },
      required: ["logPhoto"],
    },
    outputSchema: OUTPUT_SCHEMA,
    criteria: [
      { id: "criterion_manager_signature", category: "Verification", name: "Manager Signature", passCriteria: "A manager verification signature is fully visible.", severity: "critical", weight: 50, autoFailIfMissing: true },
      { id: "criterion_temp_in_range", category: "Food Safety", name: "Temperature In Range", passCriteria: "Recorded temperature is within the safe cold-storage range (0–5°C).", severity: "high", weight: 50, autoFailIfMissing: false },
    ],
    variables: variables("Branch", "Branch Manager", "Area Manager", "Cold Storage Compliance"),
  },
  {
    pluginId: "closing_sanitation_checklist",
    name: "Closing Sanitation Checklist",
    rules: "Review the uploaded photo of the signed closing sanitation checklist. It must be fully completed and signed by the closing supervisor. Fail if rows are unticked, the form is unsigned, or the photo is unreadable.",
    inputSchema: {
      type: "object",
      properties: {
        checklistPhoto: photoField("Signed Checklist Photo", "Photo of the completed and signed closing sanitation checklist."),
        evidenceText: { type: "string", title: "Notes", description: "Optional notes." },
      },
      required: ["checklistPhoto"],
    },
    outputSchema: OUTPUT_SCHEMA,
    criteria: [
      { id: "criterion_checklist_complete", category: "Sanitation", name: "Checklist Complete", passCriteria: "All checklist rows are ticked.", severity: "high", weight: 60, autoFailIfMissing: true },
      { id: "criterion_checklist_signed", category: "Verification", name: "Signed", passCriteria: "The checklist carries the closing supervisor's signature.", severity: "high", weight: 40, autoFailIfMissing: true },
    ],
    variables: variables("Branch", "Branch Manager", "Area Manager", "Closing Compliance"),
  },
  {
    pluginId: "promo_display_compliance",
    name: "Promo Display Compliance",
    rules: "Review the uploaded promo display photo against the approved campaign guide. The photo must be a straight front-angle shot where the headline banner is legible and product placement matches the guide. Fail if the photo is a side angle, the banner is unreadable, or placement is wrong.",
    inputSchema: {
      type: "object",
      properties: {
        displayPhoto: photoField("Promo Display Photo", "A front-angle photo of the full promo display."),
        campaign: { type: "string", title: "Campaign Name", description: "The active campaign this display is for." },
        evidenceText: { type: "string", title: "Notes", description: "Optional notes." },
      },
      required: ["displayPhoto"],
    },
    outputSchema: OUTPUT_SCHEMA,
    criteria: [
      { id: "criterion_front_angle", category: "Brand", name: "Front Angle", passCriteria: "Photo is a straight front-angle shot with a legible headline banner.", severity: "medium", weight: 50, autoFailIfMissing: false },
      { id: "criterion_matches_guide", category: "Brand", name: "Matches Guide", passCriteria: "Product placement matches the approved campaign guide.", severity: "medium", weight: 50, autoFailIfMissing: false },
    ],
    variables: variables("Branch", "Store Manager", "Area Manager", "Brand Compliance"),
  },
];

export async function seedBranchProofConfigs() {
  let seeded = 0;
  for (const config of SEED_CONFIGS) {
    const normalized = normalizeGeneratedConfigPayload(config);
    normalized.outputSchema = config.outputSchema; // preserve output schema (not added by normalizer)
    validateConfigPayload(normalized);
    await JudgmentConfigModel.findOneAndUpdate(
      { pluginId: normalized.pluginId },
      { $set: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    seeded += 1;
    logger.info("Seeded BranchProof config", { pluginId: normalized.pluginId });
  }
  logger.info("BranchProof seeding completed", { seeded });
}

export default seedBranchProofConfigs;
