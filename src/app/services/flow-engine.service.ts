import { Injectable } from '@angular/core';
import { ExecutionContextSnapshot, ExecutionLog, ExecutionResult, FlowDefinition, FlowNode } from '../models/flow.model';

interface MockServerRoute {
  method: string;
  path: string;
  handler: (payload: unknown, context: Record<string, unknown>) => unknown;
}

interface MockServerApi {
  register: (method: string, path: string, handler: (payload: unknown, context: Record<string, unknown>) => unknown) => void;
  get: (path: string, handler: (payload: unknown, context: Record<string, unknown>) => unknown) => void;
  post: (path: string, handler: (payload: unknown, context: Record<string, unknown>) => unknown) => void;
  request: (method: string, path: string, payload?: unknown) => { status: number; body: unknown };
  listRoutes: () => { method: string; path: string }[];
}

@Injectable({ providedIn: 'root' })
export class FlowEngineService {
  async execute(flow: FlowDefinition): Promise<ExecutionResult> {
    const logs: ExecutionLog[] = [];
    const visitedNodeIds: string[] = [];
    const failedNodeIds = new Set<string>();
    const context: Record<string, unknown> = {};
    const contextHistory: ExecutionContextSnapshot[] = [];
    const mockRoutes: MockServerRoute[] = [];

    const server = this.createMockServer(context, mockRoutes);

    const start = flow.nodes.find((node) => node.type === 'start');
    if (!start) {
      return {
        logs: [{ level: 'error', message: 'No se encontró nodo Inicio.', timestamp: new Date().toISOString() }],
        visitedNodeIds,
        failedNodeIds: [],
        status: 'failed',
        context: {},
        contextHistory
      };
    }

    let currentNode: FlowNode | undefined = start;
    let safetyCounter = 0;

    while (currentNode) {
      safetyCounter += 1;
      if (safetyCounter > 200) {
        logs.push(this.log('warning', 'Detención por posible bucle infinito.'));
        return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed', context: structuredClone(context), contextHistory };
      }

      visitedNodeIds.push(currentNode.id);
      logs.push(this.log('info', `Ejecutando nodo ${currentNode.data.label} (${currentNode.type}).`));

      if (currentNode.type === 'script' && currentNode.data.script) {
        try {
          const scriptFn = new Function('context', 'server', currentNode.data.script);
          const scriptResult = scriptFn(context, server);
          logs.push(this.log('info', `Resultado script: ${JSON.stringify(scriptResult)}`));
        } catch (error) {
          logs.push(this.log('error', `Error de script: ${String(error)}`));
          failedNodeIds.add(currentNode.id);
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed', context: structuredClone(context), contextHistory };
        }
      }

      if (currentNode.type === 'api' && currentNode.data.apiUrl) {
        try {
          const method = currentNode.data.apiMethod ?? 'GET';
          const payload = this.parseApiBody(currentNode.data.apiBody);

          if (currentNode.data.apiUrl.startsWith('mock://')) {
            const path = currentNode.data.apiUrl.replace('mock://', '/');
            const mockResponse = server.request(method, path, payload);
            logs.push(this.log('info', `Mock API status: ${mockResponse.status} (${method} ${path})`));
            context['lastApiStatus'] = mockResponse.status;
            context['lastApiResponse'] = mockResponse.body;
            context['mockRoutes'] = server.listRoutes();
          } else {
            const response = await fetch(currentNode.data.apiUrl, {
              method,
              body: method === 'POST' ? currentNode.data.apiBody : undefined,
              headers: { 'Content-Type': 'application/json' }
            });
            logs.push(this.log('info', `API status: ${response.status}`));
            context['lastApiStatus'] = response.status;
          }
        } catch (error) {
          logs.push(this.log('error', `Error API: ${String(error)}`));
          failedNodeIds.add(currentNode.id);
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed', context: structuredClone(context), contextHistory };
        }
      }

      contextHistory.push({
        nodeId: currentNode.id,
        nodeLabel: currentNode.data.label,
        context: structuredClone(context)
      });

      if (currentNode.type === 'end') {
        logs.push(this.log('info', 'Flujo completado.'));
        return { logs, visitedNodeIds, failedNodeIds: [], status: 'completed', context: structuredClone(context), contextHistory };
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
          return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed', context: structuredClone(context), contextHistory };
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
    return { logs, visitedNodeIds, failedNodeIds: Array.from(failedNodeIds), status: 'failed', context: structuredClone(context), contextHistory };
  }

  private log(level: ExecutionLog['level'], message: string): ExecutionLog {
    return { level, message, timestamp: new Date().toISOString() };
  }

  private createMockServer(context: Record<string, unknown>, routes: MockServerRoute[]): MockServerApi {
    const register = (method: string, path: string, handler: (payload: unknown, ctx: Record<string, unknown>) => unknown): void => {
      const normalizedMethod = method.toUpperCase();
      const normalizedPath = this.normalizeMockPath(path);
      const existingIndex = routes.findIndex((route) => route.method === normalizedMethod && route.path === normalizedPath);
      const route: MockServerRoute = { method: normalizedMethod, path: normalizedPath, handler };

      if (existingIndex >= 0) {
        routes[existingIndex] = route;
      } else {
        routes.push(route);
      }
    };

    const request = (method: string, path: string, payload?: unknown): { status: number; body: unknown } => {
      const normalizedMethod = method.toUpperCase();
      const normalizedPath = this.normalizeMockPath(path);
      const route = routes.find((item) => item.method === normalizedMethod && item.path === normalizedPath);

      if (!route) {
        return { status: 404, body: { error: `Ruta mock no encontrada: ${normalizedMethod} ${normalizedPath}` } };
      }

      const body = route.handler(payload, context);
      return { status: 200, body };
    };

    return {
      register,
      get: (path, handler) => register('GET', path, handler),
      post: (path, handler) => register('POST', path, handler),
      request,
      listRoutes: () => routes.map((route) => ({ method: route.method, path: route.path }))
    };
  }

  private parseApiBody(apiBody?: string): unknown {
    if (!apiBody?.trim()) {
      return undefined;
    }

    try {
      return JSON.parse(apiBody);
    } catch {
      return apiBody;
    }
  }

  private normalizeMockPath(path: string): string {
    const normalized = path.trim();
    if (!normalized) {
      return '/';
    }
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
}
