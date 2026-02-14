import { TestBed } from '@angular/core/testing';

import { ToolExecutorPort } from '../../domain/ports/tool-executor.port';
import { ToolRegistryPort } from '../../domain/ports/tool-registry.port';
import { LocalFunctionToolAdapter } from './local-function-tool.adapter';
import { ToolExecutorAdapter } from './tool-executor.adapter';
import { InMemoryToolRegistryAdapter } from './in-memory-tool-registry.adapter';

describe('ToolExecutorAdapter contract', () => {
  let toolExecutor: ToolExecutorPort;
  let toolRegistry: ToolRegistryPort;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToolRegistryPort, useClass: InMemoryToolRegistryAdapter },
        { provide: ToolExecutorPort, useClass: ToolExecutorAdapter }
      ]
    });

    toolExecutor = TestBed.inject(ToolExecutorPort);
    toolRegistry = TestBed.inject(ToolRegistryPort);
  });

  it('executes a mock local tool following ToolContract', async () => {
    const mockTool = new LocalFunctionToolAdapter({
      name: 'mock.sum',
      description: 'Suma dos números',
      inputSchema: {
        type: 'object',
        required: ['a', 'b'],
        properties: { a: { type: 'number' }, b: { type: 'number' } }
      },
      outputSchema: {
        type: 'object',
        required: ['result'],
        properties: { result: { type: 'number' } }
      },
      handler: ({ input }) => {
        const payload = input as { a: number; b: number };
        return { output: { result: payload.a + payload.b } };
      }
    });

    toolRegistry.register(mockTool);

    const result = await toolExecutor.execute({
      toolName: 'mock.sum',
      request: { input: { a: 2, b: 3 } }
    });

    expect(result.output).toEqual({ result: 5 });
  });

  it('normalizes object errors from tool execution', async () => {
    const failingTool = new LocalFunctionToolAdapter({
      name: 'mock.fail',
      description: 'Falla de forma controlada',
      inputSchema: { type: 'object', additionalProperties: true, properties: {} },
      outputSchema: { type: 'null' },
      handler: async () => {
        throw { code: 'MOCK_FAILURE', message: 'failure', recoverable: true, details: { reason: 'test' } };
      }
    });

    toolRegistry.register(failingTool);

    await expectAsync(
      toolExecutor.execute({
        toolName: 'mock.fail',
        request: { input: {} }
      })
    ).toBeRejectedWith(
      jasmine.objectContaining({
        code: 'MOCK_FAILURE',
        message: 'failure',
        recoverable: true,
        details: { reason: 'test' }
      })
    );
  });
});
