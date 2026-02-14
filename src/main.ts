import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { UuidIdGeneratorService } from './app/core/utils/uuid-id-generator.service';
import { IdGenerator } from './app/domain/ports/id-generator.port';
import { FlowRepository } from './app/domain/ports/flow-repository.port';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    { provide: FlowRepository, useClass: LocalStorageFlowRepository },
    { provide: IdGenerator, useClass: UuidIdGeneratorService }
  ]
}).catch((error: unknown) => {
  console.error('Error bootstrapping application', error);
});
