import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, Check, CheckCircle2, ChevronDown,
  CircleAlert, Clock3, Download, ExternalLink, FileSearch, Filter, Gauge, Globe2, History,
  LayoutDashboard, Loader2, Menu, Play, Plus, RefreshCw, Search, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Square, Table2, Terminal, X, Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey, getGetDatasetRecordsQueryKey, getGetSettingsQueryKey,
  getGetWorkflowQueryKey, getListDatasetsQueryKey, getListWorkflowsQueryKey,
  getGetHistoryQueryKey, useAnalyzePrompt, useCancelWorkflow, useCreateWorkflow,
  useExportDataset, useGetDashboardSummary, useGetDatasetRecords, useGetHistory,
  useGetSettings, useGetWorkflow, useHealthCheck, useListDatasets, useListWorkflows,
  useRunWorkflow, useUpdateSettings,
} from '@workspace/api-client-react';
import type { DataRecord, Dataset, HistoryEvent, PromptAnalysis, Settings, Workflow, WorkflowStep } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, refetchOnWindowFocus: false } } });

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/new', label: 'Prompt studio', icon: Sparkles },
  { href: '/workflows', label: 'Workflows', icon: Zap },
  { href: '/datasets', label: 'Datasets', icon: Table2 },
  { href: '/history', label: 'History', icon: History },
];

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}
function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
function formatAgo(value?: string) {
  if (!value) return '—';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function titleCase(value?: string) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'; }

const SOURCE_URLS: Record<string, string> = {
  crunchbase: 'https://www.crunchbase.com',
  pitchbook: 'https://pitchbook.com',
  angellist: 'https://www.angel.co',
  angel: 'https://www.angel.co',
  techcrunch: 'https://techcrunch.com',
  'hacker news': 'https://news.ycombinator.com',
  pubmed: 'https://pubmed.ncbi.nlm.nih.gov',
  'web crawl': 'https://www.google.com',
  'rss feeds': 'https://feedly.com',
  'public company pages': 'https://www.google.com/search?q=company+pages',
};
function sourceUrl(source: string) {
  const key = source.trim().toLowerCase();
  return SOURCE_URLS[key] ?? `https://www.google.com/search?q=${encodeURIComponent(source + ' business data')}`;
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
    soft: 'bg-secondary text-secondary-foreground hover:bg-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'border border-destructive/30 text-destructive hover:bg-destructive/10',
  };
  return <button className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function StatusPill({ status }: { status?: string }) {
  const tone = status === 'completed' || status === 'ready' || status === 'success' || status === 'passed'
    ? 'text-primary bg-primary/10 border-primary/20'
    : status === 'running' || status === 'processing' || status === 'retrying'
      ? 'text-accent-foreground bg-accent/20 border-accent/30'
      : status === 'failed' || status === 'review'
        ? 'text-destructive bg-destructive/10 border-destructive/20'
        : 'text-muted-foreground bg-muted border-border';
  return <span data-testid={`status-${status ?? 'unknown'}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${tone}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'animate-pulse bg-accent' : 'bg-current'}`} />{status ?? 'unknown'}</span>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><div className="eyebrow mb-2 text-primary">{eyebrow}</div><h1 className="text-3xl font-extrabold tracking-[-.04em] text-foreground md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>
    {action}
  </header>;
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: count }, (_, i) => <div className="panel h-16 animate-pulse bg-muted/30" key={i} />)}</div>;
}
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="panel flex flex-col items-center justify-center gap-3 py-16 text-center" data-testid="error-state"><CircleAlert className="h-8 w-8 text-destructive" /><div><p className="font-bold">The signal dropped</p><p className="mt-1 text-sm text-muted-foreground">We could not load this view. Try the request again.</p></div>{onRetry && <Button variant="soft" onClick={onRetry} data-testid="button-retry"><RefreshCw className="h-3.5 w-3.5" /> Retry</Button>}</div>;
}
function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Search; title: string; description: string; action?: ReactNode }) {
  return <div className="panel flex flex-col items-center justify-center gap-3 py-16 text-center" data-testid="empty-state"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><p className="font-bold">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getGetDashboardSummaryQueryKey(), retry: false } });
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-9 flex items-center justify-between px-2"><Link href="/" className="flex items-center gap-2.5" data-testid="link-brand"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><FileSearch className="h-4 w-4" /></span><span className="text-sm font-extrabold tracking-[-.03em]">DataScout<span className="text-sidebar-primary"> AI</span></span></Link><button className="text-sidebar-foreground/60 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X className="h-5 w-5" /></button></div>
      <div className="eyebrow px-3 pb-2 text-sidebar-foreground/40">Workspace</div>
      <nav className="space-y-1">{nav.map(item => { const Icon = item.icon; const active = item.href === '/' ? location === '/' : location.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}><Icon className={`h-4 w-4 ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-primary'}`} />{item.label}{item.label === 'Workflows' && <span className="ml-auto rounded-full bg-sidebar-primary/15 px-1.5 py-0.5 font-mono text-[9px] text-sidebar-primary">live</span>}</Link>; })}</nav>
      <div className="mt-8 eyebrow px-3 pb-2 text-sidebar-foreground/40">Configure</div>
      <Link href="/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold ${location.startsWith('/settings') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`} data-testid="link-nav-settings"><Settings2 className="h-4 w-4 text-sidebar-foreground/45" />Settings</Link>
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3.5"><div className="flex items-center justify-between"><span className="eyebrow text-sidebar-foreground/45">API status</span><span className={`h-2 w-2 rounded-full ${health.isSuccess ? 'bg-sidebar-primary' : 'bg-destructive'}`} /></div><p className="mt-2 text-xs font-semibold">{health.isSuccess ? 'All systems operational' : 'Connection unavailable'}</p><p className="mt-1 font-mono text-[10px] text-sidebar-foreground/45">workspace / atlas-ops</p></div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-20 bg-sidebar/40 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay" />}
    <div className="md:pl-[248px]"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur md:px-9"><button className="mr-2 text-muted-foreground md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu className="h-5 w-5" /></button><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">Atlas Ops</span><span className="hidden text-border sm:inline">/</span><span className="font-mono text-[11px] text-foreground">{location === '/' ? 'overview' : location.slice(1)}</span></div><div className="ml-auto flex items-center gap-3"><button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-notifications"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></button><Link href="/settings" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground" data-testid="link-avatar">MC</Link></div></header><main className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9">{children}</main></div>
  </div>;
}

function MetricCard({ label, value, meta, icon: Icon, accent = false }: { label: string; value: string; meta: string; icon: typeof Activity; accent?: boolean }) {
  return <div className={`panel relative overflow-hidden p-5 ${accent ? 'border-primary/30 bg-primary/[.045]' : ''}`}><div className="flex items-start justify-between"><span className="eyebrow text-muted-foreground">{label}</span><span className={`rounded-lg p-2 ${accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}><Icon className="h-4 w-4" /></span></div><div className="mt-5 text-3xl font-extrabold tracking-[-.05em]">{value}</div><p className="mt-1 text-xs text-muted-foreground">{meta}</p>{accent && <div className="absolute -bottom-8 -right-5 h-24 w-24 rounded-full border-[12px] border-primary/10" />}</div>;
}

function MiniChart({ points }: { points: { day: string; records: number }[] }) {
  const max = Math.max(...points.map(p => p.records), 1);
  return <div className="flex h-36 items-end gap-1.5 pt-5">{points.length ? points.map((point, i) => <div className="group flex h-full flex-1 flex-col justify-end" key={point.day}><div className="relative w-full rounded-t-sm bg-primary/70 transition-all group-hover:bg-primary" style={{ height: `${Math.max(7, point.records / max * 100)}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-foreground group-hover:block">{point.records}</span></div><span className="mt-2 truncate text-center font-mono text-[9px] text-muted-foreground">{point.day.slice(5)}</span></div>) : <div className="w-full text-center text-sm text-muted-foreground">No collection activity yet</div>}</div>;
}

function Overview() {
  const summary = useGetDashboardSummary();
  const workflows = useListWorkflows();
  const retry = () => { void summary.refetch(); void workflows.refetch(); };
  if (summary.isLoading || workflows.isLoading) return <><PageHeader eyebrow="Command center" title="Collection overview" description="A live read on the quality and momentum of your research workspace." /><LoadingRows count={5} /></>;
  if (summary.isError || workflows.isError) return <ErrorState onRetry={retry} />;
  const s = summary.data;
  const recent = (workflows.data ?? []).slice(0, 4);
  return <div className="animate-rise"><PageHeader eyebrow="Command center / 09:41 UTC" title="Collection overview" description="A live read on the quality and momentum of your research workspace." action={<Link href="/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110" data-testid="link-start-workflow"><Plus className="h-4 w-4" /> New workflow</Link>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Datasets" value={formatNumber(s?.totalDatasets)} meta="ready to explore" icon={Table2} /><MetricCard label="Active workflows" value={formatNumber(s?.activeWorkflows)} meta="running right now" icon={Activity} accent /><MetricCard label="Records collected" value={formatNumber(s?.recordsCollected)} meta="across all datasets" icon={BarChart3} /><MetricCard label="Success rate" value={`${s?.successRate ?? 0}%`} meta="last 30 days" icon={ShieldCheck} /></section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.85fr]"><div className="panel p-5"><div className="flex items-start justify-between"><div><div className="eyebrow text-primary">Throughput</div><h2 className="mt-1 text-base font-extrabold">Records collected</h2><p className="mt-1 text-xs text-muted-foreground">Daily volume across active source connectors</p></div><span className="rounded-lg bg-muted p-2 text-muted-foreground"><BarChart3 className="h-4 w-4" /></span></div><MiniChart points={s?.recordsByDay ?? []} /></div><div className="panel p-5"><div className="eyebrow text-primary">Source mix</div><h2 className="mt-1 text-base font-extrabold">Where the signal comes from</h2><div className="mt-6 space-y-4">{(s?.sourceDistribution ?? []).slice(0, 5).map((item, i) => { const total = (s?.sourceDistribution ?? []).reduce((a, b) => a + b.records, 0) || 1; return <div key={item.source} data-testid={`source-${item.source}`}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{item.source}</span><span className="font-mono text-muted-foreground">{Math.round(item.records / total * 100)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${i % 2 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${item.records / total * 100}%` }} /></div></div>; })}</div></div></section>
    <section className="panel mt-5 overflow-hidden"><div className="flex items-center justify-between border-b px-5 py-4"><div><div className="eyebrow text-primary">Activity</div><h2 className="mt-1 text-base font-extrabold">Recent workflows</h2></div><Link href="/workflows" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid="link-view-workflows">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>{recent.length ? <div className="divide-y">{recent.map(w => <WorkflowRow key={w.id} workflow={w} />)}</div> : <EmptyState icon={Zap} title="Your cockpit is quiet" description="Turn a plain-English request into your first source-backed dataset." action={<Link href="/new" className="text-xs font-bold text-primary hover:underline" data-testid="link-empty-new">Open prompt studio</Link>} />}</section>
  </div>;
}

function WorkflowRow({ workflow }: { workflow: Workflow }) {
  return <Link href={`/workflows/${workflow.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-muted/45" data-testid={`row-workflow-${workflow.id}`}><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{workflow.name}</div><div className="mt-1 max-w-[550px] truncate text-xs text-muted-foreground">{workflow.prompt}</div></div><div className="hidden w-28 sm:block"><div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>{workflow.progress}%</span><span>{formatNumber(workflow.recordsCollected)} rows</span></div><div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${workflow.progress}%` }} /></div></div><StatusPill status={workflow.status} /><span className="w-14 text-right font-mono text-[10px] text-muted-foreground">{formatAgo(workflow.updatedAt)}</span></Link>;
}

function NewWorkflow() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<PromptAnalysis | undefined>();
  const analyze = useAnalyzePrompt();
  const create = useCreateWorkflow();
  const run = useRunWorkflow();
  const [, setLocation] = useLocation();
  const submitAnalysis = (event: React.FormEvent) => { event.preventDefault(); if (prompt.trim().length < 5) return; analyze.mutate({ data: { prompt } }, { onSuccess: setAnalysis }); };
  const createWorkflow = () => { if (!analysis) return; create.mutate({ data: { prompt, analysis } }, { onSuccess: workflow => setLocation(`/workflows/${workflow.id}`) }); };
  const examples = ['Find climate tech companies in the Nordics founded after 2020', 'List Series A fintech startups in Toronto with female founders'];
  return <div className="animate-rise"><PageHeader eyebrow="Prompt studio" title="Start with the question." description="Describe the dataset you need. DataScout turns intent into a traceable collection plan." />
    <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]"><div className="space-y-5"><form onSubmit={submitAnalysis} className="panel overflow-hidden"><div className="grid-paper border-b p-6 md:p-8"><div className="mb-5 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></span><span className="text-sm font-extrabold">Research brief</span><span className="ml-auto font-mono text-[10px] text-muted-foreground">STEP 01 / 02</span></div><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Find 50 venture-backed climate software companies in Europe, including founder, website, latest funding, and source URL." className="min-h-[190px] w-full resize-none border-0 bg-transparent text-lg font-medium leading-relaxed outline-none placeholder:text-muted-foreground/45" data-testid="input-prompt" /><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[10px] text-muted-foreground">{prompt.length} characters · plain English is enough</span><Button type="submit" disabled={analyze.isPending || prompt.trim().length < 5} data-testid="button-analyze"><>{analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}</> {analyze.isPending ? 'Reading brief' : 'Analyze request'}</Button></div></div></form><div><div className="eyebrow mb-2 text-muted-foreground">Try a starting point</div><div className="flex flex-wrap gap-2">{examples.map(example => <button key={example} onClick={() => setPrompt(example)} className="rounded-lg border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground" data-testid={`button-example-${examples.indexOf(example)}`}>{example}</button>)}</div></div></div>
      <AnalysisPanel analysis={analysis} isLoading={analyze.isPending} onCreate={createWorkflow} creating={create.isPending} onRun={run.mutate} />
    </div>
  </div>;
}

function AnalysisPanel({ analysis, isLoading, onCreate, creating, onRun }: { analysis?: PromptAnalysis; isLoading: boolean; onCreate: () => void; creating: boolean; onRun: (value: { id: string }) => void }) {
  if (isLoading) return <div className="panel p-6"><div className="eyebrow text-primary">Interpreting brief</div><div className="mt-6 space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className={`skeleton h-5 rounded ${i === 3 ? 'w-3/4' : 'w-full'}`} />)}</div></div>;
  if (!analysis) return <div className="panel grid min-h-[380px] place-items-center p-8 text-center"><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-primary/30 text-primary"><Gauge className="h-6 w-6" /></div><div className="text-sm font-bold">Your collection plan will appear here</div><p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">DataScout will extract intent, fields, filters, and a source policy before anything runs.</p></div></div>;
  return <div className="panel overflow-hidden animate-rise-2"><div className="border-b p-5"><div className="flex items-center justify-between"><div><div className="eyebrow text-primary">Collection plan</div><h2 className="mt-1 text-base font-extrabold">{titleCase(analysis.intent)} / {titleCase(analysis.entity)}</h2></div><span className="rounded-lg bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">{Math.round(analysis.confidence * 100)}% match</span></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"><Globe2 className="mr-1 inline h-3 w-3" />{analysis.geography}</span><span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">up to {analysis.limit} records</span>{analysis.filters?.map(f => <span key={f} className="rounded-md bg-accent/15 px-2 py-1 text-[11px] text-accent-foreground">{f}</span>)}</div></div><div className="p-5"><div className="mb-3 flex items-center justify-between"><span className="eyebrow text-muted-foreground">Output fields</span><span className="font-mono text-[10px] text-muted-foreground">{analysis.fields?.length ?? 0} columns</span></div><div className="divide-y rounded-lg border">{analysis.fields?.map(field => <div key={field.name} className="flex items-center gap-3 px-3 py-2.5 text-xs"><Check className="h-3.5 w-3.5 text-primary" /><span className="font-semibold">{field.name}</span><span className="ml-auto font-mono text-[10px] text-muted-foreground">{field.type}</span>{field.required && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">required</span>}</div>)}</div><div className="mt-5"><div className="eyebrow mb-3 text-muted-foreground">Source policy</div><div className="flex flex-wrap gap-2">{analysis.sources?.map(source => { const url = sourceUrl(source); return <a key={source} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-primary hover:underline" data-testid={`link-source-policy-${source}`}><ShieldCheck className="h-3.5 w-3.5 text-primary" />{source}<ExternalLink className="h-2.5 w-2.5" /></a>; })}</div></div><div className="mt-5 space-y-2">{analysis.steps?.slice(0, 4).map((step, i) => <div className="flex items-center gap-3 text-xs" key={step.id}><span className="grid h-5 w-5 place-items-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">{i + 1}</span><span>{step.label}</span><span className="ml-auto text-muted-foreground">{step.status}</span></div>)}</div><div className="mt-6 flex gap-2"><Button className="flex-1" onClick={onCreate} disabled={creating} data-testid="button-create-workflow">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create workflow</Button></div></div></div>;
}

function Workflows() {
  const query = useListWorkflows();
  const [filter, setFilter] = useState('all');
  if (query.isLoading) return <><PageHeader eyebrow="Operations" title="Workflows" /><LoadingRows /></>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const items = (query.data ?? []).filter(w => filter === 'all' || w.status === filter);
  return <div className="animate-rise"><PageHeader eyebrow="Operations" title="Workflows" description="Every collection run, from first prompt to final provenance check." action={<Link href="/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground" data-testid="link-new-workflow"><Plus className="h-4 w-4" /> New workflow</Link>} /><div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">{['all', 'running', 'queued', 'completed', 'failed'].map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`button-filter-${value}`}>{titleCase(value)}</button>)}</div>{items.length ? <div className="panel divide-y">{items.map(w => <WorkflowRow key={w.id} workflow={w} />)}</div> : <EmptyState icon={Zap} title="No workflows in this view" description="Adjust the filter or open the prompt studio to create a new collection." action={<Link href="/new" className="text-xs font-bold text-primary hover:underline" data-testid="link-empty-workflows">Create workflow</Link>} />}</div>;
}

function WorkflowDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetWorkflow(id, { query: { queryKey: getGetWorkflowQueryKey(id), refetchInterval: 5000 } });
  const run = useRunWorkflow();
  const cancel = useCancelWorkflow();
  const datasetsQuery = useListDatasets();
  const matchedDataset = datasetsQuery.data?.find(d => d.name === query.data?.name);
  const collectedRecords = useGetDatasetRecords(matchedDataset?.id ?? '', {}, { query: { queryKey: getGetDatasetRecordsQueryKey(matchedDataset?.id ?? '', {}), enabled: !!matchedDataset?.id } });
  const client = useQueryClient();
  const mutate = (fn: typeof run, action: 'run' | 'cancel') => fn.mutate({ id }, { onSuccess: result => { client.setQueryData(getGetWorkflowQueryKey(id), result); client.invalidateQueries({ queryKey: getListWorkflowsQueryKey() }); } });
  if (query.isLoading) return <><PageHeader eyebrow="Workflow" title="Loading workflow" /><LoadingRows count={3} /></>;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;
  const workflow = query.data;
  const canRun = workflow.status === 'queued' || workflow.status === 'failed' || workflow.status === 'cancelled';
  return <div className="animate-rise"><Link href="/workflows" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="link-back-workflows"><ArrowLeft className="h-3.5 w-3.5" /> All workflows</Link><PageHeader eyebrow={`Workflow / ${workflow.id.slice(0, 8)}`} title={workflow.name} description={workflow.prompt} action={<div className="flex gap-2">{canRun && <Button onClick={() => mutate(run, 'run')} disabled={run.isPending} data-testid="button-run-workflow"><Play className="h-3.5 w-3.5" /> {run.isPending ? 'Starting' : 'Run workflow'}</Button>}{(workflow.status === 'running' || workflow.status === 'queued') && <Button variant="danger" onClick={() => mutate(cancel, 'cancel')} disabled={cancel.isPending} data-testid="button-cancel-workflow"><Square className="h-3.5 w-3.5" /> Cancel</Button>}</div>} /><section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Progress" value={`${workflow.progress}%`} meta={titleCase(workflow.status)} icon={Activity} accent /><MetricCard label="Records collected" value={formatNumber(workflow.recordsCollected)} meta="validated rows" icon={Table2} /><MetricCard label="Last updated" value={formatAgo(workflow.updatedAt)} meta={formatDate(workflow.updatedAt)} icon={Clock3} /></section><div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="panel p-5"><div className="mb-5 flex items-center justify-between"><div><div className="eyebrow text-primary">Execution trace</div><h2 className="mt-1 text-base font-extrabold">Pipeline steps</h2></div><StatusPill status={workflow.status} /></div><div className="space-y-1">{workflow.steps?.map((step, i) => <StepRow key={step.id} step={step} index={i} />)}</div></div><div className="panel overflow-hidden"><div className="border-b p-5"><div className="eyebrow text-primary">Run log</div><h2 className="mt-1 text-base font-extrabold">Source-backed activity</h2></div><div className="max-h-[420px] overflow-y-auto p-5 scrollbar-thin"><div className="space-y-5 border-l border-border pl-4">{(workflow.steps ?? []).map((step, i) => <div className="relative" key={`log-${step.id}`}><span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card ${step.status === 'success' ? 'bg-primary' : step.status === 'running' ? 'bg-accent' : 'bg-muted-foreground/40'}`} /><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold">{step.label}</span><span className="font-mono text-[10px] text-muted-foreground">{step.durationMs ? `${step.durationMs}ms` : 'pending'}</span></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail ?? (i === 0 ? 'Waiting for execution to begin.' : 'Awaiting upstream step.')}</p></div>)}</div></div></div></div>{collectedRecords.data?.length ? <section className="panel mt-5 overflow-hidden"><div className="flex items-center justify-between border-b px-5 py-4"><div><div className="eyebrow text-primary">Collected records</div><h2 className="mt-1 text-base font-extrabold">Live rows from this run</h2></div>{matchedDataset && <Link href={`/datasets/${matchedDataset.id}`} className="text-xs font-bold text-primary hover:underline" data-testid="link-open-dataset">Open dataset</Link>}</div><div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-muted/35 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Company / Title</th><th className="px-3 py-3 font-medium">Founder / Author</th><th className="px-3 py-3 font-medium">Website</th><th className="px-3 py-3 font-medium">Source</th><th className="px-5 py-3 font-medium">Confidence</th></tr></thead><tbody className="divide-y">{collectedRecords.data.slice(0, 12).map(record => <tr key={record.id} className="transition hover:bg-muted/30" data-testid={`row-collected-${record.id}`}><td className="px-5 py-3 font-bold max-w-[260px] truncate">{record.company}</td><td className="px-3 py-3 text-muted-foreground">{record.founder || '—'}</td><td className="px-3 py-3 max-w-[260px] truncate"><a href={record.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{record.website}</a></td><td className="px-3 py-3"><a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{record.source}</a></td><td className="px-5 py-3 font-mono">{Math.round(record.confidence * 100)}%</td></tr>)}</tbody></table></div></section> : workflow.status === 'completed' ? <div className="panel mt-5 p-6 text-center text-xs text-muted-foreground">This workflow finished, but no dataset rows are attached to it.</div> : null}</div>;
}

function StepRow({ step, index }: { step: WorkflowStep; index: number }) {
  return <div className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-muted/45"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${step.status === 'success' ? 'border-primary/30 bg-primary/10 text-primary' : step.status === 'running' ? 'border-accent/40 bg-accent/15 text-accent-foreground' : 'border-border bg-muted text-muted-foreground'}`}>{step.status === 'success' ? <Check className="h-4 w-4" /> : step.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold">{step.label}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{step.detail ?? 'Not started'}</div></div><span className="font-mono text-[10px] text-muted-foreground">{step.durationMs ? `${step.durationMs} ms` : '—'}</span></div>;
}

function Datasets() {
  const query = useListDatasets();
  const [search, setSearch] = useState('');
  if (query.isLoading) return <><PageHeader eyebrow="Knowledge base" title="Datasets" /><LoadingRows /></>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const items = (query.data ?? []).filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="animate-rise"><PageHeader eyebrow="Knowledge base" title="Datasets" description="The clean, queryable outputs of every research run." /><div className="mb-5 flex items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets" className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-xs outline-none ring-primary/30 focus:ring-2" data-testid="input-search-datasets" /></div><span className="font-mono text-[10px] text-muted-foreground">{items.length} datasets</span></div>{items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(dataset => <DatasetCard key={dataset.id} dataset={dataset} />)}</div> : <EmptyState icon={Table2} title="No datasets found" description="Completed workflows will publish clean datasets here." />}</div>;
}
function DatasetCard({ dataset }: { dataset: Dataset }) {
  return <Link href={`/datasets/${dataset.id}`} className="panel group block p-5 transition hover:-translate-y-0.5 hover:border-primary/40" data-testid={`card-dataset-${dataset.id}`}><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Table2 className="h-5 w-5" /></div><StatusPill status={dataset.status} /></div><h2 className="mt-5 truncate text-base font-extrabold group-hover:text-primary">{dataset.name}</h2><p className="mt-1 font-mono text-[10px] text-muted-foreground">Updated {formatDate(dataset.updatedAt)}</p><div className="mt-5 grid grid-cols-3 divide-x border-y py-3"><div className="px-2 first:pl-0"><div className="font-mono text-sm font-medium">{formatNumber(dataset.records)}</div><div className="mt-1 text-[10px] text-muted-foreground">records</div></div><div className="px-3"><div className="font-mono text-sm font-medium">{dataset.fields}</div><div className="mt-1 text-[10px] text-muted-foreground">fields</div></div><div className="px-3"><div className="font-mono text-sm font-medium">{Math.round(dataset.confidence * 100)}%</div><div className="mt-1 text-[10px] text-muted-foreground">confidence</div></div></div><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{dataset.sourceCount} source domains</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-primary" /></div></Link>;
}

function DatasetDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const datasets = useListDatasets();
  const dataset = datasets.data?.find(item => item.id === id);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [confidence, setConfidence] = useState('all');
  const params = { search: search || undefined, source: source || undefined, confidence: confidence === 'all' ? undefined : confidence as 'high' | 'medium' | 'low' };
  const records = useGetDatasetRecords(id, params, { query: { queryKey: getGetDatasetRecordsQueryKey(id, params), enabled: !!id } });
  const exportMutation = useExportDataset();
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const sourceOptions = Array.from(new Set((records.data ?? []).map(r => r.source)));
  const exportData = () => exportMutation.mutate({ id, data: { format } }, { onSuccess: result => { if (result.downloadUrl) window.open(result.downloadUrl, '_blank', 'noopener,noreferrer'); } });
  if (datasets.isLoading || records.isLoading) return <><PageHeader eyebrow="Dataset" title="Loading explorer" /><LoadingRows count={4} /></>;
  if (datasets.isError || records.isError || !dataset) return <ErrorState onRetry={() => { void datasets.refetch(); void records.refetch(); }} />;
  return <div className="animate-rise"><Link href="/datasets" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="link-back-datasets"><ArrowLeft className="h-3.5 w-3.5" /> All datasets</Link><PageHeader eyebrow={`Dataset / ${dataset.id.slice(0, 8)}`} title={dataset.name} description={`${formatNumber(dataset.records)} records · ${dataset.fields} fields · ${dataset.sourceCount} source domains`} action={<div className="flex items-center gap-2"><select value={format} onChange={e => setFormat(e.target.value as 'csv' | 'json' | 'xlsx')} className="h-9 rounded-lg border bg-card px-2 text-xs font-bold outline-none" data-testid="select-export-format"><option value="csv">CSV</option><option value="json">JSON</option><option value="xlsx">XLSX</option></select><Button onClick={exportData} disabled={exportMutation.isPending} data-testid="button-export-dataset">{exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export</Button></div>} /><div className="panel overflow-hidden"><div className="flex flex-wrap gap-2 border-b bg-muted/25 p-4"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, founder, website…" className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/25" data-testid="input-search-records" /></div><div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><select value={source} onChange={e => setSource(e.target.value)} className="h-9 rounded-lg border bg-card px-2 text-xs outline-none" data-testid="select-source"><option value="">All sources</option>{sourceOptions.map(option => <option value={option} key={option}>{option}</option>)}</select><select value={confidence} onChange={e => setConfidence(e.target.value)} className="h-9 rounded-lg border bg-card px-2 text-xs outline-none" data-testid="select-confidence"><option value="all">Any confidence</option><option value="high">High confidence</option><option value="medium">Medium</option><option value="low">Low</option></select></div></div>{records.data?.length ? <div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-muted/35 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Company</th><th className="px-3 py-3 font-medium">Founder</th><th className="px-3 py-3 font-medium">Funding</th><th className="px-3 py-3 font-medium">Website URL</th><th className="px-3 py-3 font-medium">Source</th><th className="px-3 py-3 font-medium">Source URL</th><th className="px-3 py-3 font-medium">Confidence</th><th className="px-5 py-3 text-right font-medium">Validation</th></tr></thead><tbody className="divide-y">{records.data.map(record => <RecordRow record={record} key={record.id} />)}</tbody></table></div> : <EmptyState icon={Search} title="No matching records" description="Try broadening your search or clearing one of the filters." action={<Button variant="soft" onClick={() => { setSearch(''); setSource(''); setConfidence('all'); }} data-testid="button-clear-filters">Clear filters</Button>} />}</div></div>;
}
function RecordRow({ record }: { record: DataRecord }) {
  return <tr className="transition hover:bg-muted/30" data-testid={`row-record-${record.id}`}><td className="px-5 py-3.5"><div className="font-bold">{record.company}</div></td><td className="px-3 py-3.5 text-muted-foreground">{record.founder || '—'}</td><td className="px-3 py-3.5 font-mono">{record.funding || '—'}</td><td className="px-3 py-3.5 max-w-[220px] truncate"><a href={record.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all" data-testid={`link-website-${record.id}`}>{record.website}</a></td><td className="px-3 py-3.5"><span className="text-muted-foreground">{record.source}</span><div className="mt-1 font-mono text-[10px] text-muted-foreground">{formatAgo(record.retrievedAt)}</div></td><td className="px-3 py-3.5 max-w-[220px] truncate"><a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all" data-testid={`link-source-${record.id}`}>{record.sourceUrl}</a></td><td className="px-3 py-3.5 font-mono">{Math.round(record.confidence * 100)}%</td><td className="px-5 py-3.5 text-right"><StatusPill status={record.validation} /></td></tr>;
}

function HistoryPage() {
  const query = useGetHistory();
  if (query.isLoading) return <><PageHeader eyebrow="Observability" title="History" /><LoadingRows count={5} /></>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const events = query.data ?? [];
  return <div className="animate-rise"><PageHeader eyebrow="Observability" title="History" description="A durable audit trail for every prompt, run, and export." action={<div className="rounded-lg border bg-card px-3 py-2 font-mono text-[10px] text-muted-foreground">{events.length} events retained</div>} />{events.length ? <div className="panel divide-y">{events.map(event => <HistoryRow event={event} key={event.id} />)}</div> : <EmptyState icon={History} title="No history yet" description="Your workspace activity will appear here as you analyze prompts and run workflows." />}</div>;
}
function HistoryRow({ event }: { event: HistoryEvent }) {
  return <div className="flex gap-4 px-5 py-4" data-testid={`row-history-${event.id}`}><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-primary"><Terminal className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-xs font-bold">{event.action}</span><span className="font-mono text-[10px] text-muted-foreground">{formatDate(event.createdAt)} · {formatAgo(event.createdAt)}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p></div></div>;
}

function SettingsPage() {
  const query = useGetSettings();
  const update = useUpdateSettings();
  const client = useQueryClient();
  const [form, setForm] = useState<Settings>({ aiMode: 'mock', allowedDomains: [], rateLimit: 30, defaultSource: '' });
  const [domainInput, setDomainInput] = useState('');
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  if (query.isLoading) return <><PageHeader eyebrow="Workspace" title="Settings" /><LoadingRows count={4} /></>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const save = () => update.mutate({ data: { ...form } }, { onSuccess: result => { client.setQueryData(getGetSettingsQueryKey(), result); } });
  const addDomain = () => { const domain = domainInput.trim().toLowerCase(); if (domain && !form.allowedDomains.includes(domain)) setForm({ ...form, allowedDomains: [...form.allowedDomains, domain] }); setDomainInput(''); };
  return <div className="animate-rise"><PageHeader eyebrow="Workspace" title="Settings" description="Define the intelligence layer and the boundaries it works within." action={<Button onClick={save} disabled={update.isPending} data-testid="button-save-settings">{update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save changes</Button>} /><div className="grid max-w-4xl gap-5"><section className="panel p-6"><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div><div><div className="eyebrow text-primary">Intelligence</div><h2 className="mt-1 text-base font-extrabold">AI operating mode</h2><p className="mt-1 text-xs text-muted-foreground">Choose the engine used to interpret collection briefs.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{(['mock', 'ollama', 'huggingface'] as const).map(mode => <button key={mode} onClick={() => setForm({ ...form, aiMode: mode })} className={`rounded-xl border p-4 text-left transition ${form.aiMode === mode ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/30'}`} data-testid={`button-ai-mode-${mode}`}><div className="flex items-center justify-between"><span className="text-xs font-extrabold">{titleCase(mode)}</span><span className={`h-3 w-3 rounded-full border-2 ${form.aiMode === mode ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`} /></div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{mode === 'mock' ? 'Fast local responses for workspace testing.' : mode === 'ollama' ? 'Run an open model inside your environment.' : 'Hosted model with broad language coverage.'}</p></button>)}</div></section><section className="panel p-6"><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent-foreground"><ShieldCheck className="h-5 w-5" /></div><div><div className="eyebrow text-primary">Source policy</div><h2 className="mt-1 text-base font-extrabold">Allowed domains</h2><p className="mt-1 text-xs text-muted-foreground">Restrict discovery to sources your team can stand behind.</p></div></div><div className="mt-5 flex gap-2"><input value={domainInput} onChange={e => setDomainInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())} placeholder="e.g. crunchbase.com" className="h-10 flex-1 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25" data-testid="input-domain" /><Button variant="soft" onClick={addDomain} data-testid="button-add-domain"><Plus className="h-4 w-4" /> Add domain</Button></div><div className="mt-3 flex flex-wrap gap-2">{form.allowedDomains.length ? form.allowedDomains.map(domain => <span key={domain} className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 font-mono text-[10px]">{domain}<button onClick={() => setForm({ ...form, allowedDomains: form.allowedDomains.filter(item => item !== domain) })} className="text-muted-foreground hover:text-destructive" data-testid={`button-remove-domain-${domain}`}><X className="h-3 w-3" /></button></span>) : <span className="text-xs text-muted-foreground">All sources allowed by default.</span>}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Default source<input value={form.defaultSource} onChange={e => setForm({ ...form, defaultSource: e.target.value })} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-xs font-normal outline-none focus:ring-2 focus:ring-primary/25" data-testid="input-default-source" /></label><label className="text-xs font-bold">Requests per minute<input type="number" value={form.rateLimit} onChange={e => setForm({ ...form, rateLimit: Number(e.target.value) })} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-mono text-xs font-normal outline-none focus:ring-2 focus:ring-primary/25" data-testid="input-rate-limit" /></label></div></section></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Overview} /><Route path="/new" component={NewWorkflow} /><Route path="/workflows" component={Workflows} /><Route path="/workflows/:id" component={WorkflowDetail} /><Route path="/datasets" component={Datasets} /><Route path="/datasets/:id" component={DatasetDetail} /><Route path="/history" component={HistoryPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;