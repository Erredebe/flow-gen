import { Injectable, inject } from '@angular/core';

import { ExecutionEvent } from '../../domain/execution/execution-event.entity';
import { FlowRun } from '../../domain/execution/flow-run.entity';
import { RunRepositoryPort } from '../../domain/ports/run-repository.port';
import { safeParseJson } from '../utils/json.utils';
import { LocalStorageService } from './local-storage.service';

const STORAGE_KEY = 'flow-gen:runs:v1';

interface RunTraceStorage {
  events: ExecutionEvent[];
  snapshot: FlowRun | null;
}

interface RunsStorage {
  tracesByRunId: Record<string, RunTraceStorage>;
}

@Injectable({
  providedIn: 'root'
})
export class LocalRunRepository extends RunRepositoryPort {
  private readonly localStorageService = inject(LocalStorageService);

  public async appendEvent(event: ExecutionEvent): Promise<void> {
    const storage = this.readStorage();
    const existing = storage.tracesByRunId[event.runId] ?? { events: [], snapshot: null };
    storage.tracesByRunId[event.runId] = {
      ...existing,
      events: [...existing.events, event]
    };
    this.writeStorage(storage);
  }

  public async saveRunSnapshot(run: FlowRun): Promise<void> {
    const storage = this.readStorage();
    const existing = storage.tracesByRunId[run.runId] ?? { events: [], snapshot: null };
    storage.tracesByRunId[run.runId] = {
      ...existing,
      snapshot: run
    };
    this.writeStorage(storage);
  }

  public async getEventsByRunId(runId: string): Promise<ExecutionEvent[]> {
    const storage = this.readStorage();
    const trace = storage.tracesByRunId[runId];
    if (!trace) {
      return [];
    }

    return [...trace.events].sort((left, right) => left.sequence - right.sequence);
  }

  public async getRunSnapshot(runId: string): Promise<FlowRun | null> {
    const storage = this.readStorage();
    return storage.tracesByRunId[runId]?.snapshot ?? null;
  }

  public async listRunIds(): Promise<string[]> {
    const storage = this.readStorage();
    return Object.keys(storage.tracesByRunId).sort((left, right) => right.localeCompare(left));
  }

  private readStorage(): RunsStorage {
    const payload = this.localStorageService.getItem(STORAGE_KEY);
    if (!payload) {
      return { tracesByRunId: {} };
    }

    return safeParseJson<RunsStorage>(payload) ?? { tracesByRunId: {} };
  }

  private writeStorage(storage: RunsStorage): void {
    this.localStorageService.setItem(STORAGE_KEY, JSON.stringify(storage));
  }
}
