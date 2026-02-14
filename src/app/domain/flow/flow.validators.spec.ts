import { validateFlow } from './flow.validators';
import { FLOW_SCHEMA_VERSION, Flow } from './flow.types';

function createBaseFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: 'flow-1',
    name: 'Flujo',
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes: [
      { id: 'start-1', type: 'start', label: 'Inicio', position: { x: 0, y: 0 }, metadata: {} },
      { id: 'action-1', type: 'action', label: 'Acción', position: { x: 100, y: 0 }, metadata: {} },
      { id: 'end-1', type: 'end', label: 'Fin', position: { x: 200, y: 0 }, metadata: {} }
    ],
    edges: [
      { id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'action-1' },
      { id: 'edge-2', sourceNodeId: 'action-1', targetNodeId: 'end-1' }
    ],
    ...overrides
  };
}

describe('validateFlow', () => {
  it('returns no errors for a valid linear flow', () => {
    const errors = validateFlow(createBaseFlow());

    expect(errors).toEqual([]);
  });

  it('detects unknown source and target nodes in edges', () => {
    const flow = createBaseFlow({
      edges: [
        { id: 'bad-source', sourceNodeId: 'missing', targetNodeId: 'action-1' },
        { id: 'bad-target', sourceNodeId: 'start-1', targetNodeId: 'missing' }
      ]
    });

    const codes = validateFlow(flow).map((error) => error.code);

    expect(codes).toContain('EDGE_WITH_UNKNOWN_SOURCE');
    expect(codes).toContain('EDGE_WITH_UNKNOWN_TARGET');
  });

  it('detects invalid node connection by type', () => {
    const flow = createBaseFlow({
      edges: [{ id: 'invalid', sourceNodeId: 'end-1', targetNodeId: 'action-1' }]
    });

    const codes = validateFlow(flow).map((error) => error.code);

    expect(codes).toContain('INVALID_NODE_CONNECTION');
  });

  it('detects cycle when cycles are not allowed', () => {
    const flow = createBaseFlow({
      edges: [
        { id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'action-1' },
        { id: 'edge-2', sourceNodeId: 'action-1', targetNodeId: 'start-1' }
      ]
    });

    const codes = validateFlow(flow).map((error) => error.code);

    expect(codes).toContain('CYCLE_DETECTED');
  });

  it('detects incomplete decision branches and invalid outgoing count', () => {
    const flow = createBaseFlow({
      nodes: [
        { id: 'start-1', type: 'start', label: 'Inicio', position: { x: 0, y: 0 }, metadata: {} },
        { id: 'decision-1', type: 'decision', label: '¿Aprueba?', position: { x: 100, y: 0 }, metadata: {} },
        { id: 'end-1', type: 'end', label: 'Fin', position: { x: 200, y: 0 }, metadata: {} }
      ],
      edges: [
        { id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'decision-1' },
        { id: 'edge-2', sourceNodeId: 'decision-1', targetNodeId: 'end-1', branch: 'true' }
      ]
    });

    const codes = validateFlow(flow).map((error) => error.code);

    expect(codes).toContain('INCOMPLETE_DECISION_BRANCHES');
    expect(codes).toContain('INVALID_OUTGOING_EDGE_COUNT');
  });
});
