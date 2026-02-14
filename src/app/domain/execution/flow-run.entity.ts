import { ExecutionStatus } from '../../runtime/engine/execution-state';
import { NodeRun } from './node-run.entity';

export interface FlowRun {
  runId: string;
  flowId: string;
  traceId: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string;
  outputs: Record<string, unknown>;
  nodeRuns: NodeRun[];
  errorCode?: string;
  errorMessage?: string;
}
