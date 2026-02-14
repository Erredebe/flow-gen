import { NodeDefinition } from '../flow/node-definition.contract';

export abstract class NodeDefinitionRegistry {
  public abstract register(definition: NodeDefinition): void;
  public abstract registerMany(definitions: ReadonlyArray<NodeDefinition>): void;
  public abstract getDefinition(type: string): NodeDefinition | undefined;
  public abstract listDefinitions(): ReadonlyArray<NodeDefinition>;
}
