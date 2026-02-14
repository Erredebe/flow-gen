import { AnyFlowNode, FlowEdge, FlowNodeType } from './flow.types';

export interface ConnectionRule {
  canHaveIncomingEdges: boolean;
  canHaveOutgoingEdges: boolean;
  minOutgoingEdges?: number;
  maxOutgoingEdges?: number;
}

export const CONNECTION_RULES: Readonly<Record<FlowNodeType, ConnectionRule>> = {
  start: {
    canHaveIncomingEdges: false,
    canHaveOutgoingEdges: true,
    minOutgoingEdges: 1,
    maxOutgoingEdges: 1
  },
  action: {
    canHaveIncomingEdges: true,
    canHaveOutgoingEdges: true
  },
  decision: {
    canHaveIncomingEdges: true,
    canHaveOutgoingEdges: true,
    minOutgoingEdges: 2,
    maxOutgoingEdges: 2
  },
  end: {
    canHaveIncomingEdges: true,
    canHaveOutgoingEdges: false,
    maxOutgoingEdges: 0
  }
};

export function isValidConnectionByNodeType(source: AnyFlowNode, target: AnyFlowNode): boolean {
  const sourceRule = CONNECTION_RULES[source.type];
  const targetRule = CONNECTION_RULES[target.type];

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
