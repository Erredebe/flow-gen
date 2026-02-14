import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { FlowRepository } from './app/domain/ports/flow-repository.port';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes), { provide: FlowRepository, useClass: LocalStorageFlowRepository }]
}).catch((error: unknown) => {
  console.error('Error bootstrapping application', error);
});
