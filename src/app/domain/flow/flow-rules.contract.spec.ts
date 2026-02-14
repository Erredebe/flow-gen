import { InMemoryNodeDefinitionRegistryService } from '../../core/flow/in-memory-node-definition-registry.service';
import { countNodeConnections, isValidConnectionByNodeType } from './flow-rules.contract';
import { AnyFlowNode, FlowEdge } from './flow.types';

const startNode: AnyFlowNode = {
  id: 'start-1',
  nodeType: 'start',
  label: 'Inicio',
  position: { x: 0, y: 0 },
  metadata: {},
  version: '1.0.0',
  config: {}
};

const actionNode: AnyFlowNode = {
  id: 'action-1',
  nodeType: 'action',
  label: 'Acción',
  position: { x: 100, y: 0 },
  metadata: {},
  version: '1.0.0',
  config: {}
};

const endNode: AnyFlowNode = {
  id: 'end-1',
  nodeType: 'end',
  label: 'Fin',
  position: { x: 200, y: 0 },
  metadata: {},
  version: '1.0.0',
  config: {}
};

describe('flow connection rules', () => {
  const registry = new InMemoryNodeDefinitionRegistryService();

  it('allows valid start -> action connections', () => {
    expect(isValidConnectionByNodeType(startNode, actionNode, registry)).toBeTrue();
  });

  it('rejects invalid end -> action connections', () => {
    expect(isValidConnectionByNodeType(endNode, actionNode, registry)).toBeFalse();
  });

  it('counts incoming and outgoing connections', () => {
    const edges: FlowEdge[] = [
      { id: 'e1', sourceNodeId: 'start-1', targetNodeId: 'action-1' },
      { id: 'e2', sourceNodeId: 'action-1', targetNodeId: 'end-1' },
      { id: 'e3', sourceNodeId: 'start-1', targetNodeId: 'end-1' }
    ];

    expect(countNodeConnections('start-1', edges)).toEqual({ incoming: 0, outgoing: 2 });
    expect(countNodeConnections('end-1', edges)).toEqual({ incoming: 2, outgoing: 0 });
  });
});
