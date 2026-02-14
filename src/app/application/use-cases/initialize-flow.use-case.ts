import { Injectable, inject } from '@angular/core';

import { LoadFlowUseCase } from '../flow/load-flow.use-case';
import { SaveFlowUseCase } from '../flow/save-flow.use-case';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';

const DEFAULT_FLOW: Flow = {
  id: 'flow-example',
  name: 'Flujo de ejemplo',
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    { id: 'start', label: 'Inicio', type: 'start', position: { x: 100, y: 180 }, metadata: {} },
    {
      id: 'action-1',
      label: 'Validar solicitud',
      type: 'action',
      position: { x: 380, y: 180 },
      metadata: { owner: 'ops' }
    },
    {
      id: 'decision-1',
      label: '¿Aprobada?',
      type: 'decision',
      position: { x: 680, y: 180 },
      condition: 'monto <= límite',
      metadata: {}
    },
    { id: 'end-ok', label: 'Final exitoso', type: 'end', position: { x: 980, y: 80 }, metadata: {} },
    { id: 'end-ko', label: 'Final rechazado', type: 'end', position: { x: 980, y: 300 }, metadata: {} }
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
  private readonly loadFlowUseCase = inject(LoadFlowUseCase);
  private readonly saveFlowUseCase = inject(SaveFlowUseCase);

  public execute(): Flow {
    const savedFlow = this.loadFlowUseCase.execute();
    if (savedFlow) {
      return savedFlow;
    }

    this.saveFlowUseCase.execute(DEFAULT_FLOW);
    return DEFAULT_FLOW;
  }
}
