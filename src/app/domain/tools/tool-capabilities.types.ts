export type ToolExecutionMode = 'sync' | 'async';

export type ToolStreamingMode = 'none' | 'chunked';

export type ToolSideEffectLevel = 'none' | 'read' | 'write' | 'external';

export interface ToolCapabilities {
  executionMode: ToolExecutionMode;
  streaming: ToolStreamingMode;
  sideEffectLevel: ToolSideEffectLevel;
}
