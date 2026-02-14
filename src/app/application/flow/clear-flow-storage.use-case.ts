import { Injectable, inject } from '@angular/core';

import { FlowRepository } from '../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class ClearFlowStorageUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(): void {
    this.flowRepository.clear();
  }
}
