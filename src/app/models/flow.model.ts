export type NodeType = 'start' | 'task' | 'decision' | 'script' | 'api' | 'end';

export interface FlowNodeData {
  label: string;
  description?: string;
  condition?: string;
  script?: string;
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST';
  apiBody?: string;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: FlowNodeData;
}

export interface FlowConnection {
  id: string;
  fromNodeId: string;
  fromPort: 'default' | 'true' | 'false';
  toNodeId: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  updatedAt: string;
}

export interface ExecutionLog {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'warning';
}

export interface ExecutionResult {
  visitedNodeIds: string[];
  failedNodeIds: string[];
  logs: ExecutionLog[];
  status: 'completed' | 'failed';
}

export interface ScriptSnippet {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}
