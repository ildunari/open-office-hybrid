export type GatewayCapability =
  | "observe"
  | "tool_call"
  | "document_edit"
  | "unsafe_office_js"
  | "vfs_access";

export interface GatewayDocumentMetadata {
  metadata: object;
  nameMap?: Record<number, string>;
}

export interface GatewaySelectionContext {
  hasSelection: boolean;
  selectedText?: string;
  selectedStyle?: string;
}

export interface GatewayLiveContext {
  selection?: GatewaySelectionContext | null;
  trackingMode?: string | null;
  documentTitle?: string | null;
  focusTarget?: string | null;
  updatedAt: number;
}

export interface GatewayHostAdapter {
  metadataTag?: string;
  getDocumentId: () => Promise<string>;
  getDocumentMetadata?: () => Promise<GatewayDocumentMetadata | null>;
  getLiveContext?:
    | (() => Promise<GatewayLiveContext | null>)
    | (() => GatewayLiveContext | null);
  getCapabilities?:
    | (() => Promise<GatewayCapability[] | readonly GatewayCapability[]>)
    | (() => GatewayCapability[] | readonly GatewayCapability[]);
  onToolResult?: (toolCallId: string, result: string, isError: boolean) => void;
  bridgeEventSink?: (event: string, payload: Record<string, unknown>) => void;
  getRuntimeState?: () => unknown | null;
}
