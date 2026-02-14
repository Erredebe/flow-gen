import { Injectable, inject } from '@angular/core';

import { safeParseJson } from '../../core/utils/json.utils';
import { Flow, FLOW_SCHEMA_VERSION } from '../../domain/flow/flow.types';
import { validateFlow } from '../../domain/flow/flow.validators';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

export interface ImportFlowSuccess {
  success: true;
  flow: Flow;
}

export interface ImportFlowFailure {
  success: false;
  error: string;
}

export type ImportFlowResult = ImportFlowSuccess | ImportFlowFailure;

@Injectable({
  providedIn: 'root'
})
export class ImportFlowFromJsonUseCase {
  private readonly flowRepository = inject(FlowRepository);

  public execute(payload: string): ImportFlowResult {
    const parsedFlow = safeParseJson<unknown>(payload);
    if (!parsedFlow) {
      return { success: false, error: 'JSON inválido. Verifica la sintaxis del archivo o textarea.' };
    }

    const schemaValidationError = validateFlowSchema(parsedFlow);
    if (schemaValidationError) {
      return { success: false, error: schemaValidationError };
    }

    const flow = parsedFlow as Flow;

    const domainErrors = validateFlow(flow);
    if (domainErrors.length > 0) {
      const details = domainErrors.map((error) => `• ${error.message}`).join('\n');
      return {
        success: false,
        error: `El flujo no cumple las reglas del dominio:\n${details}`
      };
    }

    this.flowRepository.save(flow);
    return { success: true, flow };
  }
}

function validateFlowSchema(value: unknown): string | null {
  if (!isRecord(value)) {
    return 'El JSON debe contener un objeto en la raíz.';
  }

  if (typeof value.id !== 'string' || value.id.trim() === '') {
    return 'El campo "id" es obligatorio y debe ser texto.';
  }

  if (typeof value.name !== 'string' || value.name.trim() === '') {
    return 'El campo "name" es obligatorio y debe ser texto.';
  }

  if (value.schemaVersion !== FLOW_SCHEMA_VERSION) {
    return `schemaVersion debe ser "${FLOW_SCHEMA_VERSION}".`;
  }

  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return 'El flujo debe incluir los arreglos "nodes" y "edges".';
  }

  const areNodesValid = value.nodes.every((node) => {
    if (!isRecord(node)) {
      return false;
    }

    const hasValidType =
      node.type === 'start' || node.type === 'action' || node.type === 'decision' || node.type === 'end';

    const hasValidPosition =
      isRecord(node.position) && typeof node.position.x === 'number' && typeof node.position.y === 'number';

    const hasValidMetadata =
      node.metadata === undefined ||
      (isRecord(node.metadata) &&
        Object.values(node.metadata).every((value) => typeof value === 'string'));

    const hasValidCondition = node.condition === undefined || typeof node.condition === 'string';

    return (
      typeof node.id === 'string' &&
      typeof node.label === 'string' &&
      hasValidType &&
      hasValidPosition &&
      hasValidMetadata &&
      hasValidCondition
    );
  });

  if (!areNodesValid) {
    return 'Cada nodo debe incluir id, label, type válido y position {x,y}. condition y metadata son opcionales.';
  }

  const areEdgesValid = value.edges.every((edge) => {
    if (!isRecord(edge)) {
      return false;
    }

    const isBranchValid = edge.branch === undefined || edge.branch === 'true' || edge.branch === 'false';

    return (
      typeof edge.id === 'string' &&
      typeof edge.sourceNodeId === 'string' &&
      typeof edge.targetNodeId === 'string' &&
      isBranchValid
    );
  });

  if (!areEdgesValid) {
    return 'Cada arista debe incluir id, sourceNodeId, targetNodeId y branch opcional (true/false).';
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
