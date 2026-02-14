import { ExecutionEvent } from '../execution/execution-event.entity';
import { FlowRun } from '../execution/flow-run.entity';

export abstract class RunRepositoryPort {
  public abstract appendEvent(event: ExecutionEvent): Promise<void>;

  public abstract saveRunSnapshot(run: FlowRun): Promise<void>;

  public abstract getEventsByRunId(runId: string): Promise<ExecutionEvent[]>;

  public abstract getRunSnapshot(runId: string): Promise<FlowRun | null>;

  public abstract listRunIds(): Promise<string[]>;
}
