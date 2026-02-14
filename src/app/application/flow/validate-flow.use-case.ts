import { Injectable, inject } from '@angular/core';

import { FlowValidationError, FlowValidationOptions, validateFlow } from '../../domain/flow/flow.validators';
import { Flow } from '../../domain/flow/flow.types';
import { NodeDefinitionRegistry } from '../../domain/ports/node-definition-registry.port';

@Injectable({
  providedIn: 'root'
})
export class ValidateFlowUseCase {
  private readonly nodeDefinitionRegistry = inject(NodeDefinitionRegistry);

  public execute(flow: Flow, options?: FlowValidationOptions): ReadonlyArray<FlowValidationError> {
    return validateFlow(flow, this.nodeDefinitionRegistry, options);
  }
}
