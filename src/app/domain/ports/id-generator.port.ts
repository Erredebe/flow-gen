export abstract class IdGenerator {
  public abstract next(prefix: string): string;
}
