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

export const recordsByDataset: Record<string, DataRecord[]> = { ds_1: records };

export const getDatasetRecords = (datasetId: string): DataRecord[] =>
  recordsByDataset[datasetId] ?? [];

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
  workflow.progress = 5;
  workflow.steps = workflow.steps.map((step, i) => ({
    ...step,
    status: i === 0 ? ("running" as const) : ("pending" as const),
    detail: "Starting",
  }));
  workflow.updatedAt = nowIso();

  void (async () => {
    try {
      const t1 = Date.now();
      const results = await fetchHackerNews(workflow.prompt);
      workflow.steps[0] = {
        ...workflow.steps[0],
        status: "success",
        durationMs: Date.now() - t1,
        detail: `Found ${results.length} live hits via Hacker News search`,
      };
      workflow.progress = 45;
      workflow.updatedAt = nowIso();

      const t2 = Date.now();
      workflow.steps[1] = { ...workflow.steps[1], status: "running", detail: "Validating URLs and deduplicating" };
      const seen = new Set<string>();
      const valid = results.filter((r) => {
        if (!r.website || seen.has(r.website)) return false;
        seen.add(r.website);
        return r.confidence >= 0.5;
      });
      await new Promise((r) => setTimeout(r, 400));
      workflow.steps[1] = {
        ...workflow.steps[1],
        status: "success",
        durationMs: Date.now() - t2,
        detail: `${valid.length}/${results.length} records passed validation`,
      };
      workflow.progress = 75;
      workflow.updatedAt = nowIso();

      const t3 = Date.now();
      workflow.steps[2] = { ...workflow.steps[2], status: "running", detail: "Publishing dataset" };
      if (valid.length === 0) {
        workflow.steps[2] = {
          ...workflow.steps[2],
          status: "failed" as const,
          durationMs: Date.now() - t3,
          detail: "No valid records found for this query",
        };
        workflow.status = "failed";
        workflow.updatedAt = nowIso();
        return;
      }
      const withIds = valid.map((r, i) => ({ ...r, id: `rec_${Date.now()}_${i}` }));
      records.push(...withIds);
      const newDatasetId = `ds_${Date.now()}`;
      recordsByDataset[newDatasetId] = withIds;
      datasets.unshift({
        id: newDatasetId,
        name: workflow.name,
        records: withIds.length,
        fields: 5,
        sourceCount: new Set(withIds.map((r) => r.source)).size,
        confidence: withIds.length ? withIds.reduce((a, r) => a + r.confidence, 0) / withIds.length : 0,
        updatedAt: nowIso(),
        status: "ready",
      });
      history.unshift({
        id: `hist_${Date.now()}`,
        action: "Workflow completed",
        detail: `${workflow.name} collected ${withIds.length} live records`,
        createdAt: nowIso(),
      });
      workflow.steps[2] = {
        ...workflow.steps[2],
        status: "success",
        durationMs: Date.now() - t3,
        detail: `Published dataset with ${withIds.length} records`,
      };
      workflow.status = "completed";
      workflow.progress = 100;
      workflow.recordsCollected = withIds.length;
      workflow.updatedAt = nowIso();
    } catch (err) {
      const runningIdx = workflow.steps.findIndex((s) => s.status === "running");
      if (runningIdx >= 0) {
        workflow.steps[runningIdx] = {
          ...workflow.steps[runningIdx],
          status: "failed" as const,
          detail: (err as Error).message,
        };
      }
      workflow.status = "failed";
      workflow.updatedAt = nowIso();
    }
  })();
};

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  num_comments: number | null;
  author: string;
  created_at: string;
}

async function fetchHackerNews(query: string): Promise<Omit<DataRecord, "id">[]> {
  const stopwords = new Set([
    "find", "list", "get", "the", "a", "an", "in", "across", "for", "with", "and",
    "of", "to", "after", "before", "show", "me", "all", "based", "startup", "startups",
    "companies", "company", "series", "founded", "founder", "founders",
  ]);
  const keywords = query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  const cleanQuery = keywords.slice(0, 5).join(" ") || "technology";
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanQuery)}&tags=story&hitsPerPage=25`,
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = (await res.json()) as { hits: HnHit[] };
  return data.hits
    .filter((hit) => hit.title)
    .map((hit) => ({
      company: (hit.title as string).slice(0, 80),
      founder: hit.author,
      website: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      funding: "",
      sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "Hacker News",
      retrievedAt: nowIso(),
      confidence: Math.min(0.99, 0.55 + Math.log10(Math.max(hit.points ?? 1, 1) + 1) / 3 + Math.min(hit.num_comments ?? 0, 200) / 1000),
      validation: "passed" as const,
    }));
}
