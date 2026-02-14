import { NodeDefinition } from '../../domain/flow/node-definition.contract';

export const DEFAULT_NODE_DEFINITIONS: ReadonlyArray<NodeDefinition> = [
  {
    type: 'start',
    displayName: 'Inicio',
    category: 'control',
    inputPorts: [],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {}
    },
    runtimeKind: 'trigger',
    version: '1.0.0'
  },
  {
    type: 'action',
    displayName: 'Acción',
    category: 'task',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [{ name: 'next', displayName: 'Siguiente' }],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {}
    },
    runtimeKind: 'task',
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
    runtimeKind: 'branch',
    version: '1.0.0'
  },
  {
    type: 'end',
    displayName: 'Fin',
    category: 'control',
    inputPorts: [{ name: 'in', displayName: 'Entrada' }],
    outputPorts: [],
    configSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {}
    },
    runtimeKind: 'terminal',
    version: '1.0.0'
  }
];
