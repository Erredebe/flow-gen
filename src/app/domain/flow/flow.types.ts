export const FLOW_SCHEMA_VERSION = '1.0.0' as const;

export type FlowSchemaVersion = typeof FLOW_SCHEMA_VERSION;

export type FlowNodeType = 'start' | 'action' | 'decision' | 'end';

export type DecisionBranch = 'true' | 'false';

export interface BaseFlowNode {
  id: string;
  label: string;
  type: FlowNodeType;
}

export interface StartNode extends BaseFlowNode {
  type: 'start';
}

export interface EndNode extends BaseFlowNode {
  type: 'end';
}

export interface FlowNode extends BaseFlowNode {
  type: 'action';
}

export interface DecisionNode extends BaseFlowNode {
  type: 'decision';
}

export type AnyFlowNode = StartNode | FlowNode | DecisionNode | EndNode;

export interface FlowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  branch?: DecisionBranch;
}

export interface Flow {
  id: string;
  name: string;
  schemaVersion: FlowSchemaVersion;
  nodes: ReadonlyArray<AnyFlowNode>;
  edges: ReadonlyArray<FlowEdge>;
}
