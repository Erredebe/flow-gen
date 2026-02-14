import { TestBed } from '@angular/core/testing';

import { InMemoryNodeDefinitionRegistryService } from '../flow/in-memory-node-definition-registry.service';
import { NodeDefinitionRegistry } from '../../domain/ports/node-definition-registry.port';
import { ToolExecutorPort } from '../../domain/ports/tool-executor.port';
import { ToolRegistryPort } from '../../domain/ports/tool-registry.port';
import { LocalFunctionToolAdapter } from './local-function-tool.adapter';
import { InMemoryToolRegistryAdapter } from './in-memory-tool-registry.adapter';
import { ToolExecutorAdapter } from './tool-executor.adapter';
import { RegistryNodeExecutorAdapter } from './registry-node-executor.adapter';

describe('RegistryNodeExecutorAdapter', () => {
  let adapter: RegistryNodeExecutorAdapter;
  let toolRegistry: ToolRegistryPort;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NodeDefinitionRegistry, useClass: InMemoryNodeDefinitionRegistryService },
        { provide: ToolRegistryPort, useClass: InMemoryToolRegistryAdapter },
        { provide: ToolExecutorPort, useClass: ToolExecutorAdapter },
        RegistryNodeExecutorAdapter
      ]
    });

    adapter = TestBed.inject(RegistryNodeExecutorAdapter);
    toolRegistry = TestBed.inject(ToolRegistryPort);
  });

  it('routes tool runtimeKind through registry by config.toolName', async () => {
    toolRegistry.register(
      new LocalFunctionToolAdapter({
        name: 'echo-tool',
        description: 'Echo',
        inputSchema: { type: 'object', additionalProperties: true, properties: {} },
        outputSchema: { type: 'object', additionalProperties: true, properties: {} },
        handler: ({ input }) => ({ output: input })
      })
    );

    const outcome = await adapter.execute({
      node: {
        id: 'n1',
        label: 'Tool node',
        nodeType: 'tool-node',
        version: '1.0.0',
        config: { toolName: 'echo-tool' },
        position: { x: 0, y: 0 },
        metadata: {}
      },
      context: { input: {}, variables: {}, traceId: 't1', runId: 'r1', secretReferences: [] },
      upstreamOutputs: { source: { hello: 'world' } },
      policy: {}
    });

    expect(outcome.outputs).toEqual({
      config: { toolName: 'echo-tool' },
      upstreamOutputs: { source: { hello: 'world' } },
      context: { input: {}, variables: {}, traceId: 't1', runId: 'r1', secretReferences: [] }
    });
  });

  it('executes action node as tool-backed node when config.toolName is present', async () => {
    toolRegistry.register(
      new LocalFunctionToolAdapter({
        name: 'action-tool',
        description: 'Action tool',
        inputSchema: { type: 'object', additionalProperties: true, properties: {} },
        outputSchema: { type: 'object', additionalProperties: true, properties: {} },
        handler: () => ({ output: { ok: true } })
      })
    );

    const outcome = await adapter.execute({
      node: {
        id: 'a1',
        label: 'Action node',
        nodeType: 'action',
        version: '1.0.0',
        config: { toolName: 'action-tool', message: 'second alert' },
        position: { x: 0, y: 0 },
        metadata: {}
      },
      context: { input: {}, variables: {}, traceId: 't1', runId: 'r1', secretReferences: [] },
      upstreamOutputs: {},
      policy: {}
    });

    expect(outcome.outputs).toEqual({ ok: true });
  });

});
