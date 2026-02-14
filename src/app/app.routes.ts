import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'editor'
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./features/flow-editor/pages/flow-editor-page.component').then(
        (module) => module.FlowEditorPageComponent
      )
  },
  {
    path: 'json',
    loadComponent: () =>
      import('./features/flow-editor/pages/json-view-page.component').then(
        (module) => module.JsonViewPageComponent
      )
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/flow-editor/pages/settings-page.component').then(
        (module) => module.SettingsPageComponent
      )
  },
  {
    path: '**',
    redirectTo: 'editor'
  }
];
