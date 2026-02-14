import { Injectable, inject } from '@angular/core';

import { ValidateFlowUseCase } from '../../application/flow/validate-flow.use-case';
import { AnyFlowNode, Flow } from '../../domain/flow/flow.types';
import {
  ExecutionCheckpointStore,
  ExecutionContext,
  ExecutionError,
  ExecutionResult,
  ExecutionStatus,
  NodeExecutionOutcome,
  NodeExecutionPolicy
} from './execution-state';
import { NodeExecutorPort } from '../ports/node-executor.port';

interface SchedulingGraph {
  nodesById: Map<string, AnyFlowNode>;
  incomingCount: Map<string, number>;
  dependents: Map<string, string[]>;
}

@Injectable({
  providedIn: 'root'
})
export class FlowExecutionEngine {
  private readonly validateFlowUseCase = inject(ValidateFlowUseCase);
  private readonly nodeExecutor = inject(NodeExecutorPort);

  public async run(flow: Flow, context: ExecutionContext): Promise<ExecutionResult> {
    const startedAt = new Date();
    const checkpoints = new ExecutionCheckpointStore();
    const outputs: Record<string, unknown> = {};
    let nodeExecutions = 0;
    let retries = 0;
    let timedOutNodes = 0;

    const validationErrors = this.validateFlowUseCase.execute(flow);
    if (validationErrors.length > 0) {
      return this.buildResult('validation_error', startedAt, {
        outputs,
        nodeExecutions,
        retries,
        timedOutNodes,
        error: {
          code: 'FLOW_VALIDATION_ERROR',
          message: validationErrors.map((error) => error.message).join('; ')
        }
      });
    }

    const graph = this.buildSchedulingGraph(flow);
    const readyQueue = Array.from(graph.incomingCount.entries())
      .filter(([, count]) => count === 0)
      .map(([nodeId]) => nodeId);
    let processedNodes = 0;

    while (readyQueue.length > 0) {
      const nodeId = readyQueue.shift();
      if (!nodeId) {
        continue;
      }

      const node = graph.nodesById.get(nodeId);
      if (!node) {
        continue;
      }

      const policy = this.extractNodePolicy(node);

      if (policy.idempotencyKey && checkpoints.has(node.id)) {
        const previous = checkpoints.get(node.id);
        if (previous) {
          outputs[node.id] = previous.outputs;
        }
      } else {
        const upstreamOutputs = this.collectUpstreamOutputs(flow, node.id, outputs);
        const execution = await this.executeNodeWithPolicy(node, context, upstreamOutputs, policy);

        retries += execution.retries;
        timedOutNodes += execution.timedOut ? 1 : 0;

        if (execution.error) {
          return this.buildResult(execution.status, startedAt, {
            outputs,
            nodeExecutions,
            retries,
            timedOutNodes,
            error: execution.error
          });
        }

        nodeExecutions += 1;
        outputs[node.id] = execution.outcome?.outputs ?? {};
        checkpoints.save({
          nodeId: node.id,
          outputs: execution.outcome?.outputs ?? {},
          executedAt: new Date().toISOString(),
          idempotencyKey: policy.idempotencyKey
        });
      }

      processedNodes += 1;
      const dependents = graph.dependents.get(node.id) ?? [];
      for (const dependentId of dependents) {
        const currentIn = graph.incomingCount.get(dependentId) ?? 0;
        const nextIn = currentIn - 1;
        graph.incomingCount.set(dependentId, nextIn);
        if (nextIn === 0) {
          readyQueue.push(dependentId);
        }
      }
    }

    if (processedNodes !== flow.nodes.length) {
      return this.buildResult('failed', startedAt, {
        outputs,
        nodeExecutions,
        retries,
        timedOutNodes,
        error: {
          code: 'FLOW_SCHEDULING_ERROR',
          message: 'No se pudieron procesar todos los nodos del DAG.'
        }
      });
    }

    return this.buildResult('success', startedAt, { outputs, nodeExecutions, retries, timedOutNodes });
  }

  private async executeNodeWithPolicy(
    node: AnyFlowNode,
    context: ExecutionContext,
    upstreamOutputs: Record<string, unknown>,
    policy: NodeExecutionPolicy
  ): Promise<{
    status: ExecutionStatus;
    outcome?: NodeExecutionOutcome;
    error?: ExecutionError;
    retries: number;
    timedOut: boolean;
  }> {
    if (!this.nodeExecutor.canExecute(node)) {
      return {
        status: 'failed',
        retries: 0,
        timedOut: false,
        error: {
          code: 'NODE_EXECUTOR_NOT_FOUND',
          message: `No hay ejecutor para el nodo ${node.id}.`,
          nodeId: node.id
        }
      };
    }

    const maxRetries = Math.max(0, policy.retryPolicy?.maxRetries ?? 0);
    const backoffMs = Math.max(0, policy.retryPolicy?.backoffMs ?? 0);

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const executionPromise = this.nodeExecutor.execute({ node, context, upstreamOutputs, policy });
        const outcome = policy.timeoutMs
          ? await this.withTimeout(executionPromise, policy.timeoutMs)
          : await executionPromise;

        return { status: 'success', outcome, retries: attempt, timedOut: false };
      } catch (error) {
        const normalizedError = this.normalizeError(error, node.id);
        const shouldRetry = normalizedError.recoverable === true && attempt < maxRetries;
        if (shouldRetry) {
          if (backoffMs > 0) {
            await this.sleep(backoffMs);
          }
          continue;
        }

        return {
          status: normalizedError.code === 'NODE_TIMEOUT' ? 'timeout' : 'failed',
          retries: attempt,
          timedOut: normalizedError.code === 'NODE_TIMEOUT',
          error: normalizedError
        };
      }
    }

    return {
      status: 'failed',
      retries: maxRetries,
      timedOut: false,
      error: {
        code: 'NODE_EXECUTION_UNKNOWN',
        message: `Error desconocido ejecutando nodo ${node.id}.`,
        nodeId: node.id
      }
    };
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutRef = setTimeout(() => {
        reject({ code: 'NODE_TIMEOUT', message: `Node execution timed out (${timeoutMs}ms).`, recoverable: false });
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timeoutRef);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeoutRef);
          reject(error);
        });
    });
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }

  private normalizeError(error: unknown, nodeId: string): ExecutionError {
    if (error instanceof Error) {
      return {
        code: 'NODE_EXECUTION_ERROR',
        message: error.message,
        nodeId,
        recoverable: false,
        cause: error
      };
    }

    if (typeof error === 'object' && error !== null) {
      const candidate = error as Partial<ExecutionError>;
      return {
        code: candidate.code ?? 'NODE_EXECUTION_ERROR',
        message: candidate.message ?? `Error ejecutando nodo ${nodeId}.`,
        nodeId: candidate.nodeId ?? nodeId,
        recoverable: candidate.recoverable ?? false,
        cause: candidate.cause
      };
    }

    return {
      code: 'NODE_EXECUTION_ERROR',
      message: `Error ejecutando nodo ${nodeId}.`,
      nodeId,
      recoverable: false,
      cause: error
    };
  }

  private collectUpstreamOutputs(flow: Flow, nodeId: string, outputs: Record<string, unknown>): Record<string, unknown> {
    const upstreamNodeIds = flow.edges.filter((edge) => edge.targetNodeId === nodeId).map((edge) => edge.sourceNodeId);
    return upstreamNodeIds.reduce<Record<string, unknown>>((acc, upstreamId) => {
      acc[upstreamId] = outputs[upstreamId] ?? null;
      return acc;
    }, {});
  }

  private buildSchedulingGraph(flow: Flow): SchedulingGraph {
    const nodesById = new Map(flow.nodes.map((node) => [node.id, node]));
    const incomingCount = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of flow.nodes) {
      incomingCount.set(node.id, 0);
      dependents.set(node.id, []);
    }

    for (const edge of flow.edges) {
      incomingCount.set(edge.targetNodeId, (incomingCount.get(edge.targetNodeId) ?? 0) + 1);
      dependents.set(edge.sourceNodeId, [...(dependents.get(edge.sourceNodeId) ?? []), edge.targetNodeId]);
    }

    return { nodesById, incomingCount, dependents };
  }

  private extractNodePolicy(node: AnyFlowNode): NodeExecutionPolicy {
    const metadata = node.metadata ?? {};
    const timeoutMs = this.toNumber(metadata.timeoutMs);
    const retryMax = this.toNumber(metadata.retryMax);
    const retryBackoffMs = this.toNumber(metadata.retryBackoffMs);
    const idempotencyKey = metadata.idempotencyKey;

    return {
      timeoutMs,
      retryPolicy: retryMax !== undefined ? { maxRetries: retryMax, backoffMs: retryBackoffMs } : undefined,
      idempotencyKey
    };
  }

  private toNumber(value: string | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private buildResult(
    status: ExecutionStatus,
    startedAt: Date,
    payload: {
      outputs: Record<string, unknown>;
      nodeExecutions: number;
      retries: number;
      timedOutNodes: number;
      error?: ExecutionError;
    }
  ): ExecutionResult {
    const finishedAt = new Date();
    return {
      status,
      outputs: payload.outputs,
      error: payload.error,
      metrics: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
        nodeExecutions: payload.nodeExecutions,
        retries: payload.retries,
        timedOutNodes: payload.timedOutNodes
      }
    };
  }
}
