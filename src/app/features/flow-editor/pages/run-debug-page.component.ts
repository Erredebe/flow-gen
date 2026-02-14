import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExecutionEvent } from '../../../domain/execution/execution-event.entity';
import { FlowRun } from '../../../domain/execution/flow-run.entity';
import { RunRepositoryPort } from '../../../domain/ports/run-repository.port';

@Component({
  selector: 'app-run-debug-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './run-debug-page.component.html',
  styleUrl: './run-debug-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunDebugPageComponent {
  private readonly runRepository = inject(RunRepositoryPort);

  protected readonly runId = signal('');
  protected readonly availableRunIds = signal<string[]>([]);
  protected readonly events = signal<ExecutionEvent[]>([]);
  protected readonly snapshot = signal<FlowRun | null>(null);
  protected readonly error = signal<string | null>(null);

  public constructor() {
    void this.loadRunIds();
  }

  protected onRunIdChange(value: string): void {
    this.runId.set(value.trim());
  }

  protected async loadTrace(): Promise<void> {
    const currentRunId = this.runId();
    if (!currentRunId) {
      this.events.set([]);
      this.snapshot.set(null);
      this.error.set('Indica un runId para consultar su traza.');
      return;
    }

    const [events, snapshot] = await Promise.all([
      this.runRepository.getEventsByRunId(currentRunId),
      this.runRepository.getRunSnapshot(currentRunId)
    ]);

    this.events.set(events);
    this.snapshot.set(snapshot);
    this.error.set(events.length === 0 && !snapshot ? 'No se encontraron trazas para ese runId.' : null);
  }

  protected async onRunSelected(runId: string): Promise<void> {
    this.runId.set(runId);
    await this.loadTrace();
  }

  protected toJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private async loadRunIds(): Promise<void> {
    this.availableRunIds.set(await this.runRepository.listRunIds());
  }
}
