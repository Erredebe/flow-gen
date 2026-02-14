import { AnyFlowNode } from '../../domain/flow/flow.types';

export type ExecutionStatus = 'success' | 'failed' | 'timeout' | 'validation_error';

export interface ExecutionContext {
  input: Record<string, unknown>;
  variables: Record<string, unknown>;
  secretReferences: ReadonlyArray<string>;
  traceId: string;
  runId: string;
}

export interface ExecutionError {
  code: string;
  message: string;
  nodeId?: string;
  recoverable?: boolean;
  cause?: unknown;
}

export interface ExecutionMetrics {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  nodeExecutions: number;
  retries: number;
  timedOutNodes: number;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  outputs: Record<string, unknown>;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs?: number;
}

export interface NodeExecutionPolicy {
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  idempotencyKey?: string;
}

export interface NodeCheckpoint {
  nodeId: string;
  outputs: Record<string, unknown>;
  executedAt: string;
  idempotencyKey?: string;
}

export class ExecutionCheckpointStore {
  private readonly checkpoints = new Map<string, NodeCheckpoint>();

  public get(nodeId: string): NodeCheckpoint | undefined {
    return this.checkpoints.get(nodeId);
  }

  public save(checkpoint: NodeCheckpoint): void {
    this.checkpoints.set(checkpoint.nodeId, checkpoint);
  }

  public has(nodeId: string): boolean {
    return this.checkpoints.has(nodeId);
  }

  public entries(): ReadonlyArray<NodeCheckpoint> {
    return Array.from(this.checkpoints.values());
  }
}

export interface NodeExecutionData {
  node: AnyFlowNode;
  context: ExecutionContext;
  upstreamOutputs: Record<string, unknown>;
  policy: NodeExecutionPolicy;
}

export interface NodeExecutionOutcome {
  outputs: Record<string, unknown>;
}
