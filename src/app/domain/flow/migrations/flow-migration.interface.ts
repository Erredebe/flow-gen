export interface FlowMigration {
  from: string;
  to: string;
  migrate(flow: unknown): unknown;
}
