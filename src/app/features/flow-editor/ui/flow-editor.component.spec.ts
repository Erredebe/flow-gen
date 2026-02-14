import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunFlowUseCase } from '../../../application/flow/run-flow.use-case';
import { AnyFlowNode, FLOW_SCHEMA_VERSION, Flow } from '../../../domain/flow/flow.types';
import { IdGenerator } from '../../../domain/ports/id-generator.port';
import { FlowEditorStateService } from '../state/flow-editor-state.service';
import { FlowEditorComponent } from './flow-editor.component';

describe('FlowEditorComponent', () => {
  let fixture: ComponentFixture<FlowEditorComponent>;
  let stateMock: jasmine.SpyObj<FlowEditorStateService>;
  let runFlowUseCaseMock: jasmine.SpyObj<RunFlowUseCase>;
  let idGeneratorMock: jasmine.SpyObj<IdGenerator>;

  const nodes: AnyFlowNode[] = [
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
      label: 'Acción',
      position: { x: 200, y: 0 },
      metadata: {},
      version: '1.0.0',
      config: {}
    }
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
    stateMock.findNodeById.and.callFake((nodeId: string) =>
      nodes.find((node) => node.id === nodeId)
    );
    stateMock.createNode.and.returnValue('action-2');

    runFlowUseCaseMock = jasmine.createSpyObj<RunFlowUseCase>('RunFlowUseCase', ['execute']);
    runFlowUseCaseMock.execute.and.resolveTo({
      status: 'success',
      outputs: {},
      metrics: {
        startedAt: '2024-01-01T00:00:00.000Z',
        finishedAt: '2024-01-01T00:00:01.000Z',
        durationMs: 1000,
        nodeExecutions: 1,
        retries: 0,
        timedOutNodes: 0
      }
    });

    idGeneratorMock = jasmine.createSpyObj<IdGenerator>('IdGenerator', ['next']);
    idGeneratorMock.next.and.returnValues('run-1', 'trace-1');

    await TestBed.configureTestingModule({
      imports: [FlowEditorComponent],
      providers: [
        { provide: FlowEditorStateService, useValue: stateMock },
        { provide: RunFlowUseCase, useValue: runFlowUseCaseMock },
        { provide: IdGenerator, useValue: idGeneratorMock }
      ]
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

    const connectButton = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-actions button')
    ).find((button: HTMLButtonElement) =>
      button.textContent?.includes('Conectar desde este nodo')
    ) as HTMLButtonElement;

    connectButton.click();
    fixture.detectChanges();

    targetNode.click();

    expect(stateMock.createEdge).toHaveBeenCalledWith('start-1', 'action-1');
  });

  it('updates node config from the JSON editor', () => {
    const nodeElements = fixture.nativeElement.querySelectorAll('.node');
    const sourceNode = nodeElements[0] as HTMLElement;

    sourceNode.click();
    fixture.detectChanges();

    const textareas = fixture.nativeElement.querySelectorAll('textarea');
    const configTextarea = textareas[0] as HTMLTextAreaElement;

    configTextarea.value = '{"command":"echo hola","toolName":"shell.exec"}';
    configTextarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(stateMock.updateNode).toHaveBeenCalledWith('start-1', {
      config: { command: 'echo hola', toolName: 'shell.exec' }
    });
  });

  it('runs the flow when clicking execute button', async () => {
    const runButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button: HTMLButtonElement) => button.textContent?.includes('Ejecutar flujo')
    ) as HTMLButtonElement;

    runButton.click();
    await fixture.whenStable();

    expect(runFlowUseCaseMock.execute).toHaveBeenCalled();
  });
});
