import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { FlowMigrationPipeline } from '../../domain/flow/migrations/flow-migration.pipeline';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class LoadFlowUseCase {
  private readonly flowRepository = inject(FlowRepository);
  private readonly flowMigrationPipeline = inject(FlowMigrationPipeline);

  public execute(): Flow | null {
    const storedFlow = this.flowRepository.load();
    if (!storedFlow) {
      return null;
    }

    return this.flowMigrationPipeline.migrate(storedFlow);
  }
}
