import { AnyFlowNode, FlowNodeType } from '../flow/flow.types';

export interface CreateNodeInput {
  nodeType: FlowNodeType;
  nodeId: string;
  existingNodeCount: number;
}

export function createNode(input: CreateNodeInput): AnyFlowNode {
  return {
    id: input.nodeId,
    nodeType: input.nodeType,
    version: '1.0.0',
    config: {},
    label: getDefaultLabel(input.nodeType),
    condition: '',
    position: {
      x: 200 + (input.existingNodeCount % 5) * 220,
      y: 120 + Math.floor(input.existingNodeCount / 5) * 140
    },
    metadata: {}
  };
}

function getDefaultLabel(nodeType: FlowNodeType): string {
  switch (nodeType) {
    case 'start':
      return 'Inicio';
    case 'decision':
      return 'Nueva decisión';
    case 'end':
      return 'Fin';
    default:
      return 'Nueva acción';
  }
}
