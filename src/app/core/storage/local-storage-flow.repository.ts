import { Injectable, inject } from '@angular/core';

import { FlowRepository } from '../../domain/ports/flow-repository.port';
import { FLOW_SCHEMA_VERSION, Flow } from '../../domain/flow/flow.types';
import { safeParseJson } from '../utils/json.utils';
import { LocalStorageService } from './local-storage.service';

const STORAGE_KEY = `flow-gen:flow:v${FLOW_SCHEMA_VERSION}`;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageFlowRepository extends FlowRepository {
  private readonly localStorageService = inject(LocalStorageService);

  public load(): Flow | null {
    const payload = this.localStorageService.getItem(STORAGE_KEY);
    if (!payload) {
      return null;
    }

    return safeParseJson<Flow>(payload);
  }

  public save(flow: Flow): void {
    this.localStorageService.setItem(STORAGE_KEY, JSON.stringify(flow));
  }
}
