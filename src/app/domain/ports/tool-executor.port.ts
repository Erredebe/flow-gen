import { ToolExecutionError, ToolExecutionRequest, ToolExecutionResult } from '../tools/tool.contract';

export interface ToolExecutionCommand {
  toolName: string;
  request: ToolExecutionRequest;
}

export abstract class ToolExecutorPort {
  public abstract execute(command: ToolExecutionCommand): Promise<ToolExecutionResult>;
  public abstract normalizeError(error: unknown, toolName: string): ToolExecutionError;
}
