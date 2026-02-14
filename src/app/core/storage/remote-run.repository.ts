import { Injectable } from '@angular/core';

import { ExecutionEvent } from '../../domain/execution/execution-event.entity';
import { FlowRun } from '../../domain/execution/flow-run.entity';
import { RunRepositoryPort } from '../../domain/ports/run-repository.port';

@Injectable({
  providedIn: 'root'
})
export class RemoteRunRepository extends RunRepositoryPort {
  public async appendEvent(_event: ExecutionEvent): Promise<void> {
    return Promise.resolve();
  }

  public async saveRunSnapshot(_run: FlowRun): Promise<void> {
    return Promise.resolve();
  }

  public async getEventsByRunId(_runId: string): Promise<ExecutionEvent[]> {
    return Promise.resolve([]);
  }

  public async getRunSnapshot(_runId: string): Promise<FlowRun | null> {
    return Promise.resolve(null);
  }

  public async listRunIds(): Promise<string[]> {
    return Promise.resolve([]);
  }
}
