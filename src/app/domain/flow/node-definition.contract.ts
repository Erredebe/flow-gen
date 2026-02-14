import { JsonObject } from './flow.types';

export interface NodePortDefinition {
  name: string;
  displayName: string;
}

export type NodeRuntimeKind = 'trigger' | 'task' | 'branch' | 'terminal' | string;

export interface NodeDefinition {
  type: string;
  displayName: string;
  category: string;
  inputPorts: ReadonlyArray<NodePortDefinition>;
  outputPorts: ReadonlyArray<NodePortDefinition>;
  configSchema: JsonObject;
  inputSchema?: JsonObject;
  outputSchema?: JsonObject;
  runtimeKind: NodeRuntimeKind;
  version: string;
}
