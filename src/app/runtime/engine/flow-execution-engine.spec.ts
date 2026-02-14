import { TestBed } from '@angular/core/testing';

import { ValidateFlowUseCase } from '../../application/flow/validate-flow.use-case';
import { ExecutionEvent } from '../../domain/execution/execution-event.entity';
import { FlowRun } from '../../domain/execution/flow-run.entity';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';
import { RunRepositoryPort } from '../../domain/ports/run-repository.port';
import { FlowExecutionEngine } from './flow-execution-engine';
import { ExecutionContext } from './execution-state';
import { NodeExecutorPort } from '../ports/node-executor.port';

describe('FlowExecutionEngine', () => {
  let engine: FlowExecutionEngine;
  let validateFlowUseCaseSpy: jasmine.SpyObj<ValidateFlowUseCase>;
  let nodeExecutorSpy: jasmine.SpyObj<NodeExecutorPort>;
  let runRepositorySpy: jasmine.SpyObj<RunRepositoryPort>;

  const contextFixture: ExecutionContext = {
    input: { customerId: 'customer-1' },
    variables: {},
    secretReferences: ['secret://api/token'],
    traceId: 'trace-1',
    runId: 'run-1'
  };

  beforeEach(() => {
    validateFlowUseCaseSpy = jasmine.createSpyObj<ValidateFlowUseCase>('ValidateFlowUseCase', ['execute']);
    validateFlowUseCaseSpy.execute.and.returnValue([]);

    nodeExecutorSpy = jasmine.createSpyObj<NodeExecutorPort>('NodeExecutorPort', ['canExecute', 'execute']);
    nodeExecutorSpy.canExecute.and.returnValue(true);

    runRepositorySpy = jasmine.createSpyObj<RunRepositoryPort>('RunRepositoryPort', [
      'appendEvent',
      'saveRunSnapshot',
      'getEventsByRunId',
      'getRunSnapshot',
      'listRunIds'
    ]);
    runRepositorySpy.appendEvent.and.resolveTo();
    runRepositorySpy.saveRunSnapshot.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        FlowExecutionEngine,
        { provide: ValidateFlowUseCase, useValue: validateFlowUseCaseSpy },
        { provide: NodeExecutorPort, useValue: nodeExecutorSpy },
        { provide: RunRepositoryPort, useValue: runRepositorySpy }
      ]
    });

    engine = TestBed.inject(FlowExecutionEngine);
  });

  it('runs a DAG flow successfully in topological order', async () => {
    const flow = createFlow([
      { id: 'node-a', metadata: {} },
      { id: 'node-b', metadata: {} }
    ]);

    nodeExecutorSpy.execute.and.callFake(async ({ node }) => ({ outputs: { nodeId: node.id } }));

    const result = await engine.run(flow, contextFixture);

    expect(validateFlowUseCaseSpy.execute).toHaveBeenCalledWith(flow);
    expect(result.status).toBe('success');
    expect(result.outputs['node-a']).toEqual({ nodeId: 'node-a' });
    expect(result.outputs['node-b']).toEqual({ nodeId: 'node-b' });
    expect(result.metrics.nodeExecutions).toBe(2);
  });

  it('emits ordered execution events and stores final snapshot', async () => {
    const flow = createFlow([
      { id: 'node-a', metadata: {} },
      { id: 'node-b', metadata: {} }
    ]);
    const appendedEvents: ExecutionEvent[] = [];

    runRepositorySpy.appendEvent.and.callFake(async (event) => {
      appendedEvents.push(event);
    });
    nodeExecutorSpy.execute.and.callFake(async ({ node }) => ({ outputs: { nodeId: node.id } }));

    const result = await engine.run(flow, contextFixture);

    expect(result.status).toBe('success');
    expect(appendedEvents.map((event) => event.type)).toEqual([
      'RUN_STARTED',
      'NODE_STARTED',
      'NODE_SUCCEEDED',
      'NODE_STARTED',
      'NODE_SUCCEEDED',
      'RUN_FINISHED'
    ]);
    expect(appendedEvents.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5, 6]);

    const snapshot = runRepositorySpy.saveRunSnapshot.calls.mostRecent().args[0] as FlowRun;
    expect(snapshot.runId).toBe(contextFixture.runId);
    expect(snapshot.status).toBe('success');
    expect(snapshot.outputs['node-b']).toEqual({ nodeId: 'node-b' });
    expect(snapshot.nodeRuns.map((nodeRun) => nodeRun.nodeId)).toEqual(['node-a', 'node-b']);
  });

  it('returns failed when node has recoverable error without retries available', async () => {
    const flow = createFlow([
      { id: 'node-a', metadata: {} },
      { id: 'node-b', metadata: { retryMax: '0' } }
    ]);

    nodeExecutorSpy.execute.and.callFake(async ({ node }) => {
      if (node.id === 'node-b') {
        throw { code: 'TEMP_ERROR', message: 'Recoverable issue', recoverable: true };
      }

      return { outputs: { ok: true } };
    });

    const result = await engine.run(flow, contextFixture);

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('TEMP_ERROR');
    expect(result.metrics.retries).toBe(0);

    const snapshot = runRepositorySpy.saveRunSnapshot.calls.mostRecent().args[0] as FlowRun;
    expect(snapshot.status).toBe('failed');
    expect(snapshot.errorCode).toBe('TEMP_ERROR');
  });

  it('returns timeout when node execution exceeds timeout policy', async () => {
    const flow = createFlow([{ id: 'node-a', metadata: { timeoutMs: '10' } }], []);

    nodeExecutorSpy.execute.and.returnValue(
      new Promise((resolve) => {
        setTimeout(() => resolve({ outputs: { ok: true } }), 30);
      })
    );

    const result = await engine.run(flow, contextFixture);

    expect(result.status).toBe('timeout');
    expect(result.error?.code).toBe('NODE_TIMEOUT');
    expect(result.metrics.timedOutNodes).toBe(1);
  });

  it('retries recoverable failures and succeeds within retry policy', async () => {
    const flow = createFlow([{ id: 'node-a', metadata: { retryMax: '2' } }], []);
    let attempts = 0;

    nodeExecutorSpy.execute.and.callFake(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw { code: 'TEMP_ERROR', message: 'Retry me', recoverable: true };
      }

      return { outputs: { attempts } };
    });

    const result = await engine.run(flow, contextFixture);

    expect(result.status).toBe('success');
    expect(result.outputs['node-a']).toEqual({ attempts: 3 });
    expect(result.metrics.retries).toBe(2);
    expect(nodeExecutorSpy.execute).toHaveBeenCalledTimes(3);
  });
});

function createFlow(
  nodes: Array<{ id: string; metadata: Record<string, string> }>,
  edges = [{ id: 'edge-a-b', sourceNodeId: 'node-a', targetNodeId: 'node-b' }]
): Flow {
  return {
    id: 'flow-1',
    name: 'Flow test',
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.id,
      nodeType: 'http.request',
      version: '1.0.0',
      config: {},
      position: { x: 0, y: 0 },
      metadata: node.metadata
    })),
    edges
  };
}
