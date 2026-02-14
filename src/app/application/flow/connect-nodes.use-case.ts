import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { IdGenerator } from '../../domain/ports/id-generator.port';
import { connectNodes } from '../../domain/services/flow-graph.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectNodesUseCase {
  private readonly idGenerator = inject(IdGenerator);

  public execute(flow: Flow, sourceNodeId: string, targetNodeId: string): Flow {
    const edgeId = this.idGenerator.next('edge');
    return connectNodes(flow, edgeId, sourceNodeId, targetNodeId);
  }
}
