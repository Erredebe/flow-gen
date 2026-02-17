import { NodeType } from './flow.model';

export interface NodeTemplate {
  type: NodeType;
  label: string;
  color: string;
  icon: string;
}

export interface ContextChange {
  nodeId: string;
  nodeLabel: string;
  key: string;
  value: string;
}
