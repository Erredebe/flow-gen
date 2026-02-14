import { Injectable } from '@angular/core';

import { ToolRegistryPort } from '../../domain/ports/tool-registry.port';
import { ToolContract } from '../../domain/tools/tool.contract';

@Injectable({
  providedIn: 'root'
})
export class InMemoryToolRegistryAdapter extends ToolRegistryPort {
  private readonly tools = new Map<string, ToolContract>();

  public override register(tool: ToolContract): void {
    this.tools.set(tool.name, tool);
  }

  public override getByName(name: string): ToolContract | undefined {
    return this.tools.get(name);
  }

  public override list(): ReadonlyArray<ToolContract> {
    return Array.from(this.tools.values());
  }
}
