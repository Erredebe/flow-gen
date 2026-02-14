import { ExecutionStatus } from '../../runtime/engine/execution-state';

export interface NodeRun {
  nodeId: string;
  status: Exclude<ExecutionStatus, 'validation_error'>;
  startedAt: string;
  finishedAt: string;
  retries: number;
  timedOut: boolean;
  outputs?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}
