import { Router, type IRouter } from "express";
import {
  AnalyzePromptBody,
  AnalyzePromptResponse,
  CancelWorkflowParams,
  CancelWorkflowResponse,
  CreateWorkflowBody,
  CreateWorkflowResponse,
  ExportDatasetBody,
  ExportDatasetParams,
  ExportDatasetResponse,
  GetDashboardSummaryResponse,
  GetDatasetRecordsParams,
  GetDatasetRecordsQueryParams,
  GetDatasetRecordsResponse,
  GetHistoryResponse,
  GetSettingsResponse,
  GetWorkflowParams,
  GetWorkflowResponse,
  ListDatasetsResponse,
  ListWorkflowsResponse,
  RunWorkflowParams,
  RunWorkflowResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
  type Workflow,
} from "@workspace/api-zod";
import {
  datasets,
  getDataset,
  getDatasetRecords,
  getWorkflow,
  history,
  makeSteps,
  records,
  settings,
  startWorkflow,
  workflows,
} from "../lib/datascout-store";
import { traceRun } from "../lib/langsmith";
import { uploadExportFile } from "../lib/cloudinary";
import { analyzeWithLLM } from "../lib/mistral";

const router: IRouter = Router();

function createAnalysis(prompt: string) {
  const lower = prompt.toLowerCase();
  const entity = lower.includes("saas")
    ? "SaaS startups"
    : lower.includes("finops")
      ? "FinOps platforms"
      : lower.includes("climate")
        ? "Climate software companies"
        : "Business organizations";
  const geography =
    lower.match(/\b(?:in|across|for)\s+(india|apac|europe|global|asia)\b/i)?.[1] ??
    "Global";
  const limitMatch = lower.match(/\b(\d{2,4})\b/);
  const limit = limitMatch ? Number(limitMatch[1]) : 50;
  const fields = [
    { name: "Company name", type: "text" as const, required: true },
    { name: "Founder name", type: "text" as const, required: false },
    { name: "Website", type: "url" as const, required: true },
    { name: "Funding amount", type: "currency" as const, required: false },
    { name: "Source URL", type: "url" as const, required: true },
  ];
  return {
    intent: "Discover and structure business entities",
    entity,
    geography: geography.charAt(0).toUpperCase() + geography.slice(1),
    limit,
    confidence: lower.length > 40 ? 0.94 : 0.81,
    fields,
    filters: [
      lower.includes("recent") ? "Recently funded" : "Relevant to request",
      geography.charAt(0).toUpperCase() + geography.slice(1),
    ],
    sources: ["Web crawl", "RSS feeds", "Public company pages"],
    steps: makeSteps().map((step) => ({ ...step, status: "pending" as const })),
  };
}

router.get("/dashboard/summary", (_req, res) => {
  const data = {
    totalDatasets: datasets.length,
    activeWorkflows: workflows.filter((workflow) => workflow.status === "running")
      .length,
    recordsCollected: records.length + 102,
    successRate: 96.4,
    recordsByDay: [
      { day: "Mon", records: 22 },
      { day: "Tue", records: 41 },
      { day: "Wed", records: 36 },
      { day: "Thu", records: 62 },
      { day: "Fri", records: 48 },
      { day: "Sat", records: 74 },
      { day: "Sun", records: 68 },
    ],
    sourceDistribution: [
      { source: "Company sites", records: 88 },
      { source: "Crunchbase", records: 64 },
      { source: "TechCrunch", records: 42 },
      { source: "RSS feeds", records: 8 },
    ],
  };
  res.json(GetDashboardSummaryResponse.parse(data));
});

router.post("/prompts/analyze", async (req, res) => {
  const parsed = AnalyzePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const analysis = await traceRun("prompt-analysis", { prompt: parsed.data.prompt }, async () => {
    const llm = await analyzeWithLLM(parsed.data.prompt);
    const base = createAnalysis(parsed.data.prompt);
    if (!llm) return base;
    const merged = {
      ...base,
      ...(llm as object),
      fields: base.fields,
      steps: base.steps,
    };
    merged.geography = merged.geography || "Global";
    if (!merged.limit || merged.limit > 1000 || merged.limit < 1) merged.limit = base.limit;
    if (!Array.isArray(merged.filters) || merged.filters.length === 0) merged.filters = base.filters;
    if (!Array.isArray(merged.sources) || merged.sources.length === 0) merged.sources = base.sources;
    if (typeof merged.confidence !== "number" || merged.confidence <= 0 || merged.confidence > 1) merged.confidence = base.confidence;
    return merged;
  });
  res.json(AnalyzePromptResponse.parse(analysis));
});

router.get("/workflows", (_req, res) => {
  res.json(ListWorkflowsResponse.parse(workflows));
});

router.post("/workflows", (req, res) => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const analysis = parsed.data.analysis;
  const workflow: Workflow = {
    id: `wf_${Date.now()}`,
    name: `${analysis.entity} · ${analysis.geography}`,
    prompt: parsed.data.prompt,
    status: "queued",
    progress: 0,
    recordsCollected: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: analysis.steps,
  };
  workflows.unshift(workflow);
  res.status(201).json(CreateWorkflowResponse.parse(workflow));
});

router.get("/workflows/:id", (req, res) => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const workflow = getWorkflow(params.data.id);
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  res.json(GetWorkflowResponse.parse(workflow));
});

router.post("/workflows/:id/run", async (req, res) => {
  const params = RunWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const workflow = getWorkflow(params.data.id);
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  await traceRun("workflow-run", { id: workflow.id, prompt: workflow.prompt }, () =>
    startWorkflow(workflow),
  );
  res.json(RunWorkflowResponse.parse(workflow));
});

router.post("/workflows/:id/cancel", (req, res) => {
  const params = CancelWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const workflow = getWorkflow(params.data.id);
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  workflow.status = "cancelled";
  workflow.steps = workflow.steps.map((step) =>
    step.status === "pending" || step.status === "running"
      ? { ...step, status: "cancelled" as const }
      : step,
  );
  workflow.updatedAt = new Date().toISOString();
  res.json(CancelWorkflowResponse.parse(workflow));
});

router.get("/datasets", (_req, res) => {
  res.json(ListDatasetsResponse.parse(datasets));
});

router.get("/datasets/:id/records", (req, res) => {
  const params = GetDatasetRecordsParams.safeParse(req.params);
  const query = GetDatasetRecordsQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "Invalid dataset filters" });
    return;
  }
  if (!getDataset(params.data.id)) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }
  const filtered = getDatasetRecords(params.data.id).filter((record) => {
    const search = query.data.search?.toLowerCase();
    const matchesSearch =
      !search ||
      [record.company, record.founder, record.source]
        .join(" ")
        .toLowerCase()
        .includes(search);
    const matchesSource = !query.data.source || record.source === query.data.source;
    const matchesConfidence =
      !query.data.confidence ||
      query.data.confidence === "all" ||
      (query.data.confidence === "high" && record.confidence >= 0.92) ||
      (query.data.confidence === "medium" &&
        record.confidence >= 0.88 &&
        record.confidence < 0.92) ||
      (query.data.confidence === "low" && record.confidence < 0.88);
    return matchesSearch && matchesSource && matchesConfidence;
  });
  res.json(GetDatasetRecordsResponse.parse(filtered));
});

router.post("/datasets/:id/export", async (req, res) => {
  const params = ExportDatasetParams.safeParse(req.params);
  const body = ExportDatasetBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid export request" });
    return;
  }
  if (!getDataset(params.data.id)) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }
  let downloadUrl = `/api/datasets/${params.data.id}/export/download?format=${body.data.format}`;
  try {
    const rows = records.map((r) =>
      body.data.format === "json"
        ? JSON.stringify(r)
        : [r.company, r.founder, r.website, r.funding, r.source, r.sourceUrl, r.confidence].join(","),
    );
    const content =
      body.data.format === "json" ? `[\n${rows.join(",\n")}\n]` : rows.join("\n");
    downloadUrl = await uploadExportFile(
      `dataset-${params.data.id}.${body.data.format === "xlsx" ? "csv" : body.data.format}`,
      content,
    );
  } catch {
    // Cloudinary not configured — keep local download URL
  }
  res.json(
    ExportDatasetResponse.parse({
      id: `exp_${Date.now()}`,
      format: body.data.format,
      downloadUrl,
      createdAt: new Date().toISOString(),
    }),
  );
});

router.get("/history", (_req, res) => {
  res.json(GetHistoryResponse.parse(history));
});

router.get("/settings", (_req, res) => {
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/settings", (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  Object.assign(settings, parsed.data);
  res.json(UpdateSettingsResponse.parse(settings));
});

export default router;