import { Flow } from '../flow/flow.types';

export abstract class FlowRepository {
  public abstract load(): Flow | null;

  public abstract save(flow: Flow): void;

  public abstract clear(): void;
}
