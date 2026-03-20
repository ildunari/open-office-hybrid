// Runtime

// Context
export { type ContextAction, ContextManager } from "./context/manager";
export type { ContextBudget, DocumentMap } from "./context/types";
export type {
  Disposable,
  DocumentScope,
  ExcelScope,
  HookAction,
  HookBand,
  HookBudget,
  HookFailurePolicy,
  HookPhase,
  HookPromptNote,
  HookSelector,
  HookSessionState,
  HookSourceRef,
  HookSpeed,
  HookWarning,
  OfficeApp,
  PostHookContext,
  PostHookDefinition,
  PostHookResult,
  PreHookContext,
  PreHookDefinition,
  PreHookResult,
  RiskLevel,
  ToolCallEnvelope,
  ToolTag,
  WordScope,
} from "./hooks";
// Hooks
export {
  classifyTool,
  classifyToolRisk,
  formatFingerprintCheckHook,
  formatFingerprintPreHook,
  formatFingerprintRecordHook,
  HookRegistry,
  readBeforeWritePostHook,
  readBeforeWritePreHook,
  wrapTool,
} from "./hooks";
export type { ImageResizeOptions, ResizedImage } from "./image-resize";
export { resizeImage } from "./image-resize";
// Lockdown
export { ensureLockdown } from "./lockdown";
// Message utilities
export {
  agentMessagesToChatMessages,
  type ChatMessage,
  deriveStats,
  extractPartsFromAssistantMessage,
  generateId,
  type MessagePart,
  type SessionStats,
  stripEnrichment,
  type ToolCallStatus,
} from "./message-utils";
// OAuth
export {
  buildAuthorizationUrl,
  exchangeOAuthCode,
  generatePKCE,
  loadOAuthCredentials,
  OAUTH_PROVIDERS,
  type OAuthCredentials,
  type OAuthFlowState,
  refreshOAuthToken,
  removeOAuthCredentials,
  saveOAuthCredentials,
} from "./oauth";
export type {
  ActionClass,
  ApprovalPolicy,
  ApprovalPolicyMode,
  CapabilityBoundary,
  CapabilityBoundaryMode,
  HostApp,
  HostScopeRef,
  PermissionMode,
  PolicyTraceEntry,
  TaskPhase,
  WaitingState,
} from "./orchestration/types";
// Patterns
export { PatternRegistry } from "./patterns/registry";
export type { ReasoningPattern } from "./patterns/types";
export { loadPdfDocument } from "./pdf";
export type {
  CompactionArtifact,
  CompletionArtifact,
  ExecutionPlan,
  ExecutionUnit,
  PlanMilestone,
  PlanMode,
  PlanRevisionNote,
  PlanStatus,
  PlanStep,
  RuntimeMode,
  StepKind,
  StepStatus,
  TaskClassification,
  TaskComplexity,
  TaskRecord,
  TaskStatus,
  TaskThreadSummary,
  ThreadStatus,
  VerificationIntent,
} from "./planning";
// Planning
export {
  buildDefaultPlan,
  createUpdatePlanTool,
  formatPlanForPrompt,
  inferTaskClassification,
  PlanManager,
  TaskClassifier,
} from "./planning";
// Provider config
export {
  API_TYPES,
  applyProxyToModel,
  buildCustomModel,
  loadSavedConfig,
  type ProviderConfig,
  saveConfig,
  THINKING_LEVELS,
  type ThinkingLevel,
} from "./provider-config";
// Reflection
export { ReflectionEngine } from "./reflection/engine";
export type {
  MicroReflectionInput,
  QualityCriteria,
  ReflectionLevel,
  ReflectionResult,
  StepReflectionInput,
  TaskReflectionInput,
} from "./reflection/types";
export {
  AgentRuntime,
  type RuntimeAdapter,
  type RuntimeState,
  type UploadedFile,
} from "./runtime";
// Sandbox
export { sandboxedEval } from "./sandbox";
// Skills
export {
  addSkill,
  buildSkillsPromptSection,
  getInstalledSkills,
  parseSkillMeta,
  removeSkill,
  type SkillInput,
  type SkillMeta,
  syncSkillsToVfs,
} from "./skills";
export type { BeginTaskOptions } from "./state/tracker";
// State
export { TaskTracker } from "./state/tracker";
export type { TrackedMutation } from "./state/undo";
export { buildUndoNarrative } from "./state/undo";
// Storage
export {
  type ChatSession,
  configureNamespace,
  createSession,
  deletePlanRecords,
  deleteReflectionEntries,
  deleteSession,
  deleteTaskRecords,
  getLatestPlanRecord,
  getLatestTaskRecord,
  getNamespace,
  getOrCreateCurrentSession,
  getOrCreateDocumentId,
  getPlanRecord,
  getSession,
  getSessionMessageCount,
  getTaskRecord,
  listPlanRecords,
  listReflectionEntries,
  listSessions,
  listTaskRecords,
  loadVfsFiles,
  type PlanRecord,
  type ReflectionEntry,
  renameSession,
  type StorageNamespace,
  savePlanRecord,
  saveReflectionEntry,
  saveSession,
  saveTaskRecord,
  saveVfsFiles,
  type TaskRecordEntry,
} from "./storage";
// Tools
export { bashTool } from "./tools/bash";
export { readTool } from "./tools/read-file";
export {
  defineTool,
  type ToolResult,
  toolError,
  toolSuccess,
  toolText,
} from "./tools/types";
// Truncation
export {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  truncateTail,
} from "./truncate";
export type {
  ActivePatternMetadata,
  ApprovalRequest,
  HandoffPacket,
  ScopeRiskEstimate,
  VerificationContext,
  VerificationResult,
  VerificationRunSummary,
  VerificationStatus,
  VerificationSuite,
} from "./verification";
// Verification
export { VerificationEngine } from "./verification";
// VFS
export {
  deleteFile,
  fileExists,
  getBash,
  getFileType,
  getSharedCustomCommands,
  getVfs,
  listUploads,
  readFile,
  readFileBuffer,
  resetVfs,
  restoreVfs,
  setCustomCommands,
  setSkillFiles,
  setStaticFiles,
  snapshotVfs,
  toBase64,
  writeFile,
} from "./vfs";
// Web
export { loadWebConfig, saveWebConfig, type WebConfig } from "./web/config";
export { fetchWeb, listFetchProviders } from "./web/fetch";
export {
  listImageSearchProviders,
  listSearchProviders,
  searchImages,
  searchWeb,
} from "./web/search";
export type {
  FetchProvider,
  FetchResult,
  ImageSearchOptions,
  ImageSearchProvider,
  ImageSearchResult,
  SearchOptions,
  SearchProvider,
  SearchResult,
  WebContext,
} from "./web/types";
