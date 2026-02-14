import { FlowMigrationPipeline } from './flow-migration.pipeline';

const legacyFlowFixture = {
  id: 'legacy-flow',
  name: 'Legacy flow',
  schemaVersion: '0.9.0',
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      label: 'Inicio',
      position: { x: 0, y: 0 },
      metadata: {}
    },
    {
      id: 'action-1',
      type: 'action',
      label: 'Action',
      position: { x: 200, y: 0 },
      metadata: { key: 'value' }
    }
  ],
  edges: [{ id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'action-1' }]
} as const;

const migratedSnapshot = {
  id: 'legacy-flow',
  name: 'Legacy flow',
  schemaVersion: '1.0.0',
  nodes: [
    {
      id: 'start-1',
      nodeType: 'start',
      label: 'Inicio',
      position: { x: 0, y: 0 },
      metadata: {},
      version: '1.0.0',
      config: {}
    },
    {
      id: 'action-1',
      nodeType: 'action',
      label: 'Action',
      position: { x: 200, y: 0 },
      metadata: { key: 'value' },
      version: '1.0.0',
      config: {}
    }
  ],
  edges: [{ id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'action-1' }]
};

describe('FlowMigrationPipeline', () => {
  it('migrates legacy flow schema and node fields to current snapshot', () => {
    const pipeline = new FlowMigrationPipeline();

    const migratedFlow = pipeline.migrate(legacyFlowFixture);

    expect(migratedFlow).toEqual(migratedSnapshot);
  });
});
