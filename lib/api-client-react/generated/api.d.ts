import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { DashboardSummary, DataRecord, Dataset, Error, Export, ExportInput, GetDatasetRecordsParams, HealthStatus, HistoryEvent, PromptAnalysis, PromptInput, Settings, SettingsInput, Workflow, WorkflowInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDashboardSummaryUrl: () => string;
/**
 * @summary Get dashboard summary
 */
export declare const getDashboardSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAnalyzePromptUrl: () => string;
/**
 * @summary Parse a natural-language collection request
 */
export declare const analyzePrompt: (promptInput: PromptInput, options?: Parameters<typeof customFetch>[1]) => Promise<PromptAnalysis>;
export declare const getAnalyzePromptMutationKey: () => readonly ["analyzePrompt"];
export declare const getAnalyzePromptMutationOptions: <TError = ErrorType<Error>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzePrompt>>, TError, AnalyzePromptMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzePrompt>>, TError, AnalyzePromptMutationVariables, TContext>;
export type AnalyzePromptMutationResult = NonNullable<Awaited<ReturnType<typeof analyzePrompt>>>;
export type AnalyzePromptMutationBody = BodyType<PromptInput>;
export type AnalyzePromptMutationError = ErrorType<Error>;
export type AnalyzePromptMutationVariables = {
    data: BodyType<PromptInput>;
};
/**
* @summary Parse a natural-language collection request
*/
export declare const useAnalyzePrompt: <TError = ErrorType<Error>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzePrompt>>, TError, AnalyzePromptMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzePrompt>>, TError, AnalyzePromptMutationVariables, TContext>;
export declare const getListWorkflowsUrl: () => string;
/**
 * @summary List recent workflows
 */
export declare const listWorkflows: (options?: Parameters<typeof customFetch>[1]) => Promise<Workflow[]>;
export declare const getListWorkflowsQueryKey: () => readonly ["/api/workflows"];
export declare const getListWorkflowsQueryOptions: <TData = Awaited<ReturnType<typeof listWorkflows>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listWorkflows>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListWorkflowsQueryResult = NonNullable<Awaited<ReturnType<typeof listWorkflows>>>;
export type ListWorkflowsQueryError = ErrorType<unknown>;
/**
 * @summary List recent workflows
 */
export declare function useListWorkflows<TData = Awaited<ReturnType<typeof listWorkflows>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateWorkflowUrl: () => string;
/**
 * @summary Create a workflow from a prompt
 */
export declare const createWorkflow: (workflowInput: WorkflowInput, options?: Parameters<typeof customFetch>[1]) => Promise<Workflow>;
export declare const getCreateWorkflowMutationKey: () => readonly ["createWorkflow"];
export declare const getCreateWorkflowMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWorkflow>>, TError, CreateWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createWorkflow>>, TError, CreateWorkflowMutationVariables, TContext>;
export type CreateWorkflowMutationResult = NonNullable<Awaited<ReturnType<typeof createWorkflow>>>;
export type CreateWorkflowMutationBody = BodyType<WorkflowInput>;
export type CreateWorkflowMutationError = ErrorType<unknown>;
export type CreateWorkflowMutationVariables = {
    data: BodyType<WorkflowInput>;
};
/**
* @summary Create a workflow from a prompt
*/
export declare const useCreateWorkflow: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWorkflow>>, TError, CreateWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createWorkflow>>, TError, CreateWorkflowMutationVariables, TContext>;
export declare const getGetWorkflowUrl: (id: string) => string;
/**
 * @summary Get a workflow
 */
export declare const getWorkflow: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<Workflow>;
export declare const getGetWorkflowQueryKey: (id: string) => readonly [`/api/workflows/${string}`];
export declare const getGetWorkflowQueryOptions: <TData = Awaited<ReturnType<typeof getWorkflow>>, TError = ErrorType<Error>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWorkflow>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWorkflow>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWorkflowQueryResult = NonNullable<Awaited<ReturnType<typeof getWorkflow>>>;
export type GetWorkflowQueryError = ErrorType<Error>;
/**
 * @summary Get a workflow
 */
export declare function useGetWorkflow<TData = Awaited<ReturnType<typeof getWorkflow>>, TError = ErrorType<Error>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWorkflow>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRunWorkflowUrl: (id: string) => string;
/**
 * @summary Run a workflow
 */
export declare const runWorkflow: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<Workflow>;
export declare const getRunWorkflowMutationKey: () => readonly ["runWorkflow"];
export declare const getRunWorkflowMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof runWorkflow>>, TError, RunWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof runWorkflow>>, TError, RunWorkflowMutationVariables, TContext>;
export type RunWorkflowMutationResult = NonNullable<Awaited<ReturnType<typeof runWorkflow>>>;
export type RunWorkflowMutationError = ErrorType<unknown>;
export type RunWorkflowMutationVariables = {
    id: string;
};
/**
* @summary Run a workflow
*/
export declare const useRunWorkflow: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof runWorkflow>>, TError, RunWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof runWorkflow>>, TError, RunWorkflowMutationVariables, TContext>;
export declare const getCancelWorkflowUrl: (id: string) => string;
/**
 * @summary Cancel a workflow
 */
export declare const cancelWorkflow: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<Workflow>;
export declare const getCancelWorkflowMutationKey: () => readonly ["cancelWorkflow"];
export declare const getCancelWorkflowMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelWorkflow>>, TError, CancelWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelWorkflow>>, TError, CancelWorkflowMutationVariables, TContext>;
export type CancelWorkflowMutationResult = NonNullable<Awaited<ReturnType<typeof cancelWorkflow>>>;
export type CancelWorkflowMutationError = ErrorType<unknown>;
export type CancelWorkflowMutationVariables = {
    id: string;
};
/**
* @summary Cancel a workflow
*/
export declare const useCancelWorkflow: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelWorkflow>>, TError, CancelWorkflowMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelWorkflow>>, TError, CancelWorkflowMutationVariables, TContext>;
export declare const getListDatasetsUrl: () => string;
/**
 * @summary List datasets
 */
export declare const listDatasets: (options?: Parameters<typeof customFetch>[1]) => Promise<Dataset[]>;
export declare const getListDatasetsQueryKey: () => readonly ["/api/datasets"];
export declare const getListDatasetsQueryOptions: <TData = Awaited<ReturnType<typeof listDatasets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDatasets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDatasets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDatasetsQueryResult = NonNullable<Awaited<ReturnType<typeof listDatasets>>>;
export type ListDatasetsQueryError = ErrorType<unknown>;
/**
 * @summary List datasets
 */
export declare function useListDatasets<TData = Awaited<ReturnType<typeof listDatasets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDatasets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDatasetRecordsUrl: (id: string, params?: GetDatasetRecordsParams) => string;
/**
 * @summary Get records in a dataset
 */
export declare const getDatasetRecords: (id: string, params?: GetDatasetRecordsParams, options?: Parameters<typeof customFetch>[1]) => Promise<DataRecord[]>;
export declare const getGetDatasetRecordsQueryKey: (id: string, params?: GetDatasetRecordsParams) => readonly [`/api/datasets/${string}/records`, ...GetDatasetRecordsParams[]];
export declare const getGetDatasetRecordsQueryOptions: <TData = Awaited<ReturnType<typeof getDatasetRecords>>, TError = ErrorType<unknown>>(id: string, params?: GetDatasetRecordsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDatasetRecords>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDatasetRecords>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDatasetRecordsQueryResult = NonNullable<Awaited<ReturnType<typeof getDatasetRecords>>>;
export type GetDatasetRecordsQueryError = ErrorType<unknown>;
/**
 * @summary Get records in a dataset
 */
export declare function useGetDatasetRecords<TData = Awaited<ReturnType<typeof getDatasetRecords>>, TError = ErrorType<unknown>>(id: string, params?: GetDatasetRecordsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDatasetRecords>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExportDatasetUrl: (id: string) => string;
/**
 * @summary Export a dataset
 */
export declare const exportDataset: (id: string, exportInput: ExportInput, options?: Parameters<typeof customFetch>[1]) => Promise<Export>;
export declare const getExportDatasetMutationKey: () => readonly ["exportDataset"];
export declare const getExportDatasetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exportDataset>>, TError, ExportDatasetMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof exportDataset>>, TError, ExportDatasetMutationVariables, TContext>;
export type ExportDatasetMutationResult = NonNullable<Awaited<ReturnType<typeof exportDataset>>>;
export type ExportDatasetMutationBody = BodyType<ExportInput>;
export type ExportDatasetMutationError = ErrorType<unknown>;
export type ExportDatasetMutationVariables = {
    id: string;
    data: BodyType<ExportInput>;
};
/**
* @summary Export a dataset
*/
export declare const useExportDataset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exportDataset>>, TError, ExportDatasetMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof exportDataset>>, TError, ExportDatasetMutationVariables, TContext>;
export declare const getGetHistoryUrl: () => string;
/**
 * @summary Get audit history
 */
export declare const getHistory: (options?: Parameters<typeof customFetch>[1]) => Promise<HistoryEvent[]>;
export declare const getGetHistoryQueryKey: () => readonly ["/api/history"];
export declare const getGetHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getHistory>>>;
export type GetHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get audit history
 */
export declare function useGetHistory<TData = Awaited<ReturnType<typeof getHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSettingsUrl: () => string;
/**
 * @summary Get workspace settings
 */
export declare const getSettings: (options?: Parameters<typeof customFetch>[1]) => Promise<Settings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get workspace settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSettingsUrl: () => string;
/**
 * @summary Update workspace settings
 */
export declare const updateSettings: (settingsInput: SettingsInput, options?: Parameters<typeof customFetch>[1]) => Promise<Settings>;
export declare const getUpdateSettingsMutationKey: () => readonly ["updateSettings"];
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, UpdateSettingsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, UpdateSettingsMutationVariables, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<SettingsInput>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
export type UpdateSettingsMutationVariables = {
    data: BodyType<SettingsInput>;
};
/**
* @summary Update workspace settings
*/
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, UpdateSettingsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, UpdateSettingsMutationVariables, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map