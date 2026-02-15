import { Injectable } from '@angular/core';
import { FlowDefinition } from '../models/flow.model';

@Injectable({ providedIn: 'root' })
export class FlowValidationService {
  validate(flow: FlowDefinition): string[] {
    const errors: string[] = [];
    const starts = flow.nodes.filter((node) => node.type === 'start');
    const ends = flow.nodes.filter((node) => node.type === 'end');

    if (starts.length !== 1) {
      errors.push('Debe existir exactamente un nodo Inicio.');
    }

    if (ends.length < 1) {
      errors.push('Debe existir al menos un nodo Fin.');
    }

    for (const node of flow.nodes) {
      const outgoing = flow.connections.filter((connection) => connection.fromNodeId === node.id);
      if (node.type !== 'end' && outgoing.length === 0) {
        errors.push(`Nodo "${node.data.label}" sin conexión de salida.`);
      }

      if (node.type === 'decision') {
        const trueBranch = outgoing.some((connection) => connection.fromPort === 'true');
        const falseBranch = outgoing.some((connection) => connection.fromPort === 'false');
        if (!trueBranch || !falseBranch) {
          errors.push(`Nodo decisión "${node.data.label}" requiere ramas true y false.`);
        }
      }
    }

    if (starts[0] && !this.hasReachableEnd(starts[0].id, flow)) {
      errors.push('No hay un nodo Fin alcanzable desde Inicio.');
    }

    return errors;
  }

  private hasReachableEnd(startId: string, flow: FlowDefinition): boolean {
    const queue = [startId];
    const visited = new Set<string>();

    while (queue.length) {
      const currentId = queue.shift() as string;
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const node = flow.nodes.find((item) => item.id === currentId);
      if (!node) {
        continue;
      }

      if (node.type === 'end') {
        return true;
      }

      const nextIds = flow.connections
        .filter((connection) => connection.fromNodeId === currentId)
        .map((connection) => connection.toNodeId);
      queue.push(...nextIds);
    }

    return false;
  }
}
