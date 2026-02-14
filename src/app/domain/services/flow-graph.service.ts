import { Flow, FlowEdge } from '../flow/flow.types';

export function connectNodes(flow: Flow, edgeId: string, sourceNodeId: string, targetNodeId: string): Flow {
  if (sourceNodeId === targetNodeId) {
    return flow;
  }

  const exists = flow.edges.some(
    (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
  );

  if (exists) {
    return flow;
  }

  const edge: FlowEdge = {
    id: edgeId,
    sourceNodeId,
    targetNodeId
  };

  return {
    ...flow,
    edges: [...flow.edges, edge]
  };
}

export function deleteNode(flow: Flow, nodeId: string): Flow {
  return {
    ...flow,
    nodes: flow.nodes.filter((node) => node.id !== nodeId),
    edges: flow.edges.filter((edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId)
  };
}
