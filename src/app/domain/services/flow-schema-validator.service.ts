import { FLOW_SCHEMA_VERSION } from '../flow/flow.types';

export function validateFlowSchema(value: unknown): string | null {
  if (!isRecord(value)) {
    return 'El JSON debe contener un objeto en la raíz.';
  }

  if (typeof value['id'] !== 'string' || value['id'].trim() === '') {
    return 'El campo "id" es obligatorio y debe ser texto.';
  }

  if (typeof value['name'] !== 'string' || value['name'].trim() === '') {
    return 'El campo "name" es obligatorio y debe ser texto.';
  }

  if (typeof value['schemaVersion'] !== 'string' || value['schemaVersion'].trim() === '') {
    return 'El campo "schemaVersion" es obligatorio y debe ser texto.';
  }

  if (!Array.isArray(value['nodes']) || !Array.isArray(value['edges'])) {
    return 'El flujo debe incluir los arreglos "nodes" y "edges".';
  }

  const areNodesValid = value['nodes'].every((node) => {
    if (!isRecord(node)) {
      return false;
    }

    const rawNodeType = typeof node['nodeType'] === 'string' ? node['nodeType'] : node['type'];
    const hasValidType =
      rawNodeType === 'start' ||
      rawNodeType === 'action' ||
      rawNodeType === 'decision' ||
      rawNodeType === 'end';

    const position = node['position'];
    const hasValidPosition =
      isRecord(position) && typeof position['x'] === 'number' && typeof position['y'] === 'number';

    const metadata = node['metadata'];
    const hasValidMetadata =
      metadata === undefined ||
      (isRecord(metadata) && Object.values(metadata).every((entry) => typeof entry === 'string'));

    const hasValidCondition =
      node['condition'] === undefined || typeof node['condition'] === 'string';

    const hasValidVersion =
      node['version'] === undefined ||
      (typeof node['version'] === 'string' && node['version'].trim() !== '');

    const hasValidConfig = node['config'] === undefined || isRecord(node['config']);

    return (
      typeof node['id'] === 'string' &&
      typeof node['label'] === 'string' &&
      hasValidType &&
      hasValidPosition &&
      hasValidMetadata &&
      hasValidCondition &&
      hasValidVersion &&
      hasValidConfig
    );
  });

  if (!areNodesValid) {
    return 'Cada nodo debe incluir id, label, type/nodeType válido y position {x,y}. condition y metadata son opcionales.';
  }

  const areEdgesValid = value['edges'].every((edge) => {
    if (!isRecord(edge)) {
      return false;
    }

    const isBranchValid =
      edge['branch'] === undefined || edge['branch'] === 'true' || edge['branch'] === 'false';

    return (
      typeof edge['id'] === 'string' &&
      typeof edge['sourceNodeId'] === 'string' &&
      typeof edge['targetNodeId'] === 'string' &&
      isBranchValid
    );
  });

  if (!areEdgesValid) {
    return 'Cada arista debe incluir id, sourceNodeId, targetNodeId y branch opcional (true/false).';
  }

  if (value['schemaVersion'] !== FLOW_SCHEMA_VERSION) {
    return `schemaVersion debe ser "${FLOW_SCHEMA_VERSION}".`;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
