import { AnyFlowNode, FlowNodeType } from '../flow/flow.types';

export interface CreateNodeInput {
  type: FlowNodeType;
  nodeId: string;
  existingNodeCount: number;
}

export function createNode(input: CreateNodeInput): AnyFlowNode {
  return {
    id: input.nodeId,
    type: input.type,
    label: getDefaultLabel(input.type),
    condition: '',
    position: {
      x: 200 + (input.existingNodeCount % 5) * 220,
      y: 120 + Math.floor(input.existingNodeCount / 5) * 140
    },
    metadata: {}
  };
}

function getDefaultLabel(type: FlowNodeType): string {
  switch (type) {
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
