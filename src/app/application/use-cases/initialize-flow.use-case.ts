import { Injectable, inject } from '@angular/core';

import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

const DEFAULT_FLOW: Flow = {
  id: 'flow-example',
  name: 'Flujo de ejemplo',
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    { id: 'start', label: 'Inicio', type: 'start' },
    { id: 'action-1', label: 'Validar solicitud', type: 'action' },
    { id: 'decision-1', label: '¿Aprobada?', type: 'decision' },
    { id: 'end-ok', label: 'Final exitoso', type: 'end' },
    { id: 'end-ko', label: 'Final rechazado', type: 'end' }
  ],
  edges: [
    { id: 'edge-1', sourceNodeId: 'start', targetNodeId: 'action-1' },
    { id: 'edge-2', sourceNodeId: 'action-1', targetNodeId: 'decision-1' },
    { id: 'edge-3', sourceNodeId: 'decision-1', targetNodeId: 'end-ok', branch: 'true' },
    { id: 'edge-4', sourceNodeId: 'decision-1', targetNodeId: 'end-ko', branch: 'false' }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class InitializeFlowUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(): Flow {
    const savedFlow = this.flowRepository.load();
    if (savedFlow) {
      return savedFlow;
    }

    this.flowRepository.save(DEFAULT_FLOW);
    return DEFAULT_FLOW;
  }
}
