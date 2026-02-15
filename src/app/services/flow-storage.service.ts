import { Injectable } from '@angular/core';
import { FlowDefinition } from '../models/flow.model';

const STORAGE_KEY = 'flow-gen-flows';

@Injectable({ providedIn: 'root' })
export class FlowStorageService {
  listFlows(): FlowDefinition[] {
    const payload = localStorage.getItem(STORAGE_KEY);
    if (!payload) {
      return [];
    }

    try {
      return JSON.parse(payload) as FlowDefinition[];
    } catch {
      return [];
    }
  }

  saveFlow(flow: FlowDefinition): void {
    const flows = this.listFlows();
    const existingIndex = flows.findIndex((item) => item.id === flow.id);
    if (existingIndex >= 0) {
      flows[existingIndex] = flow;
    } else {
      flows.push(flow);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
  }

  deleteFlow(flowId: string): void {
    const filtered = this.listFlows().filter((flow) => flow.id !== flowId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}
