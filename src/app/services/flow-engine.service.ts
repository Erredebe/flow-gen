import { Injectable } from '@angular/core';
import { ExecutionLog, ExecutionResult, FlowDefinition, FlowNode } from '../models/flow.model';

@Injectable({ providedIn: 'root' })
export class FlowEngineService {
  async execute(flow: FlowDefinition): Promise<ExecutionResult> {
    const logs: ExecutionLog[] = [];
    const visitedNodeIds: string[] = [];
    const failedNodeIds = new Set<string>();
    const context: Record<string, unknown> = {};

    const start = flow.nodes.find((node) => node.type === 'start');
    if (!start) {
      return {
        logs: [{ level: 'error', message: 'No se encontró nodo Inicio.', timestamp: new Date().toISOString() }],
        visitedNodeIds,
        failedNodeIds: [],
        status: 'failed'
      };
    }

    let currentNode: FlowNode | undefined = start;
    let safetyCounter = 0;

    while (currentNode) {
      safetyCounter += 1;
      if (safetyCounter > 200) {
        logs.push(this.log('warning', 'Detención por posible bucle infinito.'));
        return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed' };
      }

      visitedNodeIds.push(currentNode.id);
      logs.push(this.log('info', `Ejecutando nodo ${currentNode.data.label} (${currentNode.type}).`));

      if (currentNode.type === 'script' && currentNode.data.script) {
        try {
          const scriptFn = new Function('context', currentNode.data.script);
          const scriptResult = scriptFn(context);
          logs.push(this.log('info', `Resultado script: ${JSON.stringify(scriptResult)}`));
        } catch (error) {
          logs.push(this.log('error', `Error de script: ${String(error)}`));
          failedNodeIds.add(currentNode.id);
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed' };
        }
      }

      if (currentNode.type === 'api' && currentNode.data.apiUrl) {
        try {
          const response = await fetch(currentNode.data.apiUrl, {
            method: currentNode.data.apiMethod ?? 'GET',
            body: currentNode.data.apiMethod === 'POST' ? currentNode.data.apiBody : undefined,
            headers: { 'Content-Type': 'application/json' }
          });
          logs.push(this.log('info', `API status: ${response.status}`));
          context['lastApiStatus'] = response.status;
        } catch (error) {
          logs.push(this.log('error', `Error API: ${String(error)}`));
          failedNodeIds.add(currentNode.id);
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed' };
        }
      }

      if (currentNode.type === 'end') {
        logs.push(this.log('info', 'Flujo completado.'));
        return { logs, visitedNodeIds, failedNodeIds: [], status: 'completed' };
      }

      const outgoing = flow.connections.filter((connection) => connection.fromNodeId === currentNode?.id);

      if (currentNode.type === 'decision') {
        let decisionResult = false;
        try {
          const expression: string = currentNode.data.condition || 'false';
          const conditionFn: (context: Record<string, unknown>) => unknown = new Function('context', `return (${expression});`) as (context: Record<string, unknown>) => unknown;
          decisionResult = Boolean(conditionFn(context));
        } catch (error) {
          logs.push(this.log('error', `Error en condición: ${String(error)}`));
          failedNodeIds.add(currentNode.id);
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed' };
        }

        logs.push(this.log('info', `Decisión: ${decisionResult ? 'true' : 'false'}`));
        const chosen: { toNodeId: string } | undefined = outgoing.find((connection) => connection.fromPort === (decisionResult ? 'true' : 'false'));
        currentNode = flow.nodes.find((node) => node.id === chosen?.toNodeId);
        continue;
      }

      const next = outgoing.find((connection) => connection.fromPort === 'default') ?? outgoing[0];
      currentNode = flow.nodes.find((node) => node.id === next?.toNodeId);
    }

    logs.push(this.log('warning', 'Ejecución detenida sin llegar a Fin.'));
    return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed' };
  }

  private log(level: ExecutionLog['level'], message: string): ExecutionLog {
    return { level, message, timestamp: new Date().toISOString() };
  }
}
