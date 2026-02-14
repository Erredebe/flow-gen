import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnyFlowNode, FLOW_SCHEMA_VERSION, Flow } from '../../../domain/flow/flow.types';
import { FlowEditorStateService } from '../state/flow-editor-state.service';
import { FlowEditorComponent } from './flow-editor.component';

describe('FlowEditorComponent', () => {
  let fixture: ComponentFixture<FlowEditorComponent>;
  let stateMock: jasmine.SpyObj<FlowEditorStateService>;

  const nodes: AnyFlowNode[] = [
    { id: 'start-1', type: 'start', label: 'Inicio', position: { x: 0, y: 0 }, metadata: {} },
    { id: 'action-1', type: 'action', label: 'Acción', position: { x: 200, y: 0 }, metadata: {} }
  ];

  const flowFixture: Flow = {
    id: 'flow-1',
    name: 'Flujo de prueba',
    schemaVersion: FLOW_SCHEMA_VERSION,
    nodes,
    edges: []
  };

  beforeEach(async () => {
    stateMock = jasmine.createSpyObj<FlowEditorStateService>('FlowEditorStateService', [
      'getDraft',
      'getValidationErrors',
      'findNodeById',
      'createNode',
      'createEdge',
      'removeNode',
      'removeEdge',
      'moveNode',
      'renameFlow',
      'updateNode'
    ]);

    stateMock.getDraft.and.returnValue(flowFixture);
    stateMock.getValidationErrors.and.returnValue([]);
    stateMock.findNodeById.and.callFake((nodeId: string) => nodes.find((node) => node.id === nodeId));
    stateMock.createNode.and.returnValue('action-2');

    await TestBed.configureTestingModule({
      imports: [FlowEditorComponent],
      providers: [{ provide: FlowEditorStateService, useValue: stateMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(FlowEditorComponent);
    fixture.detectChanges();
  });

  it('creates node when clicking add action button', () => {
    const addActionButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button: HTMLButtonElement) => button.textContent?.includes('+ Acción')
    ) as HTMLButtonElement;

    addActionButton.click();

    expect(stateMock.createNode).toHaveBeenCalledWith('action');
  });

  it('connects selected node with target node through linking mode', () => {
    const nodeElements = fixture.nativeElement.querySelectorAll('.node');
    const sourceNode = nodeElements[0] as HTMLElement;
    const targetNode = nodeElements[1] as HTMLElement;

    sourceNode.click();
    fixture.detectChanges();

    const connectButton = Array.from(fixture.nativeElement.querySelectorAll('.panel-actions button')).find(
      (button: HTMLButtonElement) => button.textContent?.includes('Conectar desde este nodo')
    ) as HTMLButtonElement;

    connectButton.click();
    fixture.detectChanges();

    targetNode.click();

    expect(stateMock.createEdge).toHaveBeenCalledWith('start-1', 'action-1');
  });
});
