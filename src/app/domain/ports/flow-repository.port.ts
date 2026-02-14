import { FlowEntity } from '../entities/flow.entity';

export abstract class FlowRepositoryPort {
  public abstract getCurrentFlow(): FlowEntity;
}
