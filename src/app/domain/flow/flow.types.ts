export const FLOW_SCHEMA_VERSION = '1.0.0' as const;

export type FlowSchemaVersion = typeof FLOW_SCHEMA_VERSION;

export type FlowNodeType = string;

export type DecisionBranch = 'true' | 'false';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface NodePosition {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  label: string;
  nodeType: FlowNodeType;
  version: string;
  config: JsonObject;
  position: NodePosition;
  condition?: string;
  metadata?: Record<string, string>;
}

export type AnyFlowNode = FlowNode;

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
