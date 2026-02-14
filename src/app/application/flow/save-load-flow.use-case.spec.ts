import { TestBed } from '@angular/core/testing';

import { LoadFlowUseCase } from './load-flow.use-case';
import { SaveFlowUseCase } from './save-flow.use-case';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';
import { FlowMigrationPipeline } from '../../domain/flow/migrations/flow-migration.pipeline';
import { FlowRepository } from '../../domain/ports/flow-repository.port';

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
    }
  ],
  edges: []
};

describe('SaveFlowUseCase & LoadFlowUseCase', () => {
  let repositorySpy: jasmine.SpyObj<FlowRepository>;
  let migrationPipelineSpy: jasmine.SpyObj<FlowMigrationPipeline>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<FlowRepository>('FlowRepository', ['save', 'load']);
    migrationPipelineSpy = jasmine.createSpyObj<FlowMigrationPipeline>('FlowMigrationPipeline', [
      'migrate'
    ]);

    TestBed.configureTestingModule({
      providers: [
        SaveFlowUseCase,
        LoadFlowUseCase,
        { provide: FlowRepository, useValue: repositorySpy },
        { provide: FlowMigrationPipeline, useValue: migrationPipelineSpy }
      ]
    });
  });

  it('saves flow in repository', () => {
    const useCase = TestBed.inject(SaveFlowUseCase);

    useCase.execute(flowFixture);

    expect(repositorySpy.save).toHaveBeenCalledWith(flowFixture);
  });

  it('loads flow from repository and migrates it', () => {
    repositorySpy.load.and.returnValue(flowFixture);
    migrationPipelineSpy.migrate.and.returnValue(flowFixture);
    const useCase = TestBed.inject(LoadFlowUseCase);

    const flow = useCase.execute();

    expect(repositorySpy.load).toHaveBeenCalled();
    expect(migrationPipelineSpy.migrate).toHaveBeenCalledWith(flowFixture);
    expect(flow).toEqual(flowFixture);
  });
});
