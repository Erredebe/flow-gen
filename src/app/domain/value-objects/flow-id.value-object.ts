export class FlowId {
  private constructor(public readonly value: string) {}

  public static create(value: string): FlowId {
    if (!value.trim()) {
      throw new Error('Flow id cannot be empty');
    }

    return new FlowId(value);
  }
}
