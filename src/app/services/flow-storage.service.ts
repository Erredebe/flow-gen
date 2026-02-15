import { Injectable } from '@angular/core';
import { FlowDefinition, ScriptSnippet } from '../models/flow.model';

const FLOW_STORAGE_KEY = 'iv-flow-flows';
const SCRIPT_STORAGE_KEY = 'iv-flow-scripts';

@Injectable({ providedIn: 'root' })
export class FlowStorageService {
  listFlows(): FlowDefinition[] {
    return this.readFromStorage<FlowDefinition>(FLOW_STORAGE_KEY);
  }

  saveFlow(flow: FlowDefinition): void {
    const flows = this.listFlows();
    const existingIndex = flows.findIndex((item) => item.id === flow.id);
    if (existingIndex >= 0) {
      flows[existingIndex] = flow;
    } else {
      flows.push(flow);
    }

    localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flows));
  }

  deleteFlow(flowId: string): void {
    const filtered = this.listFlows().filter((flow) => flow.id !== flowId);
    localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(filtered));
  }

  listScripts(): ScriptSnippet[] {
    return this.readFromStorage<ScriptSnippet>(SCRIPT_STORAGE_KEY);
  }

  saveScript(script: ScriptSnippet): void {
    const scripts = this.listScripts();
    const existingIndex = scripts.findIndex((item) => item.id === script.id || item.name === script.name);
    if (existingIndex >= 0) {
      scripts[existingIndex] = script;
    } else {
      scripts.push(script);
    }

    localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(scripts));
  }

  deleteScript(scriptId: string): void {
    const filtered = this.listScripts().filter((script) => script.id !== scriptId);
    localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(filtered));
  }

  private readFromStorage<T>(key: string): T[] {
    const payload = localStorage.getItem(key);
    if (!payload) {
      return [];
    }

    try {
      return JSON.parse(payload) as T[];
    } catch {
      return [];
    }
  }
}
