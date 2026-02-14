import { TestBed } from '@angular/core/testing';

import { ExportFlowToJsonUseCase } from './export-flow-to-json.use-case';
import { ImportFlowFromJsonUseCase } from './import-flow-from-json.use-case';
import { ExportFlowJsonUseCase } from '../flow/export-flow-json.use-case';
import { SaveFlowUseCase } from '../flow/save-flow.use-case';
import { ValidateFlowUseCase } from '../flow/validate-flow.use-case';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';
import { FlowValidationError } from '../../domain/flow/flow.validators';
import { FlowMigrationPipeline } from '../../domain/flow/migrations/flow-migration.pipeline';

const flowFixture: Flow = {
  id: 'flow-test',
  name: 'Flujo test',
  schemaVersion: FLOW_SCHEMA_VERSION,
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
      id: 'end-1',
      nodeType: 'end',
      label: 'Fin',
      position: { x: 200, y: 0 },
      metadata: {},
      version: '1.0.0',
      config: {}
    }
  ],
  edges: [{ id: 'edge-1', sourceNodeId: 'start-1', targetNodeId: 'end-1' }]
};

describe('ImportFlowFromJsonUseCase & ExportFlowToJsonUseCase', () => {
  let saveFlowUseCaseSpy: jasmine.SpyObj<SaveFlowUseCase>;
  let validateFlowUseCaseSpy: jasmine.SpyObj<ValidateFlowUseCase>;
  let flowMigrationPipelineSpy: jasmine.SpyObj<FlowMigrationPipeline>;

  beforeEach(() => {
    saveFlowUseCaseSpy = jasmine.createSpyObj<SaveFlowUseCase>('SaveFlowUseCase', ['execute']);
    validateFlowUseCaseSpy = jasmine.createSpyObj<ValidateFlowUseCase>('ValidateFlowUseCase', [
      'execute'
    ]);
    flowMigrationPipelineSpy = jasmine.createSpyObj<FlowMigrationPipeline>(
      'FlowMigrationPipeline',
      ['migrate']
    );

    TestBed.configureTestingModule({
      providers: [
        ImportFlowFromJsonUseCase,
        ExportFlowToJsonUseCase,
        ExportFlowJsonUseCase,
        { provide: SaveFlowUseCase, useValue: saveFlowUseCaseSpy },
        { provide: ValidateFlowUseCase, useValue: validateFlowUseCaseSpy },
        { provide: FlowMigrationPipeline, useValue: flowMigrationPipelineSpy }
      ]
    });
  });

  it('imports valid JSON and persists the flow', () => {
    validateFlowUseCaseSpy.execute.and.returnValue([]);
    flowMigrationPipelineSpy.migrate.and.returnValue(flowFixture);
    const useCase = TestBed.inject(ImportFlowFromJsonUseCase);

    const result = useCase.execute(JSON.stringify(flowFixture));

    expect(result.success).toBeTrue();
    expect(flowMigrationPipelineSpy.migrate).toHaveBeenCalledWith(flowFixture);
    expect(saveFlowUseCaseSpy.execute).toHaveBeenCalledWith(flowFixture);
  });

  it('rejects invalid domain flow during import', () => {
    const domainErrors: FlowValidationError[] = [
      { code: 'CYCLE_DETECTED', message: 'cycle detected' }
    ];
    validateFlowUseCaseSpy.execute.and.returnValue(domainErrors);
    flowMigrationPipelineSpy.migrate.and.returnValue(flowFixture);
    const useCase = TestBed.inject(ImportFlowFromJsonUseCase);

    const result = useCase.execute(JSON.stringify(flowFixture));

    expect(result.success).toBeFalse();
    if (!result.success) {
      expect(result.error).toContain('no cumple las reglas del dominio');
      expect(result.error).toContain('cycle detected');
    }
    expect(saveFlowUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('exports flow as formatted JSON', () => {
    const useCase = TestBed.inject(ExportFlowToJsonUseCase);

    const json = useCase.execute(flowFixture);

    expect(JSON.parse(json) as Flow).toEqual(flowFixture);
    expect(json).toContain('\n');
  });
});
