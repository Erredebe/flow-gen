import { Injectable, inject } from '@angular/core';

import { createNode } from '../../domain/services/flow-node.service';
import { Flow, FlowNodeType } from '../../domain/flow/flow.types';
import { IdGenerator } from '../../domain/ports/id-generator.port';

export interface CreateNodeResult {
  flow: Flow;
  nodeId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreateNodeUseCase {
  private readonly idGenerator = inject(IdGenerator);

  public execute(flow: Flow, nodeType: FlowNodeType): CreateNodeResult {
    const nodeId = this.idGenerator.next(nodeType);
    const node = createNode({
      nodeType,
      nodeId,
      existingNodeCount: flow.nodes.length
    });

    return {
      nodeId,
      flow: {
        ...flow,
        nodes: [...flow.nodes, node]
      }
    };
  }
}
