import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class SaveFlowUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(flow: Flow): void {
    this.flowRepository.save(flow);
  }
}
