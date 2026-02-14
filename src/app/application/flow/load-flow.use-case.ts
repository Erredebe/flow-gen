import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class LoadFlowUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(): Flow | null {
    return this.flowRepository.load();
  }
}
