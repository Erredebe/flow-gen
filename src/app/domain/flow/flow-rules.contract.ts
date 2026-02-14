import { AnyFlowNode, FlowEdge } from './flow.types';
import { NodeDefinitionRegistry } from '../ports/node-definition-registry.port';

export interface ConnectionRule {
  canHaveIncomingEdges: boolean;
  canHaveOutgoingEdges: boolean;
  minOutgoingEdges?: number;
  maxOutgoingEdges?: number;
}

export function getConnectionRule(node: AnyFlowNode, registry: NodeDefinitionRegistry): ConnectionRule {
  const definition = registry.getDefinition(node.nodeType);

  if (!definition) {
    return {
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: true
    };
  }

  switch (definition.runtimeKind) {
    case 'trigger':
      return {
        canHaveIncomingEdges: false,
        canHaveOutgoingEdges: true,
        minOutgoingEdges: 1,
        maxOutgoingEdges: 1
      };
    case 'terminal':
      return {
        canHaveIncomingEdges: true,
        canHaveOutgoingEdges: false,
        maxOutgoingEdges: 0
      };
    case 'branch':
      return {
        canHaveIncomingEdges: true,
        canHaveOutgoingEdges: true,
        minOutgoingEdges: definition.outputPorts.length,
        maxOutgoingEdges: definition.outputPorts.length
      };
    default:
      return {
        canHaveIncomingEdges: definition.inputPorts.length > 0,
        canHaveOutgoingEdges: definition.outputPorts.length > 0
      };
  }
}

export function isValidConnectionByNodeType(
  source: AnyFlowNode,
  target: AnyFlowNode,
  registry: NodeDefinitionRegistry
): boolean {
  const sourceRule = getConnectionRule(source, registry);
  const targetRule = getConnectionRule(target, registry);

  return sourceRule.canHaveOutgoingEdges && targetRule.canHaveIncomingEdges;
}

export function countNodeConnections(nodeId: string, edges: ReadonlyArray<FlowEdge>): {
  incoming: number;
  outgoing: number;
} {
  return edges.reduce(
    (connections, edge) => {
      if (edge.sourceNodeId === nodeId) {
        connections.outgoing += 1;
      }

      if (edge.targetNodeId === nodeId) {
        connections.incoming += 1;
      }

      return connections;
    },
    { incoming: 0, outgoing: 0 }
  );
}
