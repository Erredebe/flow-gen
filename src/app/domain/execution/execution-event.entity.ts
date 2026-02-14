export type ExecutionEventType =
  | 'RUN_STARTED'
  | 'NODE_STARTED'
  | 'NODE_SUCCEEDED'
  | 'NODE_FAILED'
  | 'RUN_FINISHED';

export interface ExecutionEvent {
  runId: string;
  sequence: number;
  type: ExecutionEventType;
  occurredAt: string;
  nodeId?: string;
  payload?: Record<string, unknown>;
}
