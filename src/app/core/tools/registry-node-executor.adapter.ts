import { Injectable, inject } from '@angular/core';

import { NodeDefinitionRegistry } from '../../domain/ports/node-definition-registry.port';
import { ToolExecutorPort } from '../../domain/ports/tool-executor.port';
import { AnyFlowNode } from '../../domain/flow/flow.types';
import { NodeExecutorPort } from '../../runtime/ports/node-executor.port';
import { NodeExecutionData, NodeExecutionOutcome } from '../../runtime/engine/execution-state';

@Injectable({
  providedIn: 'root'
})
export class RegistryNodeExecutorAdapter extends NodeExecutorPort {
  private readonly nodeDefinitionRegistry = inject(NodeDefinitionRegistry);
  private readonly toolExecutor = inject(ToolExecutorPort);

  public override canExecute(node: AnyFlowNode): boolean {
    const runtimeKind = this.nodeDefinitionRegistry.getDefinition(node.nodeType)?.runtimeKind;
    if (this.isToolBackedNode(node, runtimeKind)) {
      return typeof node.config['toolName'] === 'string';
    }

    return true;
  }

  public override async execute(data: NodeExecutionData): Promise<NodeExecutionOutcome> {
    const runtimeKind = this.nodeDefinitionRegistry.getDefinition(data.node.nodeType)?.runtimeKind;
    if (this.isToolBackedNode(data.node, runtimeKind)) {
      const toolName = data.node.config['toolName'];
      if (typeof toolName !== 'string') {
        throw {
          code: 'INVALID_TOOL_REFERENCE',
          message: `El nodo ${data.node.id} no define config.toolName válido.`,
          recoverable: false
        };
      }

      const result = await this.toolExecutor.execute({
        toolName,
        request: {
          input: {
            config: data.node.config,
            upstreamOutputs: data.upstreamOutputs,
            context: data.context
          }
        }
      });

      return { outputs: this.toRecord(result.output) };
    }

    return {
      outputs: {
        nodeId: data.node.id,
        passthrough: true,
        upstreamOutputs: data.upstreamOutputs
      }
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return { value };
  }

  private isToolBackedNode(node: AnyFlowNode, runtimeKind?: string): boolean {
    return runtimeKind === 'tool' || runtimeKind === 'function' || typeof node.config['toolName'] === 'string';
  }
}
