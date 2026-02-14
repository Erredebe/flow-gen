import { Injectable, inject } from '@angular/core';

import { LoadFlowUseCase } from '../flow/load-flow.use-case';
import { SaveFlowUseCase } from '../flow/save-flow.use-case';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';

const DEFAULT_FLOW: Flow = {
  id: 'flow-example',
  name: 'Flujo de ejemplo',
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    { id: 'start', label: 'Inicio', nodeType: 'start', position: { x: 100, y: 180 }, metadata: {}, version: '1.0.0', config: {} },
    {
      id: 'action-1',
      label: 'Validar solicitud',
      nodeType: 'action',
      position: { x: 380, y: 180 },
      metadata: { owner: 'ops', command: 'Paso de validación base' },
      version: '1.0.0',
      config: {}
    },
    {
      id: 'function-1',
      label: 'Transformar texto (función)',
      nodeType: 'function-node',
      position: { x: 680, y: 60 },
      metadata: { note: 'Ejemplo de función local' },
      version: '1.0.0',
      config: {
        toolName: 'helpers.to-upper-case',
        text: 'flujo inicial'
      }
    },
    {
      id: 'tool-console',
      label: 'Ejecutar console.log',
      nodeType: 'tool-node',
      position: { x: 680, y: 180 },
      metadata: { command: 'console.log' },
      version: '1.0.0',
      config: {
        toolName: 'browser.console.log',
        message: 'Ejemplo inicial: mensaje desde nodo tool-node'
      }
    },
    {
      id: 'tool-alert',
      label: 'Ejecutar alert',
      nodeType: 'tool-node',
      position: { x: 680, y: 300 },
      metadata: { command: 'alert' },
      version: '1.0.0',
      config: {
        toolName: 'browser.alert',
        message: 'Ejemplo inicial: alerta disparada por el flujo'
      }
    },
    {
      id: 'decision-1',
      label: '¿Aprobada?',
      nodeType: 'decision',
      position: { x: 1020, y: 180 },
      condition: 'monto <= límite',
      metadata: {}, version: '1.0.0', config: {}
    },
    { id: 'end-ok', label: 'Final exitoso', nodeType: 'end', position: { x: 1320, y: 80 }, metadata: {}, version: '1.0.0', config: {} },
    { id: 'end-ko', label: 'Final rechazado', nodeType: 'end', position: { x: 1320, y: 300 }, metadata: {}, version: '1.0.0', config: {} }
  ],
  edges: [
    { id: 'edge-1', sourceNodeId: 'start', targetNodeId: 'action-1' },
    { id: 'edge-2', sourceNodeId: 'action-1', targetNodeId: 'function-1' },
    { id: 'edge-3', sourceNodeId: 'function-1', targetNodeId: 'tool-console' },
    { id: 'edge-4', sourceNodeId: 'tool-console', targetNodeId: 'tool-alert' },
    { id: 'edge-5', sourceNodeId: 'tool-alert', targetNodeId: 'decision-1' },
    { id: 'edge-6', sourceNodeId: 'decision-1', targetNodeId: 'end-ok', branch: 'true' },
    { id: 'edge-7', sourceNodeId: 'decision-1', targetNodeId: 'end-ko', branch: 'false' }
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
