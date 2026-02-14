import { Injectable } from '@angular/core';

import { NodeDefinition } from '../../domain/flow/node-definition.contract';
import { NodeDefinitionRegistry } from '../../domain/ports/node-definition-registry.port';
import { DEFAULT_NODE_DEFINITIONS } from './default-node-definitions';

@Injectable({
  providedIn: 'root'
})
export class InMemoryNodeDefinitionRegistryService extends NodeDefinitionRegistry {
  private readonly definitions = new Map<string, NodeDefinition>();

  public constructor() {
    super();
    this.registerMany(DEFAULT_NODE_DEFINITIONS);
  }

  public register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  public registerMany(definitions: ReadonlyArray<NodeDefinition>): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  public getDefinition(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  public listDefinitions(): ReadonlyArray<NodeDefinition> {
    return Array.from(this.definitions.values());
  }
}
