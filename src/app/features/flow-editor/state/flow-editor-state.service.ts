import { Injectable, effect, inject, signal } from '@angular/core';

import { ExportFlowToJsonUseCase } from '../../../application/use-cases/export-flow-to-json.use-case';
import {
  ImportFlowFailure,
  ImportFlowFromJsonUseCase,
  ImportFlowSuccess
} from '../../../application/use-cases/import-flow-from-json.use-case';
import { InitializeFlowUseCase } from '../../../application/use-cases/initialize-flow.use-case';
import { Flow } from '../../../domain/flow/flow.types';
import { FlowRepository } from '../../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorStateService {
  private readonly initializeFlowUseCase = inject(InitializeFlowUseCase);
  private readonly importFlowFromJsonUseCase = inject(ImportFlowFromJsonUseCase);
  private readonly exportFlowToJsonUseCase = inject(ExportFlowToJsonUseCase);
  private readonly flowRepository = inject(FlowRepository);

  private readonly draft = signal<Flow>(this.initializeFlowUseCase.execute());

  public constructor() {
    effect(() => {
      const flow = this.draft();
      this.flowRepository.save(flow);
    });
  }

  public getDraft(): Flow {
    return this.draft();
  }

  public getDraftJson(): string {
    return this.exportFlowToJsonUseCase.execute(this.draft());
  }

  public renameFlow(name: string): void {
    this.draft.update((flow) => ({
      ...flow,
      name
    }));
  }

  public replaceFlow(flow: Flow): void {
    this.draft.set(flow);
  }

  public importFromJson(payload: string): ImportFlowSuccess | ImportFlowFailure {
    const result = this.importFlowFromJsonUseCase.execute(payload);
    if (result.success) {
      this.draft.set(result.flow);
    }

    return result;
  }
}
