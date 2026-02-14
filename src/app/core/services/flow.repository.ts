import { Injectable } from '@angular/core';

import { FlowEntity } from '../../domain/entities/flow.entity';
import { FlowRepositoryPort } from '../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class FlowRepository extends FlowRepositoryPort {
  public getCurrentFlow(): FlowEntity {
    return {
      id: 'flow-main',
      name: 'Main flow',
      nodes: [
        { id: 'n1', label: 'Start' },
        { id: 'n2', label: 'Validate' }
      ]
    };
  }
}
