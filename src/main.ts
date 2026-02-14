import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { InMemoryNodeDefinitionRegistryService } from './app/core/flow/in-memory-node-definition-registry.service';
import { RegistryNodeExecutorAdapter } from './app/core/tools/registry-node-executor.adapter';
import { InMemoryToolRegistryAdapter } from './app/core/tools/in-memory-tool-registry.adapter';
import { ToolExecutorAdapter } from './app/core/tools/tool-executor.adapter';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { UuidIdGeneratorService } from './app/core/utils/uuid-id-generator.service';
import { LocalRunRepository } from './app/core/storage/local-run.repository';
import { FlowRepository } from './app/domain/ports/flow-repository.port';
import { IdGenerator } from './app/domain/ports/id-generator.port';
import { NodeDefinitionRegistry } from './app/domain/ports/node-definition-registry.port';
import { ToolExecutorPort } from './app/domain/ports/tool-executor.port';
import { ToolRegistryPort } from './app/domain/ports/tool-registry.port';
import { NodeExecutorPort } from './app/runtime/ports/node-executor.port';
import { RunRepositoryPort } from './app/domain/ports/run-repository.port';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    { provide: FlowRepository, useClass: LocalStorageFlowRepository },
    { provide: IdGenerator, useClass: UuidIdGeneratorService },
    { provide: NodeDefinitionRegistry, useClass: InMemoryNodeDefinitionRegistryService },
    { provide: NodeExecutorPort, useClass: RegistryNodeExecutorAdapter },
    { provide: ToolRegistryPort, useClass: InMemoryToolRegistryAdapter },
    { provide: ToolExecutorPort, useClass: ToolExecutorAdapter },
    { provide: RunRepositoryPort, useClass: LocalRunRepository }
  ]
}).catch((error: unknown) => {
  console.error('Error bootstrapping application', error);
});
