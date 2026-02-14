import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { InMemoryNodeDefinitionRegistryService } from './app/core/flow/in-memory-node-definition-registry.service';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { UuidIdGeneratorService } from './app/core/utils/uuid-id-generator.service';
import { FlowRepository } from './app/domain/ports/flow-repository.port';
import { IdGenerator } from './app/domain/ports/id-generator.port';
import { NodeDefinitionRegistry } from './app/domain/ports/node-definition-registry.port';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    { provide: FlowRepository, useClass: LocalStorageFlowRepository },
    { provide: IdGenerator, useClass: UuidIdGeneratorService },
    { provide: NodeDefinitionRegistry, useClass: InMemoryNodeDefinitionRegistryService }
  ]
}).catch((error: unknown) => {
  console.error('Error bootstrapping application', error);
});
