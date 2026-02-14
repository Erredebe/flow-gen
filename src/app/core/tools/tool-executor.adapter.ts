import { Injectable, inject } from '@angular/core';

import { ToolExecutorPort, ToolExecutionCommand } from '../../domain/ports/tool-executor.port';
import { ToolExecutionError, ToolExecutionResult } from '../../domain/tools/tool.contract';
import { ToolRegistryPort } from '../../domain/ports/tool-registry.port';

@Injectable({
  providedIn: 'root'
})
export class ToolExecutorAdapter extends ToolExecutorPort {
  private readonly toolRegistry = inject(ToolRegistryPort);

  public override async execute(command: ToolExecutionCommand): Promise<ToolExecutionResult> {
    const tool = this.toolRegistry.getByName(command.toolName);
    if (!tool) {
      throw this.normalizeError({
        code: 'TOOL_NOT_FOUND',
        message: `Tool "${command.toolName}" no está registrada.`,
        recoverable: false
      }, command.toolName);
    }

    try {
      return await tool.execute(command.request);
    } catch (error) {
      throw this.normalizeError(error, command.toolName);
    }
  }

  public override normalizeError(error: unknown, toolName: string): ToolExecutionError {
    if (error instanceof Error) {
      return {
        code: 'TOOL_EXECUTION_ERROR',
        message: error.message,
        recoverable: false,
        details: { toolName, cause: error }
      };
    }

    if (typeof error === 'object' && error !== null) {
      const candidate = error as Partial<ToolExecutionError>;
      return {
        code: candidate.code ?? 'TOOL_EXECUTION_ERROR',
        message: candidate.message ?? `Tool "${toolName}" falló durante la ejecución.`,
        recoverable: candidate.recoverable ?? false,
        details: candidate.details
      };
    }

    return {
      code: 'TOOL_EXECUTION_ERROR',
      message: `Tool "${toolName}" falló durante la ejecución.`,
      recoverable: false,
      details: { cause: error }
    };
  }
}
