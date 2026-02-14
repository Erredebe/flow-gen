import { Injectable, inject } from '@angular/core';

import { LoadFlowUseCase } from '../flow/load-flow.use-case';
import { SaveFlowUseCase } from '../flow/save-flow.use-case';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';

const DEFAULT_FLOW: Flow = {
  id: 'flow-example',
  name: 'Flujo de ejemplo completo (todos los nodos)',
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: 'start',
      label: 'Inicio del flujo',
      nodeType: 'start',
      position: { x: 100, y: 180 },
      metadata: {
        guide: 'Nodo trigger. Úsalo para arrancar cualquier flujo; debe tener una salida hacia otro nodo.'
      },
      version: '1.0.0',
      config: {
        onboarding: 'Este nodo no requiere input. Es el punto único de entrada del diagrama.'
      }
    },
    {
      id: 'action-1',
      label: 'Validar solicitud',
      nodeType: 'action',
      position: { x: 380, y: 180 },
      metadata: {
        owner: 'ops',
        guide: 'Nodo action para tareas de negocio como validaciones, enriquecimiento y reglas simples.'
      },
      version: '1.0.0',
      config: {
        purpose: 'Valida campos obligatorios y prepara variables compartidas para nodos siguientes.',
        recommendedInput: 'payload de solicitud',
        recommendedOutput: 'payload enriquecido + flags de validación'
      }
    },
    {
      id: 'function-1',
      label: 'Transformar texto (función)',
      nodeType: 'function-node',
      position: { x: 680, y: 60 },
      metadata: {
        guide: 'Usa function-node para ejecutar lógica reutilizable registrada como herramienta local.'
      },
      version: '1.0.0',
      config: {
        toolName: 'helpers.to-upper-case',
        text: 'flujo inicial con todos los tipos de nodo',
        expectedResult: 'Devuelve el texto en mayúsculas y puede ser consumido por nodos posteriores'
      }
    },
    {
      id: 'function-sum',
      label: 'Sumar 1 + 1 (función)',
      nodeType: 'function-node',
      position: { x: 680, y: 180 },
      metadata: {
        guide: 'También puedes declarar la función en config.function para prototipar rápidamente.'
      },
      version: '1.0.0',
      config: {
        toolName: 'browser.json-command',
        function:
          '({ config }) => ({ result: 1 + 1, operation: "1 + 1", explanation: "Demuestra cálculo interno en function-node" })'
      }
    },
    {
      id: 'tool-console',
      label: 'Ejecutar console.log',
      nodeType: 'tool-node',
      position: { x: 680, y: 300 },
      metadata: {
        guide: 'Tool-node para integraciones: APIs, logs, colas y utilidades externas.'
      },
      version: '1.0.0',
      config: {
        toolName: 'browser.json-command',
        message: 'Ejemplo inicial: mensaje desde JSON del nodo',
        usage: 'Lee valores de config y devuelve un objeto de salida.',
        command:
          "console.log('[flow-gen:default]', config.message); return { logged: true, message: config.message };"
      }
    },
    {
      id: 'tool-alert',
      label: 'Ejecutar alert',
      nodeType: 'tool-node',
      position: { x: 680, y: 420 },
      metadata: {
        guide: 'Segundo tool-node para mostrar side-effects en cliente.'
      },
      version: '1.0.0',
      config: {
        toolName: 'browser.json-command',
        message: 'Ejemplo inicial: alerta disparada desde JSON del nodo',
        command:
          "if (typeof globalThis.alert === 'function') { globalThis.alert(config.message); } return { alerted: true, message: config.message };"
      }
    },
    {
      id: 'decision-1',
      label: '¿Aprobada?',
      nodeType: 'decision',
      position: { x: 1020, y: 180 },
      condition: 'monto <= límite',
      metadata: {
        guide: 'Nodo de decisión. Usa ramas true/false con edge.branch para dirigir el recorrido.'
      },
      version: '1.0.0',
      config: {
        expression: 'input.monto <= variables.limite'
      }
    },
    {
      id: 'end-ok',
      label: 'Final exitoso',
      nodeType: 'end',
      position: { x: 1320, y: 80 },
      metadata: {
        guide: 'Nodo terminal para cierre exitoso. No tiene salidas.'
      },
      version: '1.0.0',
      config: { reason: 'aprobado' }
    },
    {
      id: 'end-ko',
      label: 'Final rechazado',
      nodeType: 'end',
      position: { x: 1320, y: 300 },
      metadata: {
        guide: 'Nodo terminal alternativo para escenarios negativos o rechazados.'
      },
      version: '1.0.0',
      config: { reason: 'rechazado' }
    }
  ],
  edges: [
    { id: 'edge-1', sourceNodeId: 'start', targetNodeId: 'action-1' },
    { id: 'edge-2', sourceNodeId: 'action-1', targetNodeId: 'function-1' },
    { id: 'edge-3', sourceNodeId: 'function-1', targetNodeId: 'function-sum' },
    { id: 'edge-4', sourceNodeId: 'function-sum', targetNodeId: 'tool-console' },
    { id: 'edge-5', sourceNodeId: 'tool-console', targetNodeId: 'tool-alert' },
    { id: 'edge-6', sourceNodeId: 'tool-alert', targetNodeId: 'decision-1' },
    { id: 'edge-7', sourceNodeId: 'decision-1', targetNodeId: 'end-ok', branch: 'true' },
    { id: 'edge-8', sourceNodeId: 'decision-1', targetNodeId: 'end-ko', branch: 'false' }
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
