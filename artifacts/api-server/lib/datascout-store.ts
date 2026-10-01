import type {
  Dataset,
  DataRecord,
  HistoryEvent,
  Settings,
  Workflow,
  WorkflowStep,
} from "@workspace/api-zod";

const nowIso = () => new Date().toISOString();

export const makeSteps = (): WorkflowStep[] => [
  { id: "step_1", label: "Discovering sources", status: "pending" },
  { id: "step_2", label: "Validating records", status: "pending" },
  { id: "step_3", label: "Finalizing dataset", status: "pending" },
];

export const datasets: Dataset[] = [
  {
    id: "ds_1",
    name: "SaaS startups · Global",
    records: 124,
    fields: 5,
    sourceCount: 3,
    confidence: 0.94,
    updatedAt: nowIso(),
    status: "ready",
  },
];

export const workflows: Workflow[] = [
  {
    id: "wf_1",
    name: "FinOps platforms · APAC",
    prompt: "Find FinOps platforms in APAC",
    status: "completed",
    progress: 100,
    recordsCollected: 42,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    steps: makeSteps().map((s) => ({
      ...s,
      status: "success" as const,
      durationMs: 1200,
    })),
  },
];

export const records: DataRecord[] = [
  {
    id: "rec_1",
    company: "Acme Corp",
    founder: "Jane Doe",
    website: "https://acme.example.com",
    funding: "$1.2M",
    sourceUrl: "https://techcrunch.com/acme",
    source: "TechCrunch",
    retrievedAt: nowIso(),
    confidence: 0.96,
    validation: "passed",
  },
];

export const history: HistoryEvent[] = [
  {
    id: "hist_1",
    action: "Dataset exported",
    detail: "SaaS startups · Global exported to CSV",
    createdAt: nowIso(),
  },
];

export const settings: Settings = {
  aiMode: "mock",
  allowedDomains: ["techcrunch.com", "crunchbase.com"],
  rateLimit: 100,
  defaultSource: "Web crawl",
};

export const getDataset = (id: string) => datasets.find((d) => d.id === id);
export const getWorkflow = (id: string) => workflows.find((w) => w.id === id);

export const startWorkflow = (workflow: Workflow) => {
  workflow.status = "running";
  workflow.progress = 0;
  workflow.steps = workflow.steps.map((step) => ({
    ...step,
    status: "running" as const,
  }));
  workflow.updatedAt = nowIso();

  setTimeout(() => {
    if (workflow.status === "running") {
      workflow.status = "completed";
      workflow.progress = 100;
      workflow.steps = workflow.steps.map((step) => ({
        ...step,
        status: "success" as const,
        durationMs: 1500,
      }));
      workflow.updatedAt = nowIso();
    }
  }, 2000);
};
