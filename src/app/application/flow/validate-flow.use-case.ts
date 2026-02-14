import { Injectable } from '@angular/core';

import { FlowValidationError, FlowValidationOptions, validateFlow } from '../../domain/flow/flow.validators';
import { Flow } from '../../domain/flow/flow.types';

@Injectable({
  providedIn: 'root'
})
export class ValidateFlowUseCase {
  public execute(flow: Flow, options?: FlowValidationOptions): ReadonlyArray<FlowValidationError> {
    return validateFlow(flow, options);
  }
}
