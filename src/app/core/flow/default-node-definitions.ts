import { NodeDefinition } from '../../domain/flow/node-definition.contract';

const PASSTHROUGH_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {}
};

export const DEFAULT_NODE_DEFINITIONS: ReadonlyArray<NodeDefinition> = [
  {
    type: 'start',
    displayName: 'Inicio',
    category: 'control',
    inputPorts: [],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: PASSTHROUGH_SCHEMA,
    inputSchema: { type: 'null' },
    outputSchema: PASSTHROUGH_SCHEMA,
    runtimeKind: 'trigger',
    version: '1.0.0'
  },
  {
    type: 'action',
    displayName: 'Acción',
    category: 'task',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: PASSTHROUGH_SCHEMA,
    inputSchema: PASSTHROUGH_SCHEMA,
    outputSchema: PASSTHROUGH_SCHEMA,
    runtimeKind: 'task',
    version: '1.0.0'
  },
  {
    type: 'tool-node',
    displayName: 'Tool',
    category: 'integration',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      required: ['toolName'],
      properties: { toolName: { type: 'string' } }
    },
    inputSchema: PASSTHROUGH_SCHEMA,
    outputSchema: PASSTHROUGH_SCHEMA,
    runtimeKind: 'tool',
    version: '1.0.0'
  },
  {
    type: 'function-node',
    displayName: 'Function',
    category: 'integration',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      required: ['toolName'],
      properties: { toolName: { type: 'string' } }
    },
    inputSchema: PASSTHROUGH_SCHEMA,
    outputSchema: PASSTHROUGH_SCHEMA,
    runtimeKind: 'function',
    version: '1.0.0'
  },
  {
    type: 'decision',
    displayName: 'Decisión',
    category: 'control',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [
      { name: 'true', displayName: 'Verdadero' },
      { name: 'false', displayName: 'Falso' }
    ],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        expression: { type: 'string' }
      }
    },
    inputSchema: PASSTHROUGH_SCHEMA,
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        branch: { type: 'string' }
      }
    },
    runtimeKind: 'branch',
    version: '1.0.0'
  },
  {
    type: 'end',
    displayName: 'Fin',
    category: 'control',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [],
    configSchema: PASSTHROUGH_SCHEMA,
    inputSchema: PASSTHROUGH_SCHEMA,
    outputSchema: { type: 'null' },
    runtimeKind: 'terminal',
    version: '1.0.0'
  }
];
