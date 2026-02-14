import { countNodeConnections, getConnectionRule, isValidConnectionByNodeType } from './flow-rules.contract';
import { AnyFlowNode, Flow } from './flow.types';
import { NodeDefinitionRegistry } from '../ports/node-definition-registry.port';

export type FlowValidationCode =
  | 'EDGE_WITH_UNKNOWN_SOURCE'
  | 'EDGE_WITH_UNKNOWN_TARGET'
  | 'INVALID_NODE_CONNECTION'
  | 'INVALID_OUTGOING_EDGE_COUNT'
  | 'CYCLE_DETECTED'
  | 'INCOMPLETE_DECISION_BRANCHES';

export interface FlowValidationError {
  code: FlowValidationCode;
  message: string;
  subjectId?: string;
}

export interface FlowValidationOptions {
  allowCycles?: boolean;
}

export function validateFlow(
  flow: Flow,
  nodeDefinitionRegistry: NodeDefinitionRegistry,
  options: FlowValidationOptions = {}
): ReadonlyArray<FlowValidationError> {
  const errors: FlowValidationError[] = [];
  const nodeById = createNodeMap(flow.nodes);

  for (const edge of flow.edges) {
    const sourceNode = nodeById.get(edge.sourceNodeId);
    const targetNode = nodeById.get(edge.targetNodeId);

    if (!sourceNode) {
      errors.push({
        code: 'EDGE_WITH_UNKNOWN_SOURCE',
        message: `Edge "${edge.id}" references source node "${edge.sourceNodeId}" that does not exist.`,
        subjectId: edge.id
      });
      continue;
    }

    if (!targetNode) {
      errors.push({
        code: 'EDGE_WITH_UNKNOWN_TARGET',
        message: `Edge "${edge.id}" references target node "${edge.targetNodeId}" that does not exist.`,
        subjectId: edge.id
      });
      continue;
    }

    if (!isValidConnectionByNodeType(sourceNode, targetNode, nodeDefinitionRegistry)) {
      errors.push({
        code: 'INVALID_NODE_CONNECTION',
        message: `Invalid connection from "${sourceNode.nodeType}" node "${sourceNode.id}" to "${targetNode.nodeType}" node "${targetNode.id}".`,
        subjectId: edge.id
      });
    }
  }

  errors.push(...validateNodeOutgoingEdgeLimits(flow, nodeDefinitionRegistry));
  errors.push(...validateBranchNodePorts(flow, nodeDefinitionRegistry));

  if (options.allowCycles !== true && hasCycle(flow)) {
    errors.push({
      code: 'CYCLE_DETECTED',
      message: 'The flow contains a cycle and cycles are not allowed.'
    });
  }

  return errors;
}

function createNodeMap(nodes: ReadonlyArray<AnyFlowNode>): Map<string, AnyFlowNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function validateNodeOutgoingEdgeLimits(
  flow: Flow,
  nodeDefinitionRegistry: NodeDefinitionRegistry
): ReadonlyArray<FlowValidationError> {
  return flow.nodes.flatMap((node) => {
    const rules = getConnectionRule(node, nodeDefinitionRegistry);
    const connections = countNodeConnections(node.id, flow.edges);

    const hasMinViolation =
      rules.minOutgoingEdges !== undefined && connections.outgoing < rules.minOutgoingEdges;
    const hasMaxViolation =
      rules.maxOutgoingEdges !== undefined && connections.outgoing > rules.maxOutgoingEdges;

    if (!hasMinViolation && !hasMaxViolation) {
      return [];
    }

    return [
      {
        code: 'INVALID_OUTGOING_EDGE_COUNT',
        message: `Node "${node.id}" of type "${node.nodeType}" has ${connections.outgoing} outgoing edges and must satisfy min=${rules.minOutgoingEdges ?? '-'} max=${rules.maxOutgoingEdges ?? '-'}.`,
        subjectId: node.id
      }
    ];
  });
}

function validateBranchNodePorts(
  flow: Flow,
  nodeDefinitionRegistry: NodeDefinitionRegistry
): ReadonlyArray<FlowValidationError> {
  return flow.nodes.flatMap((node) => {
    const definition = nodeDefinitionRegistry.getDefinition(node.nodeType);
    if (!definition || definition.runtimeKind !== 'branch') {
      return [];
    }

    const outgoingEdges = flow.edges.filter((edge) => edge.sourceNodeId === node.id);
    const presentBranches = new Set<string>(outgoingEdges.map((edge) => String(edge.branch ?? '')));
    const expectedPorts = definition.outputPorts.map((port) => port.name);

    const hasAllBranches = expectedPorts.every((port) => presentBranches.has(port));
    if (hasAllBranches) {
      return [];
    }

    return [
      {
        code: 'INCOMPLETE_DECISION_BRANCHES',
        message: `Branch node "${node.id}" must define all configured outgoing branches (${expectedPorts.join(', ')}).`,
        subjectId: node.id
      }
    ];
  });
}

function hasCycle(flow: Flow): boolean {
  const adjacency = new Map<string, string[]>();

  for (const node of flow.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of flow.edges) {
    const neighbors = adjacency.get(edge.sourceNodeId);
    if (!neighbors) {
      continue;
    }

    neighbors.push(edge.targetNodeId);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  for (const node of flow.nodes) {
    if (visited.has(node.id)) {
      continue;
    }

    if (detectCycle(node.id, adjacency, visited, inStack)) {
      return true;
    }
  }

  return false;
}

function detectCycle(
  nodeId: string,
  adjacency: ReadonlyMap<string, ReadonlyArray<string>>,
  visited: Set<string>,
  inStack: Set<string>
): boolean {
  visited.add(nodeId);
  inStack.add(nodeId);

  const neighbors = adjacency.get(nodeId) ?? [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor) && detectCycle(neighbor, adjacency, visited, inStack)) {
      return true;
    }

    if (inStack.has(neighbor)) {
      return true;
    }
  }

  inStack.delete(nodeId);
  return false;
}
