import { Injectable } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { deleteNode } from '../../domain/services/flow-graph.service';

@Injectable({
  providedIn: 'root'
})
export class DeleteNodeUseCase {
  public execute(flow: Flow, nodeId: string): Flow {
    return deleteNode(flow, nodeId);
  }
}
