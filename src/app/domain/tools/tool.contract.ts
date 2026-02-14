import { JsonObject } from '../flow/flow.types';
import { ToolCapabilities } from './tool-capabilities.types';

export interface ToolExecutionRequest {
  input: unknown;
  context?: Readonly<Record<string, unknown>>;
}

export interface ToolExecutionResult {
  output: unknown;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ToolExecutionError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: unknown;
}

export interface ToolContract {
  name: string;
  description: string;
  inputSchema: JsonObject;
  outputSchema: JsonObject;
  capabilities: ToolCapabilities;
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
}
