import { Injectable, inject } from '@angular/core';

import { FlowRepository } from '../../core/services/flow.repository';
import { FlowEntity } from '../../domain/entities/flow.entity';

@Injectable({
  providedIn: 'root'
})
export class ExportFlowToJsonUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(): FlowEntity {
    return this.flowRepository.getCurrentFlow();
  }
}
